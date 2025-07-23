from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async


User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return None


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope["query_string"].decode()
        token = parse_qs(query_string).get("token", [None])[0]
        scope["user"] = await get_user_from_token(token)
        return await self.app(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    from channels.sessions import CookieMiddleware, SessionMiddlewareStack
    return JWTAuthMiddleware(SessionMiddlewareStack(inner))