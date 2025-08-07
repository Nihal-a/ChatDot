from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):


    def create_user(self, email, username, password=None, **extra_fields):
        if not email or not username:
            raise ValueError('The Email and Username fields must be set')
        email = self.normalize_email(email)
        user = self.model(email=email,username=username, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user
    
    def update_user_password(self, email, password):
        if not email or not password:
            raise ValueError('Email and password must be provided.')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValueError('No user found with the provided email.')

        user.set_password(password)
        user.save(using=self._db)
        return user
    
    
    def CreateSuperUser(self,email,username,fullname,password=None,**extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email,username,fullname,password,**extra_fields)
    

        

    
class User(AbstractBaseUser,PermissionsMixin):
    email=models.EmailField(unique=True)
    username=models.CharField(max_length=50,unique=True,null=True,blank=True)
    fullname=models.CharField(max_length=100)
    about=models.TextField(max_length=200,null=True,blank=True)
    profile=models.ImageField(upload_to="profile_images/", blank=True, null=True)
    is_active=models.BooleanField(default=False)
    is_staff=models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()


class Cookie(models.Model):
    user=models.ForeignKey(User, on_delete=models.CASCADE)
    refresh_token=models.CharField(max_length=500)
    
    
class EmailVerification(models.Model):
    email=models.EmailField(unique=True)
    otp=models.BigIntegerField()
    last_generated=models.DateTimeField(auto_now_add=True)
    
class PasswordReset(models.Model):
    email=models.EmailField(unique=True)
    otp=models.BigIntegerField()
    last_generated=models.DateTimeField(auto_now_add=True)


class FriendRequests(models.Model):
    requested_by = models.ForeignKey(User,on_delete=models.CASCADE,blank=True,null=True)
    requested_to = models.TextField(blank=True,null=True)
    requested_date = models.DateTimeField(auto_now_add=True,blank=True,null=True)
    is_accepted = models.BooleanField(default=False)