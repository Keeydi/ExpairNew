from rest_framework import serializers
from .models import TradeDetail, User
from .models import GenSkill, UserInterest
from rest_framework import serializers
from .models import SpecSkill, UserSkill 
from .models import VerificationStatus
from .models import User, UserCredential
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import json

class ProfileUpdateSerializer(serializers.ModelSerializer):
    profilePic = serializers.ImageField(required=False, allow_null=True)
    userVerifyId = serializers.FileField(required=False, allow_null=True)
    links = serializers.JSONField(required=False)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "bio",
            "username", "email", "profilePic", 
            'tot_XpPts',
            "userVerifyId", 
            "location",
            "links",              
            "is_verified",
            "verification_status",
        ]
        read_only_fields = ["is_verified", "verification_status"]

    def validate_userVerifyId(self, f):
        if not f:
            return f
        ct = (getattr(f, "content_type", "") or "").lower()
        if not (ct.startswith("image/") or ct == "application/pdf"):
            raise serializers.ValidationError("Only image files or PDF are allowed.")
        if getattr(f, "size", 0) > 15 * 1024 * 1024:
            raise serializers.ValidationError("File too large (max 15MB).")
        return f
    
    def validate_links(self, value):
        import re
        from urllib.parse import urlparse
        import json

        if not value:
            return []

        # If frontend sent JSON string, parse it
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except Exception:
                value = [value]

        if not isinstance(value, list):
            raise serializers.ValidationError("Links must be a list")

        cleaned = []
        for link in value:
            if not link:
                continue
            s = str(link).strip()

            # Add https:// if missing
            if not re.match(r"^https?://", s, re.I):
                s = "https://" + s

            parsed = urlparse(s)
            if not parsed.netloc:
                raise serializers.ValidationError(f"Invalid link: {link}")
            cleaned.append(s)

        return cleaned

    def update(self, instance, validated_data):
        if "links" in validated_data:
            print("[DEBUG] validated_data['links'] =", validated_data["links"])
        
        print("[DEBUG update] validated_data keys:", validated_data.keys())
        # --- handle profilePic manually ---
        new_pic = validated_data.pop("profilePic", None)
        if new_pic:
            pic_path = os.path.join("profile_pics", new_pic.name)
            saved_path = default_storage.save(pic_path, new_pic)
            instance.profilePic = saved_path

        # --- handle userVerifyId like before ---
        new_file = validated_data.pop("userVerifyId", None)
        if new_file:
            old = getattr(instance, "userVerifyId", None)
            if old:
                try:
                    old.delete(save=False)
                except Exception:
                    pass
            instance.userVerifyId = new_file
            instance.verification_status = VerificationStatus.PENDING
            instance.is_verified = False
        
        # --- handle links ---
        if "links" in validated_data:
            links = validated_data["links"] or []
            instance.links = links  # ✅ store as JSON string in DB

        # --- handle links ---
        if "links" in validated_data:
            links = validated_data["links"] or []
            instance.links = links  # ✅ store as JSON string in DB

        # apply the rest of the fields
        for f in ("first_name", "last_name", "bio", "username", "email", "location"):
            if f in validated_data:
                setattr(instance, f, validated_data[f])

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
    genskills_name = serializers.CharField(source='genskills_id.genCateg', read_only=True)
    specskills_name = serializers.CharField(source='specskills_id.specName', read_only=True)

    skills = serializers.SerializerMethodField()

    class Meta:
        model = UserCredential
        fields = [
            'usercred_id',
            'user',
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
            'skills',
            'created_at',
        ]
        read_only_fields = ['user_id']

    def get_specskills_names(self, obj):
        return [s.specName for s in obj.specskills.all()]

    def get_skills(self, obj):
        """Return skills as an array for frontend compatibility"""
        skills = []
        if obj.specskills_id and obj.specskills_id.specName:
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

