from rest_framework import serializers
from .models import User
from .models import GenSkill, UserInterest
from rest_framework import serializers
from .models import SpecSkill, UserSkill 



class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_Name", "last_Name", "bio"]
        extra_kwargs = {
            "first_Name": {"required": False, "allow_blank": True},
            "last_Name":  {"required": False, "allow_blank": True},
            "bio":        {"required": False, "allow_blank": True},
        }
        
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