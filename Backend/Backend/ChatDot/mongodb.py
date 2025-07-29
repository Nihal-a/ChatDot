from mongoengine import Document, StringField, DateTimeField , BooleanField, ListField
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
    deleted_by = ListField(StringField())
    is_deleted_by = ListField(StringField())
    is_bothdeleted_by = StringField(required=False)
    is_edited = BooleanField(default=False)

