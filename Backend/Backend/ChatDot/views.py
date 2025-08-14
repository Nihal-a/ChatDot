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
from mongoengine.queryset.visitor import Q  as MongoQ
from django.http import JsonResponse
import re

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

    if profile:  
        user.profile = profile
        print("Added")
    else:
        user.profile = None
   
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
        'about': user.about,
        'profile': user.profile.url if user.profile else "",
        'notfication_count':FriendRequests.objects.filter(requested_to=user.username).count()
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
        'about': user.about,
        'notfication_count':FriendRequests.objects.filter(requested_to=user.username).count(),
        'profile': user.profile.url if user.profile  else None
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
            PasswordReset.objects.get(email=email).delete()
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
            EmailVerification.objects.get(email=email).delete()
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
    
    last_msg = ChatMessage.objects(
        MongoQ(sender=sender, receiver=receiver) | MongoQ(sender=receiver, receiver=sender),
        is_bothdeleted=False  
        # & ~Q(deleted_by=sender)  
    ).order_by('-timestamp').first()


    if last_msg:
        Connections.objects(
            MongoQ(me=sender, my_friend=receiver) | MongoQ(me=receiver, my_friend=sender)
        ).update_one(
            set__last_message=last_msg.message,
            set__last_message_time=last_msg.timestamp
        )
    else:
        Connections.objects(
            MongoQ(me=sender, my_friend=receiver) | MongoQ(me=receiver, my_friend=sender)
        ).update_one(
            set__last_message=None,
            set__last_message_time=None
        )

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
    ).order_by('timestamp')

    grouped = defaultdict(list)

    for msg in messages:
        dt = msg.timestamp
        if is_naive(dt):
            dt = make_aware(dt)
        
        today = datetime.now().strftime("%d %B %Y")
        yesterday = (datetime.now()-timedelta(days=1)).strftime("%d %B %Y")

        local_dt = localtime(dt)
        date_key = local_dt.strftime("%d %B %Y")
        if date_key==today:   
            grouped["Today"].append({
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
                'is_cleared_by': msg.is_cleared_by,
            })
        elif date_key==yesterday:
            grouped["Yesterday"].append({
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
                'is_cleared_by': msg.is_cleared_by,
            })
        else:
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
                'is_cleared_by': msg.is_cleared_by,
            })

    return Response(grouped, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    current_user = request.user.username

    temp = Connections.objects.filter(
        __raw__={
            "$or": [
                {"me": current_user},
                {"my_friend": current_user}
            ]
        }
    )

    result = []
    seen_usernames = set()

    for chat in temp:
        other_username = chat.my_friend if chat.me == current_user else chat.me

        if not other_username or other_username in seen_usernames:
            continue

        seen_usernames.add(other_username)


        today = datetime.today().date()
        yesterday = today - timedelta(days=1)



        try:
            other_user = User.objects.get(username=other_username)
            result.append({
                'id': str(other_user.id),
                'username': other_user.username,
                'email': other_user.email,
                'name': other_user.fullname,
                'profile': other_user.profile.url if other_user.profile else "",
                'last_message': chat.last_message or "",
                'last_message_time': chat.last_message_time.isoformat() if chat.last_message_time else None,
                'is_blocked_by': chat.is_blocked_by,  
                "unseen_count": ChatMessage.objects.filter(
                    sender=other_username,
                    receiver=current_user,
                    seen=False
                ).count()
            })
        except User.DoesNotExist:
            continue

    return JsonResponse({"connections": result}, safe=False)



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
    search =re.escape(request.data.get("search")) 
    from_id = request.data.get("from")
    from_user=User.objects.get(id=from_id)
    
    if not search:
        return Response({"results": []})
 
    search_regex = r'\b' + search 

    # Filter by username or name (case-insensitive contains)
    users = User.objects.filter(
        # Q(username__icontains=search) | Q(fullname__icontains=search).
         Q(username__iregex=search_regex) | Q(fullname__iregex=search_regex)
    ).exclude(id=from_id)
    results = [
    {
        "id": user.id,
        "username": user.username,
        "profile": user.profile.url if user.profile  else None,
        "name": user.fullname,
        "email": user.email,
        "is_friend": Connections.objects.filter(
            __raw__={
                "$or": [
                    {"me": from_user.username, "my_friend": user.username},
                    {"me": user.username, "my_friend": from_user.username}
                ]
            }
        ).first() is not None,

        "is_already_requested": FriendRequests.objects.filter(
            Q(requested_by=User.objects.get(id=from_id), requested_to=user.id) |
            Q(requested_by=user.id, requested_to=User.objects.get(id=from_id))
        ).exists()
    }
    for user in users
    ]

    return Response({"results": results},status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def add_friend(request):
    is_to = request.data.get("to")
    is_from = request.data.get("from")

    FriendRequests(requested_by=User.objects.get(id=is_from), requested_to=is_to).save()
    
    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_friend_request(request):
    is_to = request.data.get("to")
    is_from = request.data.get("from")

    FriendRequests.objects.filter(
    Q(requested_by=is_from, requested_to=is_to) |
    Q(requested_by=is_to, requested_to=is_from)
    ).delete()
    
    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def get_all_request(request):
    user = request.data.get("user")
    friend_requests = FriendRequests.objects.filter(requested_to=user)
    
    requests=[]  
    requests=[
    
    {
        "req_id":req.id,
        "id":req.requested_by.id,
        "name":req.requested_by.fullname,
        "username":req.requested_by.username,
        "email":req.requested_by.email,
        "profile":req.requested_by.profile.url if req.requested_by.profile else None,
    }
    for req in friend_requests
    ]

    return Response({"requests": requests },status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_request(request):
    req_id = request.data.get("req_id")
    print(req_id)
    
    req = FriendRequests.objects.get(id=req_id)
    user1 = req.requested_by.username
    user2 = User.objects.get(id=req.requested_to).username

    me = min(user1, user2)
    my_friend = max(user1, user2)

    if not Connections.objects(me=me, my_friend=my_friend).first():
        Connections(me=me, my_friend=my_friend).save()

    req.delete()

    return Response(status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def reject_req(request):
    req_id = request.data.get("req_id")
    FriendRequests.objects.get(id=req_id).delete()

    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def profile_edit(request):
    try:
        id = request.data.get("id")
        user = User.objects.get(id=id)

        name = request.data.get("name", "").strip()
        about = request.data.get("about")
        profile = request.FILES.get("profile")
        operation = request.data.get("operation")
        print(operation)
        print(profile)



        print(profile)

        user.fullname = name

        if about is not None:
            user.about = about

        if operation=="remove":
            user.profile = None
        elif operation=="change":
            user.profile = profile
        elif operation=="nochange":
            ...

        # if remove is not None and remove == "remove":
        #     user.profile = None
        #     print("okok")
        user.save()

        return Response({"detail": "Profile updated successfully"}, status=200)

    except Exception as e:
        return Response({"detail": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_password(request):
    user=request.user
    password=request.data.get("password")
    if not user.check_password(password):
        return Response( status=status.HTTP_401_UNAUTHORIZED)
    else:
        return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def delete_account(request):
    user=request.user
    User.objects.get(email=user).delete()
   
    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfriend(request):
    me=request.data.get("me")
    my_friend=request.data.get("my_friend")
    Connections.objects(MongoQ(me=me, my_friend=my_friend) |MongoQ(me=my_friend, my_friend=me)).delete() 
    ChatMessage.objects(MongoQ(sender=me, receiver=my_friend) |MongoQ(receiver=my_friend, sender=me)).delete() 
    
    return Response(status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def fake_view(request):
   

    return Response(status=status.HTTP_200_OK)

