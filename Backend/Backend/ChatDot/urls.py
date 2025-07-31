from django.urls import path
from .views import *
from django.conf import settings
from django.conf.urls.static import static



urlpatterns = [
    path('api/login',Login),
    path('api/logout',logout_view),
    path('api/register',Register),
    path('api/email_verification',Email_verification),
    path('api/otp_verification',otp_verification),
    path('api/username_validation',username_validation),
    path('api/get_userdata',get_userdata),
    path('api/get_messages',get_messages),
    path('api/get_users',get_users),
    path('api/otpfor_resetpass',otpfor_resetpass),
    path('api/change_password',change_password),
    path('api/search_users',search_users),
    path('api/fake_view',fake_view),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
