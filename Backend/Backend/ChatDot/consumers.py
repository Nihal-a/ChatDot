import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import sync_to_async
from .mongodb import *
from datetime import datetime
from bson import ObjectId 
from django.db.models import Q
from mongoengine.queryset.visitor import Q

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


        self.user_group_name = f"user_{self.user.username}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
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
        
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
          
            msg_type = data.get("type", "message")
            print(data)


            if msg_type == "clearchat":
                clear_time_str = data.get("time")
                username = data.get("user")
                friend = data.get("to")  # This should be sent from frontend

                if not clear_time_str or not username or not friend:
                    print("Missing required fields")
                    return

                # Parse the incoming ISO string to datetime
                try:
                    clear_time = datetime.fromisoformat(clear_time_str.replace("Z", "+00:00"))
                except Exception as e:
                    print("Time parse error:", e)
                    return

                # Update all messages between user and friend before clear_time
                # using the correct field: `timestamp` (not `created_at`)
                result = ChatMessage.objects(
                    __raw__={
                        "$or": [
                            {"sender": username, "receiver": friend},
                            {"sender": friend, "receiver": username},
                        ],
                        "timestamp": {"$lte": clear_time},
                        "is_cleared_by": {"$ne": username}
                    }
                ).update(push__is_cleared_by=username)

                Connections.objects(
                    __raw__={
                        "$or": [
                            {"me": username, "my_friend": friend},
                            {"my_friend": friend, "me": username},
                        ],
                    }
                ).update(set__last_message=None, set__last_message_time=None)



                print(f"Cleared {result} messages for {username} before {clear_time}")

                # Send broadcast to frontend for local update
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "clear_chat_message_broadcast",
                        "clear_time": clear_time_str,
                        "user": username,
                    }
                )

            if msg_type=="deleteMe":
                msg_id=data.get("id")
                print
                user=data.get("user")
                msg = ChatMessage.objects(id=ObjectId(msg_id)).first()
                if isinstance(msg.is_deleted_by, list):
                    msg.update(push__is_deleted_by=user)
                else:
                    msg.update(set__is_deleted_by=[user])

              
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "delete_me_message_broadcast",
                            "id": msg_id,
                            "user": user,
                        }
                    )
                

            if msg_type=="block":
                to=data.get("to")
                user=data.get("user")
                print(to)
                print(user)
                res = Connections.objects(
                    Q(me=user, my_friend=to) | Q(me=to, my_friend=user)
                ).update(push__is_blocked_by=user)

                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "block_message_broadcast",
                            "to": to,
                            "user": user,
                        }
                    )
                

            if msg_type=="unblock":
                to=data.get("to")
                user=data.get("user")
                res = Connections.objects(
                    Q(me=user, my_friend=to) | Q(me=to, my_friend=user)
                ).update(pull__is_blocked_by=user)

              
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "unblock_message_broadcast",
                            "to": to,
                            "user": user,
                        }
                    )
                


            if msg_type=="deleteBoth":
                print(data)
                msg_id=data.get("id")
                user=data.get("user")
                ChatMessage.objects(id=ObjectId(msg_id)).update_one(set__is_bothdeleted=True)
                ChatMessage.objects(id=ObjectId(msg_id)).update_one(set__is_bothdeleted_by=user)
              

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "delete_both_message_broadcast",
                        "id": msg_id,
                        "user": user,
                    }
                )

            if msg_type=="edit":
                print(data)
                msg_id=data.get("id")
                new_msg=data.get("new_msg")
                ChatMessage.objects(id=ObjectId(msg_id)).update_one(set__message=new_msg)
                ChatMessage.objects(id=ObjectId(msg_id)).update_one(set__is_edited=True)
              

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "edit_message_broadcast",
                        "id": msg_id,
                        "new_msg":new_msg,
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

                    # unseen_count = await sync_to_async(ChatMessage.objects.filter(
                    #     sender=receiver, receiver=sender, seen=False
                    # ).count)()

                    # await self.channel_layer.group_send(
                    #     f"user_{sender}",  # person who just opened the chat
                    #     {
                    #         "type": "sidebar_update",
                    #         "data": {
                    #             "username": receiver,
                    #             "unread_count": unseen_count  # should be 0 now
                    #         }
                    #     }
                    # )


            elif msg_type == "message":
                message = data['message']
                receiver = data['rec']
                print(receiver)
                current_time = datetime.now()


                # Ensure consistent ordering
                user1 = min(self.user.username, receiver)
                user2 = max(self.user.username, receiver)

                conn = Connections.objects(me=user1, my_friend=user2).first()

                if conn:
                    conn.last_message = message
                    conn.last_message_time = current_time
                    conn.save()
                else:
                    print("Connection not found")

                # Save message to database first
                chat_message = ChatMessage(
                    sender=self.user.username,
                    receiver=receiver,
                    message=message,
                    datetime=current_time,
                    seen=False  # Always start as false
                )
                await sync_to_async(chat_message.save)()

                

                await self.send_sidebar_update(
                    receiver_username=receiver,
                    sender_username=self.user.username,
                    message=message,
                    timestamp=current_time
                )
             

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


    async def send_sidebar_update(self, receiver_username, sender_username, message, timestamp, is_active_chat=False):
        # Count unseen messages from sender to receiver
        unseen_count = await sync_to_async(ChatMessage.objects.filter(
            sender=sender_username,
            receiver=receiver_username,
            seen=False
        ).count)()
        
        # If it's an active chat, the unseen count should be 0 for the receiver
        if is_active_chat:
            unseen_count = 0
        
        print(f"Sending sidebar update - unseen count: {unseen_count}, is_active_chat: {is_active_chat}")


        # Send to sender (person who sent the message) with unseen_count = 0
        await self.channel_layer.group_send(
            f"user_{sender_username}",
            {
                "type": "sidebar_update", 
                "data": {
                    "username": receiver_username,
                    "last_msg": message,
                    "last_msg_time": timestamp.isoformat(),
                    "unseen_count": 0  # Sender has no unseen messages
                }
            }
        )
        # Send to receiver (person getting the message)
        await self.channel_layer.group_send(
            f"user_{receiver_username}",
            {
                "type": "sidebar_update",
                "data": {
                    "username": sender_username,
                    "last_msg": message,
                    "last_msg_time": timestamp.isoformat(),
                    "unseen_count": unseen_count
                }
            }
        )



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
            "user": event["user"],
        }))


    async def clear_chat_message_broadcast(self, event):

        await self.send(text_data=json.dumps({
            "clear_time":event["clear_time"],
            "type": "clearchat",
            "user": event["user"],
        }))

    async def block_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "block",
            "user":event["user"],
            "to": event["to"],
        }))

    async def unblock_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "unblock",
            "user":event["user"],
            "to": event["to"],
        }))


    async def delete_both_message_broadcast(self, event):
        msg_id = event["id"]

        await self.send(text_data=json.dumps({
            "type": "deleteBoth",
            "id": msg_id,
            "user": event["user"],
        }))


    async def edit_message_broadcast(self, event):
        msg_id = event["id"]
        new_msg=event["new_msg"]

        await self.send(text_data=json.dumps({
            "type": "edit",
            "id": msg_id,
            "new_msg":new_msg
        }))


    async def sidebar_update(self, event):
        print("sidebar update rubnning")
        await self.send(text_data=json.dumps({
            "type": "sidebar_update",
            "data": event["data"]
        }))