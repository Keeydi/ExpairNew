from django.db import models

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    first_Name = models.CharField(max_length=100, db_column='first_name')
    last_Name = models.CharField(max_length=100, db_column='last_name')
    username = models.CharField(max_length=100, unique=True)
    emailAdd = models.EmailField(unique=True, db_column='emailadd')
    password = models.CharField(max_length=128)
    profilePic = models.ImageField(upload_to='profile_pics/', null=True, blank=True, db_column='profilepic')
    bio = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    ratingCount = models.IntegerField(default=0, db_column='ratingcount')
    avgStars = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, db_column='avgstars')
    tot_XpPts = models.IntegerField(default=0, db_column='tot_xppts')
    xpRank = models.CharField(max_length=255, default='Unranked', db_column='xprank')
    level = models.IntegerField(default=1, db_column='level')
    created_at = models.DateTimeField(auto_now_add=True)
    userVerifyId = models.FileField(upload_to='user_verifications/', null=True, blank=True, db_column='userverifyid')
    is_verified = models.BooleanField(default=False, db_column='is_verified')
    links = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username
    
    class Meta:
        db_table = 'users_tbl'
        managed = False  
    
class GenSkill(models.Model):
    genSkills_id = models.AutoField(primary_key=True, db_column='genskills_id')
    genCateg = models.CharField(max_length=100, unique=True, db_column='gencateg')

    class Meta:
        db_table = 'genskills_tbl'
        managed = False

class UserInterest(models.Model):
    userinterests_id = models.AutoField(primary_key=True, db_column='userinterests_id')
    user      = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    genSkills_id = models.ForeignKey(GenSkill, db_column='genskills_id', on_delete=models.CASCADE)

    class Meta:
        db_table = 'userinterests_tbl'
        managed = False

class SpecSkill(models.Model):
    specSkills_id = models.AutoField(primary_key=True, db_column='specskills_id')
    specName = models.CharField(max_length=150, db_column='speccateg', unique=True)
    genSkills_id = models.ForeignKey('GenSkill', db_column='genskills_id', on_delete=models.RESTRICT)

    class Meta:
        db_table = 'specskills_tbl'
        managed = False

class UserSkill(models.Model):
    userSkill_id = models.AutoField(primary_key=True, db_column='userskills_id')
    user      = models.ForeignKey('User', db_column='user_id', on_delete=models.CASCADE)
    specSkills = models.ForeignKey('SpecSkill', db_column='specskills_id', on_delete=models.RESTRICT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'userskills_tbl'
        managed = False
        unique_together = (('user', 'specSkills'),)  # prevent duplicates


