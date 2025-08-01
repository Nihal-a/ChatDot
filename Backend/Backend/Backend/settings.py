from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = 'django-insecure-e5y5+fsob1n759$42^ytw7va4f@%dcu^ly5=2$hkd)$6hur+62'

DEBUG = True

ALLOWED_HOSTS = ['*']


INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'ChatDot',
    'rest_framework_simplejwt',
    'rest_framework.authtoken',
    'corsheaders',
    'rest_framework_simplejwt.token_blacklist'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Backend.wsgi.application'


ASGI_APPLICATION = 'Backend.asgi.application'

# Channels configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
       
    },
}


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'chatdotdb',
        'USER':'root',
        'PASSWORD':'',
        'HOST':'localhost',
        'PORT':'3306',
       
    }
}


from mongoengine import connect
from urllib.parse import quote_plus
from ChatDot.mongodb import ChatMessage,Connections 
import certifi

username = quote_plus("blackeye")
password = quote_plus("password@333")  

connect(
    db="chatDotDB",
    host=f"mongodb+srv://{username}:{password}@chatdotcluster.yvfb65n.mongodb.net/?retryWrites=true&w=majority&appName=ChatDotCluster",
    alias="default",
    tls=True,
    tlsCAFile=certifi.where()
)

ChatMessage.objects(is_active__exists=False).update(set__is_active=True)  #to set new field in exsting datas
# ChatMessage.objects(is_deleted_by__exists=False).update(set__is_deleted_by=[])

from mongoengine import *



# msg=Connections(
#     me="nihal",
#     my_friend="mohammed",
#     block=False   
# )
# msg.save()


# for msg in ChatMessage.objects():
#     if isinstance(msg.is_deleted_by, str):
#         msg.is_deleted_by = [msg.is_deleted_by]
#         msg.save()
    


import os

MEDIA_URL = 'media/' 
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


CORS_ALLOW_ALL_ORIGINS = True  #development purpose only, use with caution in production
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    'http://192.168.1.65:5173',
    'http://192.168.18.144:5173',
    # "http://127.0.0.1:5173", 
    
]


AUTH_USER_MODEL = 'ChatDot.User'
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
   
}



from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=10),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_COOKIE': 'refresh_token',  # custom key
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
    'AUTH_COOKIE_SECURE': False,  # Set True in production (HTTPS)
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
}

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]

EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST='smtp.gmail.com'
EMAIL_PORT=587
EMAIL_HOST_USER='blackeye0265@gmail.com'
EMAIL_HOST_PASSWORD='kyyypfokzpzpioiz'
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL ='blackeye0265@gmail.com'
EMAIL_USE_SSL = False 


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
