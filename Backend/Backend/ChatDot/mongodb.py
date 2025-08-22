from mongoengine import Document, StringField, DateTimeField , BooleanField, ListField, ImageField, FileField
import datetime

class ChatMessage(Document):
    sender = StringField(required=True)
    receiver = StringField(required=True)
    message = StringField(required=False,default="")
    timestamp = DateTimeField(default=datetime.datetime.utcnow)
    seen = BooleanField(default=False)  
    is_deleted = BooleanField(default=False)
    is_bothdeleted = BooleanField(default=False)
    deleted_by = ListField(StringField())
    is_deleted_by = ListField(StringField())
    is_bothdeleted_by = StringField(required=False)
    is_edited = BooleanField(default=False)
    is_cleared_by = ListField(StringField(), default=list)
    is_cleared_by_time = DateTimeField()
    is_ghost_delivery = BooleanField(default=False)  
    format = StringField(required=True, default="text")
    images = ImageField( default="")
    voice = FileField(default="")
    video = FileField(default="")
    document = FileField(default="") 


class Connections(Document):
    me = StringField(required=True)
    my_friend = StringField(required=True)
    connected_timestamp = DateTimeField(null=True, blank=True, required=False)
    last_message = StringField(null=True, blank=True, required=False)
    last_message_time = DateTimeField(null=True, blank=True, required=False)
    is_blocked_by = ListField(StringField())


