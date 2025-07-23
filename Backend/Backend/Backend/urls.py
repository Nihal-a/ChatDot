
from django.contrib import admin
from django.urls import path,include
from ChatDot.views import *


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('ChatDot.urls')),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh-cookie/', refresh_cookie_view),
    path('api/token/verify/', TokenVerifyView.as_view()),

]
