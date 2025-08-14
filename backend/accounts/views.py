from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from django.db import IntegrityError, transaction
from .models import GenSkill, UserInterest, User
from .serializers import GenSkillSerializer, UserInterestBulkSerializer
from .models import SpecSkill, UserSkill
from .serializers import SpecSkillSerializer, UserSkillBulkSerializer

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser]) 
def register_user(request):
    print(request.FILES)
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        instance = serializer.save()
        return Response(
            {
                "message": "User registered successfully",
                "user_id": getattr(instance, "user_id", None),
            },
            status=201,
        )
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def list_general_skills(request):
    """
    Return all general skills from genskills_tbl.
    """
    qs = GenSkill.objects.all().order_by('genCateg')
    data = GenSkillSerializer(qs, many=True).data
    return Response(data)

@api_view(['POST'])
def add_user_interests(request):
    """
    Body JSON: { "user_id": 123, "genSkills_ids": [1,3,5] }
    Inserts rows into userinterests_tbl (one per selected general category).
    """
    ser = UserInterestBulkSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user_id = ser.validated_data['user_id']
    ids = ser.validated_data['genSkills_ids']

    created = 0
    for gid in ids:
        # Avoid duplicates: try to find first, create if none
        try:
            gen = GenSkill.objects.get(pk=gid)
            _, was_created = UserInterest.objects.get_or_create(
                user_id=user_id,
                genSkills_id_id=int(gid)
            )
            if was_created:
                created += 1
        except IntegrityError:
            # In case you later add a DB unique constraint, ignore duplicates gracefully
            pass

    return Response({"added_or_existing": created}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def list_specific_skills(request):
    """
    GET /skills/specific/?genskills_id=2  -> list specs under a general category
    If no genskills_id, return all specs.
    """
    gid = request.query_params.get('genskills_id')
    qs = SpecSkill.objects.all()
    if gid:
        qs = qs.filter(genSkills_id_id=int(gid))
    qs = qs.order_by('specName')
    return Response(SpecSkillSerializer(qs, many=True).data)

@api_view(['POST'])
def add_user_skills(request):
    ser = UserSkillBulkSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    user_id = ser.validated_data['user_id']
    items = ser.validated_data['items']

    created = 0
    for it in items:
        gid = it['genskills_id']
        ids = list(it.get('specskills_ids') or [])
        names = list(it.get('spec_names') or [])

        # If names were provided, resolve to ids (and validate they belong to the same gen)
        if names:
            qs = SpecSkill.objects.filter(genSkills_id_id=int(gid), specName__in=names)
            found_names = {s.specName for s in qs}
            missing = set(names) - found_names
            if missing:
                return Response(
                    {"detail": f"Unknown specializations for genskills_id={gid}: {sorted(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ids.extend(qs.values_list('specSkills_id', flat=True))

        # Deduplicate ids just in case
        ids = list(dict.fromkeys(ids))

        for sid in ids:
            # safety: ensure each spec really belongs to gid
            try:
                spec = SpecSkill.objects.get(pk=sid)
                if int(spec.genSkills_id_id) != int(gid):
                    return Response(
                        {"detail": f"specskills_id {sid} does not belong to genskills_id {gid}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except SpecSkill.DoesNotExist:
                return Response({"detail": f"specskills_id {sid} not found."}, status=404)

            try:
                _, was_created = UserSkill.objects.get_or_create(
                    user_id=user_id,
                    specSkills_id=sid
                )
                if was_created:
                    created += 1
            except IntegrityError:
                pass

    return Response({"inserted": created}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@transaction.atomic
def complete_registration(request):
    """
    Complete user registration with profile, interests, and skills.
    Supports file uploads and full FormData payload.
    """

    from django.contrib.auth.hashers import make_password
    import json

    # Get and validate user fields
    first_Name = request.data.get("first_Name", "")
    last_Name = request.data.get("last_Name", "")
    username = request.data.get("username", "")
    emailAdd = request.data.get("emailAdd", "")
    password = request.data.get("password", "")
    profilePic = request.FILES.get("profilePic")
    userVerifyId = request.FILES.get("userVerifyId")
    bio = request.data.get("bio", "")
    location = request.data.get("location", "")
    links = request.data.get("links", "")
    genSkills_ids_raw = request.data.get("genSkills_ids", "[]")
    specSkills_raw = request.data.get("specSkills", "{}")

    try:
        genSkills_ids = json.loads(genSkills_ids_raw)
        specSkills = json.loads(specSkills_raw)
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON format in genSkills_ids or specSkills"}, status=400)

    # Create user
    serializer = UserSerializer(data={
        "first_Name": first_Name,
        "last_Name": last_Name,
        "username": username,
        "emailAdd": emailAdd,
        "password": make_password(password),
        "profilePic": profilePic,
        "userVerifyId": userVerifyId,
        "bio": bio,
        "location": location,
        "links": links,
    })

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = serializer.save()
    user_id = user.user_id

    # Save general interests (step 5)
    for gid in genSkills_ids:
        try:
            GenSkill.objects.get(pk=gid)
            UserInterest.objects.get_or_create(
                user_id=user_id,
                genSkills_id_id=gid
            )
        except GenSkill.DoesNotExist:
            continue

    # Save specific skills (step 6)
    for gid_str, spec_ids in specSkills.items():
        try:
            gid = int(gid_str)
            for sid in spec_ids:
                try:
                    spec = SpecSkill.objects.get(pk=sid, genSkills_id_id=gid)
                    UserSkill.objects.get_or_create(
                        user_id=user_id,
                        specSkills_id=sid
                    )
                except SpecSkill.DoesNotExist:
                    continue
        except ValueError:
            continue

    return Response({
        "message": "Registration completed successfully",
        "user_id": user_id,
        "interests_added": len(genSkills_ids),
        "skills_added": sum(len(v) for v in specSkills.values())
    }, status=200)
