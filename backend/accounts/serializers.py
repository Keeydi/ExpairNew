from rest_framework import serializers
from .models import User
from .models import GenSkill, UserInterest
from rest_framework import serializers
from .models import SpecSkill, UserSkill 
from .models import VerificationStatus


class ProfileUpdateSerializer(serializers.ModelSerializer):
    userVerifyId = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "first_Name", "last_Name", "bio",
            "username", "emailAdd", "profilePic",
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
            "first_Name": {"required": False, "allow_blank": True},
            "last_Name":  {"required": False, "allow_blank": True},
            "bio":        {"required": False, "allow_blank": True},
            "username":   {"required": False, "allow_blank": False},
            "emailAdd":   {"required": False, "allow_blank": False},
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
    genSkills_id = serializers.IntegerField(source="genSkills_id_id", read_only=True)

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