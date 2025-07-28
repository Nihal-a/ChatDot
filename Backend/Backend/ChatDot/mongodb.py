from mongoengine import Document, StringField, DateTimeField , BooleanField
import datetime

class ChatMessage(Document):
    sender = StringField(required=True)
    receiver = StringField(required=True)
    message = StringField(required=True)
    timestamp = DateTimeField(default=datetime.datetime.utcnow)
    seen = BooleanField(default=False)  
    is_deleted = BooleanField(default=False)
    is_bothdeleted = BooleanField(default=False)
    datetime = DateTimeField(default=datetime.datetime.utcnow)