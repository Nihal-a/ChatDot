from django.urls import path
from ChatDot.consumers import ChatConsumer  # Adjust the import to match your app

websocket_urlpatterns = [
    path("ws/chat/<str:room_name>/", ChatConsumer.as_asgi()),
]