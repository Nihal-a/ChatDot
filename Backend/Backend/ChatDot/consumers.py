import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import sync_to_async
from .mongodb import ChatMessage
from datetime import datetime

User = get_user_model()

# consumers.py
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

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get("type", "message")

            if msg_type == "seen":
                sender = data.get("sender")
                receiver = data.get("receiver")
                if sender and receiver:
                    await sync_to_async(ChatMessage.objects.filter(
                        sender=receiver,
                        receiver=sender,
                        seen=False
                    ).update)(seen=True)
                    print(f"✅ Marked messages as seen from {receiver} to {sender}")

            elif msg_type == "message":
                message = data['message']
                receiver = data['rec']
                current_time = datetime.now()

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'sender': self.user.username,
                        'message': message,
                        'receiver': receiver,
                        'datetime': current_time.isoformat()
                    }
                )

                chat_message = ChatMessage(
                    sender=self.user.username,
                    receiver=receiver,
                    message=message,
                    datetime=current_time,
                    seen=False
                )
                await sync_to_async(chat_message.save)()

        except Exception as e:
            print("Error in receive():", e)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event['message'],
            'datetime': event['datetime']
        }))
