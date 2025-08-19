import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.exceptions import DenyConnection
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import sync_to_async
from .mongodb import *
from datetime import datetime,timedelta
from bson import ObjectId 
from django.db.models import Q
from mongoengine.queryset.visitor import Q
from django.utils.timezone import localtime
import base64
from django.core.files.base import ContentFile

User = get_user_model()

ACTIVE_CHAT_SESSIONS = {}

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
        
        if self.user.username not in ACTIVE_CHAT_SESSIONS:
            ACTIVE_CHAT_SESSIONS[self.user.username] = {}
        ACTIVE_CHAT_SESSIONS[self.user.username][self.room_name] = self.channel_name
        
        await self.accept()
        
        participants = self.room_name.split('_')
        other_user = None
        for participant in participants:
            if participant != self.user.username:
                other_user = participant
                break
        
        if other_user:
            connection_exists = await self.check_connection_and_block_status(self.user.username, other_user)
            if not connection_exists['exists'] or connection_exists['is_blocked']:
                print(f"Connection blocked or doesn't exist between {self.user.username} and {other_user}")
                return
                
            updated_count = await sync_to_async(ChatMessage.objects.filter(
                sender=other_user,
                receiver=self.user.username,
                seen=False
            ).update)(seen=True)
            
            print(f"🔥 On connect: Marked {updated_count} messages as seen from {other_user} to {self.user.username}")
            
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
        if hasattr(self, 'user') and self.user.username in ACTIVE_CHAT_SESSIONS:
            if hasattr(self, 'room_name') and self.room_name in ACTIVE_CHAT_SESSIONS[self.user.username]:
                del ACTIVE_CHAT_SESSIONS[self.user.username][self.room_name]
                if not ACTIVE_CHAT_SESSIONS[self.user.username]:
                    del ACTIVE_CHAT_SESSIONS[self.user.username]
        
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def check_connection_and_block_status(self, user1, user2):
        """Check if connection exists and block status"""
        try:
            ordered_user1 = min(user1, user2)
            ordered_user2 = max(user1, user2)
            
            connection = await sync_to_async(
                Connections.objects(me=ordered_user1, my_friend=ordered_user2).first
            )()
            
            if not connection:
                return {'exists': False, 'is_blocked': False, 'blocked_by': None}
            
            is_blocked = user1 in connection.is_blocked_by or user2 in connection.is_blocked_by
            blocked_by = []
            if user1 in connection.is_blocked_by:
                blocked_by.append(user1)
            if user2 in connection.is_blocked_by:
                blocked_by.append(user2)
                
            return {
                'exists': True, 
                'is_blocked': is_blocked, 
                'blocked_by': blocked_by,
                'connection': connection
            }
        except Exception as e:
            print(f"Error checking connection: {e}")
            return {'exists': False, 'is_blocked': False, 'blocked_by': None}

    def is_user_in_active_chat(self, username, room_name):
        """Check if user is actively in a specific chat room"""
        return (username in ACTIVE_CHAT_SESSIONS and 
                room_name in ACTIVE_CHAT_SESSIONS[username])

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get("type", "message")
            # print(f"Received message type: {msg_type}, data: {data}")

            if msg_type == "clearchat":
                await self.handle_clear_chat(data)
                
            elif msg_type == "deleteMe":
                await self.handle_delete_me(data)
                
            elif msg_type == "block":
                await self.handle_block(data)
                
            elif msg_type == "unblock":
                await self.handle_unblock(data)
                
            elif msg_type == "deleteBoth":
                await self.handle_delete_both(data)
                
            elif msg_type == "edit":
                await self.handle_edit_message(data)
                
            elif msg_type == "seen":
                await self.handle_seen(data)
                
            elif msg_type == "message":
                await self.handle_message(data)
                
            elif msg_type == "images":
                await self.handle_images(data)

        except Exception as e:
            print("Error in receive():", e)

    async def handle_clear_chat(self, data):
        clear_time_str = data.get("time")
        username = data.get("user")
        friend = data.get("to")

        if not clear_time_str or not username or not friend:
            print("Missing required fields")
            return

        try:
            clear_time = datetime.fromisoformat(clear_time_str.replace("Z", "+00:00"))
        except Exception as e:
            print("Time parse error:", e)
            return

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

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "clear_chat_message_broadcast",
                "clear_time": clear_time_str,
                "user": username,
            }
        )

    async def handle_delete_me(self, data):
        msg_id = data.get("id")
        user = data.get("user")
        
        msg = await sync_to_async(ChatMessage.objects(id=ObjectId(msg_id)).first)()
        if msg:
            if isinstance(msg.is_deleted_by, list):
                await sync_to_async(msg.update)(push__is_deleted_by=user)
            else:
                await sync_to_async(msg.update)(set__is_deleted_by=[user])

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "delete_me_message_broadcast",
                    "id": msg_id,
                    "user": user,
                }
            )

    async def handle_block(self, data):
        to = data.get("to")
        user = data.get("user")
        
        connection_status = await self.check_connection_and_block_status(user, to)
        if not connection_status['exists']:
            print(f"No connection exists between {user} and {to}")
            return

        await sync_to_async(Connections.objects(
            Q(me=user, my_friend=to) | Q(me=to, my_friend=user)
        ).update)(push__is_blocked_by=user)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "block_message_broadcast",
                "to": to,
                "user": user,
            }
        )

    async def handle_unblock(self, data):
        to = data.get("to")
        user = data.get("user")
        
        await sync_to_async(Connections.objects(
            Q(me=user, my_friend=to) | Q(me=to, my_friend=user)
        ).update)(pull__is_blocked_by=user)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "unblock_message_broadcast",
                "to": to,
                "user": user,
            }
        )

    async def handle_delete_both(self, data):
        msg_id = data.get("id")
        user = data.get("user")
        
        await sync_to_async(ChatMessage.objects(id=ObjectId(msg_id)).update_one)(
            set__is_bothdeleted=True, set__is_bothdeleted_by=user
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "delete_both_message_broadcast",
                "id": msg_id,
                "user": user,
            }
        )

    async def handle_edit_message(self, data):
        msg_id = data.get("id")
        new_msg = data.get("new_msg")
        
        await sync_to_async(ChatMessage.objects(id=ObjectId(msg_id)).update_one)(
            set__message=new_msg, set__is_edited=True
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "edit_message_broadcast",
                "id": msg_id,
                "new_msg": new_msg,
            }
        )

    async def handle_seen(self, data):
        sender = data.get("sender") 
        receiver = data.get("receiver")  
        
        if sender and receiver:
            connection_status = await self.check_connection_and_block_status(sender, receiver)
            if not connection_status['exists'] or connection_status['is_blocked']:
                print(f"Cannot mark as seen - connection blocked or doesn't exist")
                return
                
            updated_count = await sync_to_async(ChatMessage.objects.filter(
                sender=receiver,
                receiver=sender, 
                seen=False
            ).update)(seen=True)
            
            print(f"✅ Manual seen: Marked {updated_count} messages as seen from {receiver} to {sender}")
            
            if updated_count > 0:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'seen_update',
                        'seen_by': sender,
                        'message_sender': receiver,
                    }
                )

    async def handle_message(self, data):
        message = data['message']
        receiver = data['rec']
        current_time = datetime.now()

        connection_status = await self.check_connection_and_block_status(self.user.username, receiver)
        
        if not connection_status['exists']:
            print(f"No connection exists between {self.user.username} and {receiver}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'No connection exists with this user'
            }))
            return
            
        if connection_status['is_blocked']:
            if self.user.username in connection_status['blocked_by']:
                print(f"{self.user.username} has blocked {receiver}, cannot send message")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You have blocked this user. Unblock to send messages.'
                }))
                return
            elif receiver in connection_status['blocked_by']:
                print(f"{receiver} has blocked {self.user.username}, cannot send message")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You cannot send messages to this user.'
                }))
                return

        user1 = min(self.user.username, receiver)
        user2 = max(self.user.username, receiver)

        connection = connection_status['connection']
        if connection:
            connection.last_message = message
            connection.last_message_time = current_time
            await sync_to_async(connection.save)()

        chat_message = ChatMessage(
            sender=self.user.username,
            receiver=receiver,
            message=message,
            format="text",
            timestamp=current_time,
            seen=False,
        )
        await sync_to_async(chat_message.save)()

        receiver_room_name = self.room_name
        is_receiver_active = self.is_user_in_active_chat(receiver, receiver_room_name)

        if is_receiver_active:
            await sync_to_async(chat_message.update)(seen=True)
            print(f"📱 Receiver {receiver} is active in chat, marking message as seen")

        await self.send_sidebar_update(
            receiver_username=receiver,
            sender_username=self.user.username,
            message=message,
            timestamp=current_time,
            is_receiver_active=is_receiver_active
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': str(chat_message.id),
                'sender': self.user.username,
                'message': message,
                'format': 'text',
                'receiver': receiver,
                'datetime': current_time.isoformat(),
                'seen': is_receiver_active  # Include seen status
            }
        )

    async def handle_images(self, data):
        base64_data = data['images']
        
        format, imgstr = base64_data.split(';base64,')
        ext = format.split('/')[-1]
        image_content = ContentFile(base64.b64decode(imgstr), name=data['filename'])
        print(image_content)
        receiver = data['rec']
        current_time = datetime.now()

        connection_status = await self.check_connection_and_block_status(self.user.username, receiver)
        
        if not connection_status['exists']:
            print(f"No connection exists between {self.user.username} and {receiver}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'No connection exists with this user'
            }))
            return
            
        if connection_status['is_blocked']:
            if self.user.username in connection_status['blocked_by']:
                print(f"{self.user.username} has blocked {receiver}, cannot send message")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You have blocked this user. Unblock to send messages.'
                }))
                return
            elif receiver in connection_status['blocked_by']:
                print(f"{receiver} has blocked {self.user.username}, cannot send message")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'You cannot send messages to this user.'
                }))
                return

        user1 = min(self.user.username, receiver)
        user2 = max(self.user.username, receiver)

        connection = connection_status['connection']
        if connection:
            connection.last_message = "📷 image"
            connection.last_message_time = current_time
            await sync_to_async(connection.save)()

        chat_message = ChatMessage(
            sender=self.user.username,
            receiver=receiver,
            images=image_content,    
            format="image",
            timestamp=current_time,
            seen=False
        )
        await sync_to_async(chat_message.save)()

        receiver_room_name = self.room_name
        is_receiver_active = self.is_user_in_active_chat(receiver, receiver_room_name)

        if is_receiver_active:
            await sync_to_async(chat_message.update)(seen=True)
            print(f"📱 Receiver {receiver} is active in chat, marking message as seen")

        await self.send_sidebar_update(
            receiver_username=receiver,
            sender_username=self.user.username,
            message="📷 image",
            timestamp=current_time,
            is_receiver_active=is_receiver_active
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_images',
                'id': str(chat_message.id),
                'sender': self.user.username,
                'images': base64_data,
                'receiver': receiver,
                'datetime': current_time.isoformat(),
                'seen': is_receiver_active,
                'format':'image'
            }
        )

    async def send_sidebar_update(self, receiver_username, sender_username, message, timestamp, is_receiver_active=False):
        """Send sidebar updates with proper unseen count logic"""
        
        unseen_count = await sync_to_async(ChatMessage.objects.filter(
            sender=sender_username,
            receiver=receiver_username,
            seen=False
        ).count)()
        
        if is_receiver_active:
            unseen_count = 0
        
        print(f"📊 Sidebar update - Receiver: {receiver_username}, Unseen: {unseen_count}, Active: {is_receiver_active}")


        today = datetime.now().strftime("%d %B %Y")
        formatted_date = timestamp.strftime("%d %B %Y")
        yesterday = (datetime.now()-timedelta(days=1)).strftime("%d %B %Y")

        if today==formatted_date :
            date_key = timestamp.isoformat()
        elif yesterday==formatted_date:
            date_key = "Yesterday"
        else:
            date_key = timestamp.isoformat()

        await self.channel_layer.group_send(
            f"user_{sender_username}",
            {
                "type": "sidebar_update", 
                "data": {
                    "username": receiver_username,
                    "last_msg": message,
                    "last_msg_time": date_key,
                    "unseen_count": 0  
                }
            }
        )
        
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
            'id': event['id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'message': event['message'],
            'datetime': event['datetime'],
            'format': event['format'],
            'seen': event.get('seen', False)
        }))


    async def chat_images(self, event):
        await self.send(text_data=json.dumps({
            'type': 'image',
            'id': event['id'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'format': event['format'],
            'images': event['images'],
            'datetime': event['datetime'],
            'seen': event.get('seen', False),
            
        }))


    async def seen_update(self, event):
        """Handle seen status updates"""
        await self.send(text_data=json.dumps({
            'type': 'seen',
            'seen_by': event['seen_by'],
            'message_sender': event['message_sender'],
        }))

    async def delete_me_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "deleteMe",
            "id": event["id"],
            "user": event["user"],
        }))

    async def clear_chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "clear_time": event["clear_time"],
            "type": "clearchat",
            "user": event["user"],
        }))

    async def block_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "block",
            "user": event["user"],
            "to": event["to"],
        }))

    async def unblock_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "unblock",
            "user": event["user"],
            "to": event["to"],
        }))

    async def delete_both_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "deleteBoth",
            "id": event["id"],
            "user": event["user"],
        }))

    async def edit_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "edit",
            "id": event["id"],
            "new_msg": event["new_msg"]
        }))

    async def sidebar_update(self, event):
        """Handle sidebar updates"""
        await self.send(text_data=json.dumps({
            "type": "sidebar_update",
            "data": event["data"]
        }))