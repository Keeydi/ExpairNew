from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.hashers import make_password


class VerificationStatus(models.TextChoices):
    UNVERIFIED = "UNVERIFIED", "Unverified"
    PENDING    = "PENDING",    "Pending"
    VERIFIED   = "VERIFIED",   "Verified"
    REJECTED   = "REJECTED",   "Rejected"

class UserManager(models.Manager):
    """Custom manager for User model that provides create_user method"""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Create and save a user with the given username, email, and password."""
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        
        # Create user instance first
        user = self.model(username=username, email=email, **extra_fields)
        
        # Use Django's built-in password handling
        if password:
            user.set_password(password)
        
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        """Create and save a superuser with the given username, email, and password."""
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    id = models.AutoField(primary_key=True, db_column='user_id')

    first_name = models.CharField(max_length=100, db_column='first_name')
    last_name = models.CharField(max_length=100, db_column='last_name')
    username = models.CharField(max_length=50, unique=True, db_column='username')
    email = models.EmailField(max_length=50, unique=True, db_column='email')
    password = models.CharField(max_length=100, db_column='password')

    profilePic = models.ImageField(
        upload_to='profile_pics/', 
        null=True, 
        blank=True, 
        db_column='profilepic'
    )
    bio = models.CharField(max_length=150, null=True, blank=True, db_column='bio')  # Match DB varchar(150)
    location = models.CharField(max_length=300, null=True, blank=True, db_column='location')  # Match DB varchar(300)
    ratingCount = models.IntegerField(default=0, db_column='ratingcount')
    avgStars = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_column='avgstars')
    tot_XpPts = models.IntegerField(default=0, db_column='tot_xppts')
    level = models.IntegerField(default=1, db_column='level')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    userVerifyId = models.FileField(
        upload_to='user_verifications/', 
        null=True, 
        blank=True, 
        db_column='userverifyid'
    )
    is_verified = models.BooleanField(default=False, db_column='is_verified')
    links = models.JSONField(default=list, blank=True, null=True)
    verification_status = models.CharField(
        max_length=20, 
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_column="verification_status",
    )
    is_active = models.BooleanField(default=True, db_column='is_active') 

    # Django AbstractUser fields that don't exist in your database
    date_joined = None 
    is_staff = None     
    is_superuser = None 
    last_login = None 
    groups = None      
    user_permissions = None  

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    class Meta:
        db_table = 'users_tbl'
        managed = True

    def __str__(self):
        return self.username

    
class GenSkill(models.Model):
    genSkills_id = models.AutoField(primary_key=True, db_column='genskills_id')
    genCateg = models.CharField(max_length=100, unique=True, db_column='gencateg')

    class Meta:
        db_table = 'genskills_tbl'
        managed = False

class SpecSkill(models.Model):
    specSkills_id = models.AutoField(primary_key=True, db_column='specskills_id')
    specName = models.CharField(max_length=150, db_column='speccateg', unique=True)
    genSkills_id = models.ForeignKey('GenSkill', db_column='genskills_id', on_delete=models.RESTRICT)

    class Meta:
        db_table = 'specskills_tbl'
        managed = False

class UserInterest(models.Model):
    userinterests_id = models.AutoField(primary_key=True, db_column='userinterests_id')
    user      = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    genSkills_id = models.ForeignKey(GenSkill, db_column='genskills_id', on_delete=models.CASCADE)

    class Meta:
        db_table = 'userinterests_tbl'
        managed = True

class UserSkill(models.Model):
    userSkill_id = models.AutoField(primary_key=True, db_column='userskills_id')
    user      = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    specSkills = models.ForeignKey('SpecSkill', db_column='specskills_id', on_delete=models.RESTRICT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'userskills_tbl'
        managed = True
        unique_together = (('user', 'specSkills'),) 

class UserCredential(models.Model):
    usercred_id = models.AutoField(primary_key=True, db_column='usercred_id')
    user = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    credential_title = models.CharField(max_length=150, db_column='credential_title')
    issuer = models.CharField(max_length=150, db_column='issuer')
    issue_date = models.DateField(db_column='issue_date')
    expiry_date = models.DateField(null=True, blank=True, db_column='expiry_date')
    cred_id = models.CharField(max_length=100, null=True, blank=True, db_column='cred_id')
    cred_url = models.TextField(null=True, blank=True, db_column='cred_url')
    genskills_id = models.ForeignKey('GenSkill', db_column='genskills_id', on_delete=models.RESTRICT, null=True, blank=True)
    specskills_id = models.ForeignKey('SpecSkill', db_column='specskills_id', on_delete=models.RESTRICT, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usercredentials_tbl'
        managed = True

    def __str__(self):
        return f"{self.credential_title} - {self.user.username}"

class TradeRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"           # just created, waiting for a responder
        ACTIVE = "ACTIVE", "Active"       # responder matched, trade active
        COMPLETED = "COMPLETED", "Completed"    # finished successfully
        CANCELLED = "CANCELLED", "Cancelled"    # requester/responder backed out

    tradereq_id = models.AutoField(primary_key=True, db_column='tradereq_id')
    requester = models.ForeignKey('User', db_column='requester_id', on_delete=models.CASCADE, related_name='trade_requests_made')
    responder = models.ForeignKey('User', db_column='responder_id', on_delete=models.CASCADE, null=True, blank=True, related_name='trade_requests_received')
    reqname = models.CharField(max_length=100, db_column='reqname')
    reqdeadline = models.DateField(db_column='reqdeadline', null=True, blank=True)
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        db_column="status",
        null=True,
        blank=True
    )
    exchange = models.CharField(max_length=255, db_column="exchangename", null=True, blank=True)

    class Meta:
        db_table = 'tradereq_tbl'
        managed = True

    def __str__(self):
        return f"{self.reqname} - {self.requester.username}"

class TradeDetail(models.Model):
    class SkillProficiency(models.TextChoices):
        BEGINNER = "BEGINNER", "Beginner"
        INTERMEDIATE = "INTERMEDIATE", "Intermediate"
        ADVANCED = "ADVANCED", "Advanced"
        CERTIFIED = "CERTIFIED", "Certified"

    class ModeDelivery(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        ONSITE = "ONSITE", "Onsite"
        HYBRID = "HYBRID", "Hybrid"

    class RequestType(models.TextChoices):
        SERVICE = "SERVICE", "Service"
        OUTPUT = "OUTPUT", "Output"
        PROJECT = "PROJECT", "Project"

    tradedetails_id = models.AutoField(primary_key=True, db_column='tradedetails_id')
    trade_request = models.ForeignKey(TradeRequest, on_delete=models.CASCADE, db_column='tradereq_id')
    user = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    skillprof = models.CharField(max_length=13, choices=SkillProficiency.choices, null=True, blank=True, db_column='skillprof')
    modedel = models.CharField(max_length=25, choices=ModeDelivery.choices, null=True, blank=True, db_column='modedel')
    reqtype = models.CharField(max_length=35, choices=RequestType.choices, null=True, blank=True, db_column='reqtype')
    contextpic = models.ImageField(upload_to='requestcontext_pics/', null=True, blank=True, db_column='contextpic') 
    reqbio = models.CharField(max_length=150, null=True, blank=True, db_column='reqbio')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    total_xp = models.IntegerField(default=0, db_column='total_xp', null=True, blank=True)

    class Meta:
        db_table = 'trade_details_tbl'
        managed = True
        unique_together = ('trade_request', 'user')

    def __str__(self):
        return f"Trade Detail for {self.trade_request.reqname} - {self.user.username}"
    
class TradeInterest(models.Model):
    class InterestStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"

    trade_interests_id = models.AutoField(primary_key=True, db_column='trade_interests_id')
    trade_request = models.ForeignKey('TradeRequest', on_delete=models.CASCADE, related_name='interests', db_column='tradereq_id')
    interested_user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='trade_interests', db_column='interested_user_id')
    created_at = models.DateTimeField(auto_now_add=True, db_column='created_at')
    status = models.CharField(
        max_length=10,
        choices=InterestStatus.choices,
        default=InterestStatus.PENDING,
        db_column="status"
    )
    
    class Meta:
        db_table = 'trade_interests_tbl'
        unique_together = ['trade_request', 'interested_user']  
        ordering = ['-created_at']
        managed = True
    
    def __str__(self):
        return f"{self.interested_user.username} interested in {self.trade_request.reqname} [{self.status}]"
