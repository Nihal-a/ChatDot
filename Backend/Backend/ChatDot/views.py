from django.shortcuts import render
from .models import *
from .serializer import *
from .mongodb import *
import random
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.core.mail import send_mail
from Backend.settings import EMAIL_HOST_USER
from datetime import datetime,timedelta
from django.utils import timezone
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_cookie_view(request):
    refresh_token = request.COOKIES.get("refresh_token")

    if not refresh_token:
        return Response({"detail": "No refresh token found"}, status=400)

    serializer = TokenRefreshSerializer(data={"refresh": refresh_token})

    try:
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data['access']

        return Response({"access": access_token}, status=200)

    except TokenError:
        return Response({"detail": "Refresh token expired or invalid"}, status=status.HTTP_401_UNAUTHORIZED)
    


@api_view(['POST'])
@permission_classes([AllowAny])
def Register(request):
    
    username=request.data.get("username")
    name=request.data.get("name")
    email=request.data.get("email")
    password=request.data.get("password")
    profile=request.FILES.get("profile")


    if User.objects.filter(email=email).exists():
        return Response({'detail': 'Email already exists'}, status=status.HTTP_401_UNAUTHORIZED)

    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists'}, status=status.HTTP_401_UNAUTHORIZED)


    if not all([username,name,email,password]):
        return Response({'detail': 'All fields are needed'}, status=status.HTTP_400_BAD_REQUEST)

    user=User.objects.create_user(email=email,password=password,username=username)
    user.fullname=name
    user.profile=profile
    user.is_active=True
    user.save()

    subject="Account successfully created!"
    recipient_list=email
    recipient_name=name.title()
    

    html_content = render_to_string("email_templates/succesful_account_creation.html", {
        "name": recipient_name,
        "email": email,
        "username": username,
    })
    
    send_mail(subject,'',f"{subject} ChatDot <noreplyblackeye0265@gmail.com>",
                [recipient_list],html_message=html_content, fail_silently=False)


    return Response({'detail': 'User registered succesfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def Login(request):
    username=request.data.get("username")
    password=request.data.get("password")

    if not username or not password:
        return Response({'detail': 'Both username/email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user=User.objects.get(username=username)      
    except User.DoesNotExist:
        try:
            user=User.objects.get(email=username)
        except User.DoesNotExist:
            return Response({'detail': 'User does not exists'}, status=status.HTTP_401_UNAUTHORIZED)
        
    if not user.check_password(password):
        return Response({'detail': 'Password is invalid'}, status=status.HTTP_401_UNAUTHORIZED)

    
    user=authenticate(username=user.email,password=password)
    if user is None:
        return Response({'detail': 'Invalid login credentials, Please try again'}, status=status.HTTP_401_UNAUTHORIZED)

     
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)


    res = Response({
        'detail':"Login Successfull",
        'access': access_token,
        'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'name': user.fullname,
        'profile': user.profile.url if user.profile else ""
        }
    }, status=status.HTTP_200_OK)


    res.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=False,  
        samesite='Lax',
        path='/',
    )

    Cookie.objects.create(user=User.objects.get(id=user.id),refresh_token=refresh_token)
     
    return res


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.COOKIES.get("refresh_token")

    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist() 
        except TokenError:
            return Response({"detail": "Invalid or expired refresh token"}, status=status.HTTP_400_BAD_REQUEST)

    response = Response({"detail": "Logged out successfully"}, status=status.HTTP_205_RESET_CONTENT)
    response.delete_cookie("refresh_token") 
    return response

    

@api_view(['POST']) 
@permission_classes([IsAuthenticated])
def get_userdata(request):
    user=request.user
    res = Response({
        'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'name': user.fullname,
        'profile': user.profile.url if user.profile else ""
        }
    }, status=status.HTTP_200_OK)
 
    return res



@api_view(['POST'])
@permission_classes([AllowAny])
def Email_verification(request):
    name=request.data.get("name")
    email=request.data.get("email")

    if User.objects.filter(email=email).exists(): 
        return Response({'detail': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST) 


    subject="Email verification"
    recipient_list=email
    recipient_name=name.title()

    otp=random.randint(1000, 9999)
    generated_time=timezone.now()
    

    html_content = render_to_string("email_templates/verify_email.html", {
        "user_fullname": recipient_name,
        "otp_code": otp,
        "year": datetime.now().year,
    })
    
    send_mail(subject,'',f"{subject} ChatDot <noreplyblackeye0265@gmail.com>",
                [recipient_list],html_message=html_content, fail_silently=False)
    
    obj,created=EmailVerification.objects.update_or_create(email=email,defaults={"otp":otp, "last_generated":generated_time})

    return Response({'detail': 'Email verification code has been sended'}, status=status.HTTP_200_OK) 


@api_view(['POST'])
@permission_classes([AllowAny])
def otp_verification(request):
    email=request.data.get("email")
    otp=request.data.get("otp")

    if not email or not otp:
        return Response({'detail': 'Email and otp are required'}, status=status.HTTP_400_BAD_REQUEST) 
    
    try:
        user=EmailVerification.objects.get(email=email)
    except EmailVerification.DoesNotExist:
        return Response({'detail': 'Email not found'}, status=status.HTTP_400_BAD_REQUEST)
    
    if str(otp) == str(user.otp):
        if timezone.now() - user.last_generated > timedelta(minutes=5):
            return Response({'detail': 'Otp expired try new one'}, status=status.HTTP_401_UNAUTHORIZED)       
        user.otp=None
        user.save()
        return Response({'detail': 'Otp verified succesfully'}, status=status.HTTP_200_OK)
    else:
        return Response({'detail': 'Invaid otp'}, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
@permission_classes([AllowAny])
def username_validation(request):
    username=request.data.get("username")
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username exsits!'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'detail': "Username dosn't exsits"}, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def get_messages(request):
    sender = request.data.get("sender")
    receiver = request.data.get("receiver")

    if not sender or not receiver:
        return Response({'detail': 'Sender and receiver are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    messages = ChatMessage.objects.filter(
        __raw__={
            "$or": [
                {"sender": sender, "receiver": receiver},
                {"sender": receiver, "receiver": sender}
            ]
        }
    ).order_by('timestamp')

    data=[
        {
            'sender': msg.sender,
            'receiver': msg.receiver,
            'message': msg.message,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages
    ]

    print(f"Messages retrieved: {len(data)} messages")
    print(data)
    return Response({'messages': data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def fake_view(request):
   
    return Response(status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_users(request):
    users = User.objects.all()
    data = [
        {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.fullname,
            'profile': user.profile.url if user.profile else ""
        } for user in users
    ]

    return Response({'users': data}, status=status.HTTP_200_OK)
