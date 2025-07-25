from mongoengine import Document, StringField, DateTimeField
import datetime

class ChatMessage(Document):
    sender = StringField(required=True)
    receiver = StringField(required=True)
    message = StringField(required=True)
    timestamp = DateTimeField(default=datetime.datetime.utcnow)
    datetime=DateTimeField(required=True)