from rest_framework import serializers
from .models import User
from .models import GenSkill, UserInterest
from rest_framework import serializers
from .models import SpecSkill, UserSkill 
from .models import VerificationStatus
from .models import User, UserCredential


class ProfileUpdateSerializer(serializers.ModelSerializer):
    userVerifyId = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "bio",
            "username", "email", "profilePic",
            "userVerifyId",
            "is_verified",
            "verification_status",
        ]
        read_only_fields = [
            # users shouldn’t set these client-side
            "is_verified",
            "verification_status",
        ]
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name":  {"required": False, "allow_blank": True},
            "bio":        {"required": False, "allow_blank": True},
            "username":   {"required": False, "allow_blank": False},
            "email":   {"required": False, "allow_blank": False},
            "profilePic": {"required": False},
            "userVerifyId": {"required": False},
        }

    def validate_userVerifyId(self, f):
        if not f:
            return f
        ct = (getattr(f, "content_type", "") or "").lower()
        # accept any image/* or a pdf
        if not (ct.startswith("image/") or ct == "application/pdf"):
            raise serializers.ValidationError("Only image files or PDF are allowed.")
        if getattr(f, "size", 0) > 15 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 15MB).")
        return f

    def update(self, instance, validated_data):
        new_file = validated_data.get("userVerifyId", None)

        # Any new upload / re-upload → replace file & go PENDING
        if new_file:
            # optional: delete old file from storage to avoid orphans
            old = getattr(instance, "userVerifyId", None)
            if old:
                try:
                    old.delete(save=False)
                except Exception:
                    pass
            instance.userVerifyId = new_file
            instance.verification_status = VerificationStatus.PENDING
            instance.is_verified = False

        # Optional dev/test reset
        if validated_data.get("clear_userVerifyId", False):
            if instance.userVerifyId:
                try:
                    instance.userVerifyId.delete(save=False)
                except Exception:
                    pass
            instance.userVerifyId = None
            instance.verification_status = VerificationStatus.UNVERIFIED
            instance.is_verified = False

        # If you expose an admin-only API, allow final state changes there.
        status_in = validated_data.get("verification_status")
        if status_in in {s.value for s in VerificationStatus}:
            instance.verification_status = status_in
            instance.is_verified = (status_in == VerificationStatus.VERIFIED)

        # ✅ persist editable profile fields
        for f in ("first_name", "last_name", "bio", "username", "email", "profilePic"):
            if f in validated_data:
                setattr(instance, f, validated_data[f])

        # ✅ ALWAYS persist changes
        instance.save()
        return instance

        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def validate_userVerifyId(self, f):
        if not f:
            return f
        allowed = ('image/', 'application/pdf')
        # Some storages don’t set content_type; guard for that
        ct = getattr(f, 'content_type', '') or ''
        if not any(ct.startswith(a) for a in allowed):
            raise serializers.ValidationError("User ID must be an image or a PDF.")
        # Optional size limit: 5MB
        if f.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 5MB).")
        return f
    
    def create(self, validated_data):
        # If the sign-in/registration form includes an ID file,
        # new users should start as PENDING (not UNVERIFIED)
        if validated_data.get("userVerifyId"):
            validated_data["verification_status"] = VerificationStatus.PENDING
            validated_data["is_verified"] = False
        return super().create(validated_data)
    
class GenSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenSkill
        fields = ['genSkills_id', 'genCateg']

class UserInterestBulkSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    genSkills_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

class SpecSkillSerializer(serializers.ModelSerializer):
    genSkills_id = serializers.IntegerField(source="genSkills_id.genSkills_id", read_only=True)

    class Meta:
        model = SpecSkill
        fields = ["specSkills_id", "specName", "genSkills_id"]


class UserSkillBulkSerializer(serializers.Serializer):
    """
    Accepts either:
      {"genskills_id": 2, "specskills_ids": [11,12]}
    or
      {"genskills_id": 2, "spec_names": ["Web Development","Cybersecurity"]}
    """
    user_id = serializers.IntegerField()
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate(self, data):
        norm = []
        for it in data.get("items") or []:
            gid = it.get("genskills_id")
            ids = it.get("specskills_ids")
            names = it.get("spec_names")
            if not gid:
                raise serializers.ValidationError("Each item must include genskills_id.")
            if not (isinstance(ids, list) or isinstance(names, list)):
                raise serializers.ValidationError(
                    "Each item must include either specskills_ids (list) or spec_names (list)."
                )
            norm.append({
                "genskills_id": int(gid),
                "specskills_ids": [int(x) for x in (ids or [])],
                "spec_names": [str(n).strip() for n in (names or []) if str(n).strip()],
            })
        data["items"] = norm
        return data
    
class UserCredentialSerializer(serializers.ModelSerializer):
    # Include related field names for easier frontend consumption
    genskills_name = serializers.CharField(source='genskills_id.genCateg', read_only=True)
    specskills_name = serializers.CharField(source='specskills_id.specName', read_only=True)
    
    # Add skills field that returns an array
    skills = serializers.SerializerMethodField()
    
    # Map field names to match frontend expectations
    title = serializers.CharField(source='credential_title', read_only=True)
    org = serializers.CharField(source='issuer', read_only=True)
    issueDate = serializers.DateField(source='issue_date', read_only=True)
    expiryDate = serializers.DateField(source='expiry_date', read_only=True)
    id = serializers.CharField(source='cred_id', read_only=True)
    url = serializers.URLField(source='cred_url', read_only=True)

    class Meta:
        model = UserCredential
        fields = [
            'usercred_id',
            'credential_title', 
            'issuer', 
            'issue_date', 
            'expiry_date',
            'cred_id', 
            'cred_url',
            'genskills_id',
            'specskills_id',
            'genskills_name',
            'specskills_name',
            'title',     
            'org',      
            'issueDate',  
            'expiryDate', 
            'id',        
            'url',        
            'skills',     
            'created_at'
        ]

    def get_skills(self, obj):
        """Return skills as an array for frontend compatibility"""
        skills = []
        if hasattr(obj, 'specskills_id') and obj.specskills_id:
            skills.append(obj.specskills_id.specName)
        return skills

    def validate_issue_date(self, value):
        """Ensure issue date is not in the future"""
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Issue date cannot be in the future.")
        return value

    def validate(self, data):
        """Ensure expiry date is after issue date if provided"""
        issue_date = data.get('issue_date')
        expiry_date = data.get('expiry_date')
        
        if issue_date and expiry_date and expiry_date <= issue_date:
            raise serializers.ValidationError(
                "Expiry date must be after the issue date."
            )
        return data

class UserCredentialBulkSerializer(serializers.Serializer):
    """
    For bulk operations on credentials
    """
    user_id = serializers.IntegerField()
    credentials = UserCredentialSerializer(many=True)

    def validate_credentials(self, value):
        if len(value) > 20:  # Reasonable limit
            raise serializers.ValidationError("Cannot add more than 20 credentials at once.")
        return value