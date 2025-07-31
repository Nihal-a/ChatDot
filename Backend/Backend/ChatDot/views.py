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
from collections import defaultdict
from django.utils.timezone import localtime,make_aware, is_naive
from django.db.models import Q
from django.http import JsonResponse

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
@permission_classes([AllowAny])
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
    operation=request.data.get("operation")


    if not email or not otp:
        return Response({'detail': 'Email and otp are required'}, status=status.HTTP_400_BAD_REQUEST) 
    
    if operation == "passwordreset":
        try:
         user=PasswordReset.objects.get(email=email)
        except PasswordReset.DoesNotExist:
            return Response({'detail': 'Email not found'}, status=status.HTTP_400_BAD_REQUEST)
    
        if str(otp) == str(user.otp):
            if timezone.now() - user.last_generated > timedelta(minutes=5):
                return Response({'detail': 'Otp expired try new one'}, status=status.HTTP_401_UNAUTHORIZED)       
            user.otp=None
            user.save()
            return Response({'detail': 'Otp verified succesfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Invaid otp'}, status=status.HTTP_400_BAD_REQUEST)
    else:
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

    # Mark unseen messages as seen
    ChatMessage.objects.filter(
        __raw__={
            "$or": [
                {"sender": receiver, "receiver": sender}
            ],
            "seen": False
        }
    ).update(seen=True)

    messages = ChatMessage.objects.filter(
        __raw__={
            "$or": [
                {"sender": sender, "receiver": receiver},
                {"sender": receiver, "receiver": sender}
            ]
        }
    ).order_by('datetime')

    grouped = defaultdict(list)

    for msg in messages:
        dt = msg.datetime
        if is_naive(dt):
            dt = make_aware(dt)

        local_dt = localtime(dt)
        date_key = local_dt.strftime("%d %B %Y")

        grouped[date_key].append({
            'id': str(msg.id),
            'is_deleted':msg.is_deleted,
            'is_edited':msg.is_edited,
            'sender': msg.sender,
            'receiver': msg.receiver,
            'message': msg.message,
            'datetime': local_dt.strftime("%H:%M:%S"),
            'seen': msg.seen,
            'is_deleted_by': msg.is_deleted_by,
            'is_bothdeleted': msg.is_bothdeleted,
            'is_bothdeleted_by': msg.is_bothdeleted_by,
        })

    return Response(grouped, status=status.HTTP_200_OK)

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



@api_view(['POST'])
@permission_classes([AllowAny])
def otpfor_resetpass(request):
    email=request.data.get("username")
    
    try:
        user=User.objects.get(username=email)      
    except User.DoesNotExist:
        try:
            user=User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User does not exists'}, status=status.HTTP_401_UNAUTHORIZED)     
    
    subject="Password Reset"
    recipient_list=user.email
    recipient_name=user.fullname.title()

    otp=random.randint(1000, 9999)
    generated_time=timezone.now()
    

    html_content = render_to_string("email_templates/password_resetotp.html", {
        "user_fullname": recipient_name,
        "otp_code": otp,
        "year": datetime.now().year,
    })
    
    send_mail(subject,'',f"{subject} ChatDot <noreplyblackeye0265@gmail.com>",
                [recipient_list],html_message=html_content, fail_silently=False)
    
    obj,created=PasswordReset.objects.update_or_create(email=user.email,defaults={"otp":otp, "last_generated":generated_time})

    return Response({'detail': 'code has been sended to your curresponding email',"email":user.email}, status=status.HTTP_200_OK) 
    



@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    rec_password = request.data.get("password")
    email = request.data.get("email")

    if not email or not rec_password:
        return Response(
            {"detail": "Both email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        User.objects.update_user_password(email=email, password=rec_password)
        PasswordReset.objects.filter(email=email).delete()
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print("Error in password update:", e)  
        return Response(
            {"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST,
        )



@api_view(['POST'])
@permission_classes([AllowAny])
def search_users(request):
    search = request.data.get("search")
    print(search)
   

    if not search:
        return Response({"results": []})

    # Filter by username or name (case-insensitive contains)
    users = User.objects.filter(
        Q(username__icontains=search) | Q(fullname__icontains=search)
    )

    results = [
        {
            "id": user.id,
            "username": user.username,
            # "profile":user.profile,
            "name": user.fullname,
            "email": user.email,
        }
        for user in users
    ]

    return Response({"results": results},status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def fake_view(request):
   
    return Response(status=status.HTTP_200_OK)
