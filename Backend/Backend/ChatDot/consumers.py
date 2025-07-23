


import json
from channels.generic.websocket import AsyncWebsocketConsumer
# from .models import User  # 
from django.contrib.auth import get_user_model
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import sync_to_async
from .mongodb import ChatMessage  # Assuming you have a ChatMessage model in mongodb.py

User = get_user_model()
print(f"User model: {User}")

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['query_string'].decode().split('token=')[-1]
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await sync_to_async(User.objects.get)(id=user_id)
        except Exception as e:
            print("Invalid token", e)
            raise DenyConnection("Unauthorized")
        
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Received message from WebSocket: {data}")
        message = data['message']
        receiver = data['rec']

        

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'sender': self.user.username,
                'message': message,
                'receiver': receiver

            }
        )

        chat_message = ChatMessage(
            sender=self.user.username,
            message=message,
            receiver=receiver
        )
        await sync_to_async(chat_message.save)()

        print(f"Message saved to MongoDB: {chat_message}")
        
       

    # Receive message from room group
    async def chat_message(self, event):
        print(f"Received message from room group: {event}")
        sender = event['sender']
        message = event['message']
        receiver = event['receiver']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
            'receiver': receiver
        }))