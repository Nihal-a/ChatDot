import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import sync_to_async
from .mongodb import ChatMessage
from datetime import datetime
from bson import ObjectId 

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            token = self.scope['query_string'].decode().split('token=')[-1]
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await sync_to_async(User.objects.get)(id=user_id)
        except Exception as e:
            print("Invalid token:", e)
            return await self.close()

        try:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
        except KeyError:
            print("Missing room_name in URL route.")
            return await self.close()

        self.room_group_name = f'chat_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        # 🔥 NEW: When user connects, mark all unread messages from other user as seen
        participants = self.room_name.split('_')
        other_user = None
        for participant in participants:
            if participant != self.user.username:
                other_user = participant
                break
        
        if other_user:
            # Mark messages from other user to current user as seen
            updated_count = await sync_to_async(ChatMessage.objects.filter(
                sender=other_user,
                receiver=self.user.username,
                seen=False
            ).update)(seen=True)
            
            print(f"🔥 On connect: Marked {updated_count} messages as seen from {other_user} to {self.user.username}")
            
            # Broadcast seen status if there were unread messages
            if updated_count > 0:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'seen_update',
                        'seen_by': self.user.username,
                        'message_sender': other_user,
                    }
                )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get("type", "message")

            if msg_type=="deleteMe":
                msg_id=data.get("id")
                print(msg_id)
                ChatMessage.objects(id=ObjectId(msg_id)).update_one(set__is_deleted=True)
                print("ookok")

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "delete_me_message_broadcast",
                        "id": msg_id,
                    }
                )



            if msg_type == "seen":
                sender = data.get("sender")  # who is marking as seen (current user)
                receiver = data.get("receiver")  # whose messages are being marked as seen
                
                if sender and receiver:
                    # Update messages FROM receiver TO sender (not the other way around)
                    updated_count = await sync_to_async(ChatMessage.objects.filter(
                        sender=receiver,  # Messages sent by the other person
                        receiver=sender,  # To current user
                        seen=False
                    ).update)(seen=True)
                    
                    print(f"✅ Manual seen: Marked {updated_count} messages as seen from {receiver} to {sender}")
                    
                    # Broadcast seen status back to the message sender
                    if updated_count > 0:
                        await self.channel_layer.group_send(
                            self.room_group_name,
                            {
                                'type': 'seen_update',
                                'seen_by': sender,  # who saw the messages
                                'message_sender': receiver,  # whose messages were seen
                            }
                        )

            elif msg_type == "message":
                message = data['message']
                receiver = data['rec']
                current_time = datetime.now()

                # Save message to database first
                chat_message = ChatMessage(
                    sender=self.user.username,
                    receiver=receiver,
                    message=message,
                    datetime=current_time,
                    seen=False  # Always start as false
                )
                await sync_to_async(chat_message.save)()
             

                # Then broadcast to room
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'id': str(chat_message.id),
                        'sender': self.user.username,
                        'message': message,
                        'receiver': receiver,
                        'datetime': current_time.isoformat()
                    }
                )

        except Exception as e:
            print("Error in receive():", e)

    async def chat_message(self, event):
        """Handle regular chat messages"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'id':event['id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event['message'],
            'datetime': event['datetime']
        }))

    async def seen_update(self, event):
        """Handle seen status updates"""
        await self.send(text_data=json.dumps({
            'type': 'seen',
            'seen_by': event['seen_by'],
            'message_sender': event['message_sender'],
        }))


    async def delete_me_message_broadcast(self, event):
        msg_id = event["id"]

        await self.send(text_data=json.dumps({
            "type": "deleteMe",
            "id": msg_id,
        }))