class TradeDetailSerializer(serializers.ModelSerializer):
    # Include user information
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField(read_only=True)
    
    # Include trade request information
    trade_request_name = serializers.CharField(source='trade_request.reqname', read_only=True)
    
    # For file uploads
    contextpic = serializers.ImageField(required=False, allow_null=True)
    contextpic_url = serializers.SerializerMethodField(read_only=True)
    
    # XP breakdown fields
    xp_breakdown = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = TradeDetail
        fields = [
            'trade_request',
            'user',
            'user_name',
            'user_full_name',
            'trade_request_name',
            'skillprof',
            'modedel',
            'reqtype',
            'contextpic',
            'contextpic_url',
            'reqbio',
            'total_xp',
            'xp_breakdown',
            'created_at'
        ]
        read_only_fields = ['created_at', 'user_name', 'user_full_name', 'trade_request_name', 'contextpic_url', 'xp_breakdown']
    
    def get_user_full_name(self, obj):
        """Return user's full name or username as fallback"""
        if obj.user:
            full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full_name or obj.user.username
        return ""
    
    def get_contextpic_url(self, obj):
        """Return absolute URL for context picture"""
        if obj.contextpic and hasattr(obj.contextpic, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.contextpic.url)
            return obj.contextpic.url
        return None
    
    def get_xp_breakdown(self, obj):
        """Return XP breakdown for this trade detail"""
        xp_mapping = {
            # Skill Proficiency XP
            TradeDetail.SkillProficiency.BEGINNER: 50,
            TradeDetail.SkillProficiency.INTERMEDIATE: 100,
            TradeDetail.SkillProficiency.ADVANCED: 150,
            TradeDetail.SkillProficiency.CERTIFIED: 200,
            
            # Mode of Delivery XP
            TradeDetail.ModeDelivery.ONSITE: 100,
            TradeDetail.ModeDelivery.ONLINE: 75,
            TradeDetail.ModeDelivery.HYBRID: 150,
            
            # Request Type XP
            TradeDetail.RequestType.OUTPUT: 100,
            TradeDetail.RequestType.SERVICE: 150,
            TradeDetail.RequestType.PROJECT: 300,
        }
        
        skill_xp = xp_mapping.get(obj.skillprof, 0)
        delivery_xp = xp_mapping.get(obj.modedel, 0)
        request_xp = xp_mapping.get(obj.reqtype, 0)
        
        return {
            "skill_proficiency": {
                "choice": obj.skillprof,
                "display_name": dict(TradeDetail.SkillProficiency.choices).get(obj.skillprof, ""),
                "xp": skill_xp
            },
            "delivery_mode": {
                "choice": obj.modedel,
                "display_name": dict(TradeDetail.ModeDelivery.choices).get(obj.modedel, ""),
                "xp": delivery_xp
            },
            "request_type": {
                "choice": obj.reqtype,
                "display_name": dict(TradeDetail.RequestType.choices).get(obj.reqtype, ""),
                "xp": request_xp
            },
            "total_xp": obj.total_xp or (skill_xp + delivery_xp + request_xp)
        }
    
    def validate_contextpic(self, value):
        """Validate uploaded image"""
        if value:
            # Check file size (limit to 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large (max 10MB)")
            
            # Check file type
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("File must be an image")
        
        return value
    
    def validate_reqbio(self, value):
        """Validate request bio length"""
        if value and len(value) > 150:
            raise serializers.ValidationError("Request description must be 150 characters or less")
        return value
        
    def validate(self, data):
        """Custom validation for the entire object"""
        # Ensure skill proficiency is valid
        if 'skillprof' in data:
            if data['skillprof'] not in [choice[0] for choice in TradeDetail.SkillProficiency.choices]:
                raise serializers.ValidationError("Invalid skill proficiency level")
        
        # Ensure delivery mode is valid
        if 'modedel' in data:
            if data['modedel'] not in [choice[0] for choice in TradeDetail.ModeDelivery.choices]:
                raise serializers.ValidationError("Invalid delivery mode")
        
        # Ensure request type is valid
        if 'reqtype' in data:
            if data['reqtype'] not in [choice[0] for choice in TradeDetail.RequestType.choices]:
                raise serializers.ValidationError("Invalid request type")
        
        return data
    
    def create(self, validated_data):
        """Override create to calculate and set total_xp"""
        # Calculate XP based on choices
        xp_mapping = {
            # Skill Proficiency XP
            TradeDetail.SkillProficiency.BEGINNER: 50,
            TradeDetail.SkillProficiency.INTERMEDIATE: 100,
            TradeDetail.SkillProficiency.ADVANCED: 150,
            TradeDetail.SkillProficiency.CERTIFIED: 200,
            
            # Mode of Delivery XP
            TradeDetail.ModeDelivery.ONSITE: 100,
            TradeDetail.ModeDelivery.ONLINE: 75,
            TradeDetail.ModeDelivery.HYBRID: 150,
            
            # Request Type XP
            TradeDetail.RequestType.OUTPUT: 100,
            TradeDetail.RequestType.SERVICE: 150,
            TradeDetail.RequestType.PROJECT: 300,
        }
        
        skill_xp = xp_mapping.get(validated_data.get('skillprof'), 0)
        delivery_xp = xp_mapping.get(validated_data.get('modedel'), 0)
        request_xp = xp_mapping.get(validated_data.get('reqtype'), 0)
        
        validated_data['total_xp'] = skill_xp + delivery_xp + request_xp
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Override update to recalculate total_xp if choices change"""
        # If any XP-affecting fields are being updated, recalculate XP
        if any(field in validated_data for field in ['skillprof', 'modedel', 'reqtype']):
            xp_mapping = {
                # Skill Proficiency XP
                TradeDetail.SkillProficiency.BEGINNER: 50,
                TradeDetail.SkillProficiency.INTERMEDIATE: 100,
                TradeDetail.SkillProficiency.ADVANCED: 150,
                TradeDetail.SkillProficiency.CERTIFIED: 200,
                
                # Mode of Delivery XP
                TradeDetail.ModeDelivery.ONSITE: 100,
                TradeDetail.ModeDelivery.ONLINE: 75,
                TradeDetail.ModeDelivery.HYBRID: 150,
                
                # Request Type XP
                TradeDetail.RequestType.OUTPUT: 100,
                TradeDetail.RequestType.SERVICE: 150,
                TradeDetail.RequestType.PROJECT: 300,
            }
            
            # Use updated values or fall back to existing values
            skillprof = validated_data.get('skillprof', instance.skillprof)
            modedel = validated_data.get('modedel', instance.modedel)
            reqtype = validated_data.get('reqtype', instance.reqtype)
            
            skill_xp = xp_mapping.get(skillprof, 0)
            delivery_xp = xp_mapping.get(modedel, 0)
            request_xp = xp_mapping.get(reqtype, 0)
            
            validated_data['total_xp'] = skill_xp + delivery_xp + request_xp
        
        return super().update(instance, validated_data)