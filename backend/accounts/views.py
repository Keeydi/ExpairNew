import json
from datetime import date

from rest_framework import status

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import GenSkill, UserInterest, User, VerificationStatus, UserCredential
from .models import SpecSkill, UserSkill, TradeRequest, TradeInterest
from .models import User 

from django.shortcuts import get_object_or_404
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.contrib.auth.hashers import check_password
from django.utils.timezone import localdate

from .serializers import ProfileUpdateSerializer, UserCredentialSerializer
from .serializers import SpecSkillSerializer, UserSkillBulkSerializer
from .serializers import UserSerializer
from .serializers import GenSkillSerializer, UserInterestBulkSerializer


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def me(request):
    print("=== DJANGO ME VIEW DEBUG ===")
    print(f"Request method: {request.method}")
    print(f"Request path: {request.path}")
    print(f"Authorization header: {request.META.get('HTTP_AUTHORIZATION', 'MISSING')}")
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User type: {type(request.user)}")
    print(f"User: {request.user}")
    
    if request.user.is_authenticated:
        print(f"User ID: {request.user.id}")
        print(f"User fields: {[f.name for f in request.user._meta.fields]}")
        print(f"Username: {getattr(request.user, 'username', 'N/A')}")
        print(f"Email: {getattr(request.user, 'email', 'N/A')}")
        print(f"First name: {getattr(request.user, 'first_name', 'N/A')}")
        print(f"Last name: {getattr(request.user, 'last_name', 'N/A')}")
    else:
        print("User is NOT authenticated!")
        print(f"Anonymous user: {request.user}")
        return Response({"detail": "Authentication credentials were not provided."}, status=401)
    
    target = request.user if getattr(request.user, "id", None) else None
    if not target:
        uid = request.query_params.get("user_id") if request.method == "GET" else request.data.get("user_id")
        if uid:
            target = get_object_or_404(User, pk=int(uid))

    if not target:
        return Response({"detail": "Authentication required or user_id missing."}, status=401)

    if request.method == "GET":
        return Response(_public_user_payload(target, request), status=200)

    # ---- PATCH logic starts here ----
    data = request.data.copy()
    data.pop("user_id", None)  # not a serializer field; only used to resolve target

    # ✅ Ignore string "profilePic" unless it's an actual file in request.FILES
    if "profilePic" in data and not request.FILES.get("profilePic"):
        print("Ignoring profilePic field since no file was uploaded")
        data.pop("profilePic")

    # ✅ Ignore userVerifyId unless it's a real file
    if "userVerifyId" in data and not request.FILES.get("userVerifyId"):
        print("Ignoring userVerifyId field since no file was uploaded")
        data.pop("userVerifyId")

    serializer = ProfileUpdateSerializer(instance=target, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    
    # Save ONCE — ProfileUpdateSerializer.update() already flips is_verified=False
    updated = serializer.save()

    # Safety: if a file really came in via multipart, keep it unverified and persist the flag
    if request.FILES.get("userVerifyId"):
        updated.is_verified = False
        updated.save(update_fields=["is_verified"])

    return Response(_public_user_payload(updated, request), status=200)


def _public_user_payload(user, request=None):
    # Profile picture absolute URL (if any)
    pic = None
    if getattr(user, "profilePic", None):
        # Construct the media URL path
        media_path = f"/media/{user.profilePic}"
        pic = request.build_absolute_uri(media_path) if request else media_path

    # Verification file absolute URL (if any)
    verify_url = None
    if getattr(user, "userVerifyId", None):
        # Construct the media URL path
        media_path = f"/media/{user.userVerifyId}"
        verify_url = request.build_absolute_uri(media_path) if request else media_path

    # Handle links field
    links_array = []
    if getattr(user, "links", None):
        try:
            links_array = json.loads(user.links)
        except (json.JSONDecodeError, TypeError):
            # If it's a string, convert to array
            links_array = [user.links] if user.links else []

    # Enum status (safe even if column not present yet)
    status = getattr(user, "verification_status", None)
    if not status:
        if bool(getattr(user, "is_verified", False)):
            status = "VERIFIED"
        elif getattr(user, "userVerifyId", None):
            status = "PENDING"
        else:
            status = "UNVERIFIED"

    if status == "UNVERIFIED" and getattr(user, "userVerifyId", None) and not bool(getattr(user, "is_verified", False)):
        status = "PENDING"
        

    payload = {
        # Primary ID fields - include both variations for compatibility
        "user_id": user.id,
        "id": user.id,   

        # Basic info
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email, 
        "bio": user.bio,
        "links": links_array,
        
        # Stats
        "avgStars": float(user.avgStars or 0),
        "ratingCount": int(user.ratingCount or 0),
        "rating": float(user.avgStars or 0),  # Alternative field name
        "reviews": int(user.ratingCount or 0),  # Alternative field name
        
        # Files
        "profilePic": pic,
        
        
        # Dates
        "created_at": user.created_at,
        
        # XP and Level
        "level": int(user.level or 0),
        "tot_XpPts": int(user.tot_XpPts or 0),
        "tot_xppts": int(user.tot_XpPts or 0),  # Alternative field name
        "totalXp": int(user.tot_XpPts or 0),    # Alternative field name

        # Verification
        "verification_status": status,
        "is_verified": bool(getattr(user, "is_verified", False)),
        "userVerifyId": verify_url,
    }

    print(f"[DEBUG] _public_user_payload returning for user {user.id}:") 
    print(f"  - first_name: '{payload['first_name']}'") 
    print(f"  - last_name: '{payload['last_name']}'")   

    print(f"  - profilePic: {payload['profilePic'] is not None}")
    print(f"  - tot_XpPts: {payload['tot_XpPts']}")
    print(f"  - verification_status: {payload['verification_status']}")

    return payload

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])  # require login for PATCH
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_detail(request, user_id: int):
    user = get_object_or_404(User, pk=user_id)

    if request.method == "GET":
        return Response(_public_user_payload(user, request), status=200)

    elif request.method == "PATCH":
        # Only allow self-edit unless admin logic is added later
        if request.user.id != user.id:
            return Response({"detail": "You cannot edit another user's profile."}, status=403)

        data = request.data.copy()
        data.pop("user_id", None)  # prevent spoofing

        # ✅ Ignore profilePic unless it's a real file
        if "profilePic" in data and not request.FILES.get("profilePic"):
            print("Ignoring profilePic field since no file was uploaded")
            data.pop("profilePic")

        # ✅ Ignore userVerifyId unless it's a real file
        if "userVerifyId" in data and not request.FILES.get("userVerifyId"):
            print("Ignoring userVerifyId field since no file was uploaded")
            data.pop("userVerifyId")

        # Handle password safely
        if "password" in data:
            user.set_password(data["password"])
            data.pop("password")

        # Handle links (store as JSON string)
        if "links" in data:
            try:
                links_array = json.loads(data["links"])
                data["links"] = json.dumps(links_array)
            except Exception:
                return Response({"error": "Invalid format for links"}, status=400)

        serializer = ProfileUpdateSerializer(instance=user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        return Response(_public_user_payload(updated, request), status=200)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])  # require login for PATCH
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_detail_by_username(request, username: str):
    try:
        user = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    if request.method == "GET":
        return Response(_public_user_payload(user, request), status=200)

    elif request.method == "PATCH":
        # Only allow self-edit unless you want admins to override this
        if request.user.id != user.id:
            return Response({"detail": "You cannot edit another user's profile."}, status=403)

        data = request.data.copy()
        data.pop("user_id", None)  # prevent spoofing

        # ✅ Ignore profilePic unless it's a real file
        if "profilePic" in data and not request.FILES.get("profilePic"):
            print("Ignoring profilePic field since no file was uploaded")
            data.pop("profilePic")

        # ✅ Ignore userVerifyId unless it's a real file
        if "userVerifyId" in data and not request.FILES.get("userVerifyId"):
            print("Ignoring userVerifyId field since no file was uploaded")
            data.pop("userVerifyId")

        # Handle password safely
        if "password" in data:
            user.set_password(data["password"])
            data.pop("password")

        # Handle links (store as JSON string)
        if "links" in data:
            try:
                links_array = json.loads(data["links"])
                data["links"] = json.dumps(links_array)
            except Exception:
                return Response({"error": "Invalid format for links"}, status=400)

        serializer = ProfileUpdateSerializer(instance=user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        return Response(_public_user_payload(updated, request), status=200)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def user_credentials(request, user_id: int):
    """
    GET -> return all user's credentials
    POST -> add new credential
    PUT -> update existing credential
    DELETE -> remove credential
    """
    if request.method == 'GET':
        credentials = UserCredential.objects.filter(user_id=user_id).select_related(
            'genskills_id', 'specskills_id'
        ).order_by('-created_at')
        
        serializer = UserCredentialSerializer(credentials, many=True)
        return Response({"credentials": serializer.data}, status=200)

    elif request.method == 'POST':
        # Add new credential
        data = request.data.copy()
        if 'user' not in data:
            data['user'] = user_id  # Ensure user ID is set
        
        serializer = UserCredentialSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=201)

    elif request.method == 'PUT':
        # Update existing credential
        credential_id = request.data.get('usercred_id')
        if not credential_id:
            return Response({"error": "usercred_id is required for updates"}, status=400)
        
        try:
            credential = UserCredential.objects.get(
                usercred_id=credential_id, 
                user_id=user_id
            )
        except UserCredential.DoesNotExist:
            return Response({"error": "Credential not found"}, status=404)
        
        # Don't allow changing the user
        data = request.data.copy()
        data.pop('user', None)
        
        serializer = UserCredentialSerializer(credential, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=200)

    elif request.method == 'DELETE':
        # Delete credential
        credential_id = request.data.get('usercred_id')
        if not credential_id:
            return Response({"error": "usercred_id is required"}, status=400)
        
        try:
            credential = UserCredential.objects.get(
                usercred_id=credential_id, 
                user_id=user_id
            )
            credential.delete()
            return Response({"message": "Credential deleted successfully"}, status=200)
        except UserCredential.DoesNotExist:
            return Response({"error": "Credential not found"}, status=404)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def user_skills(request, user_id: int):
    """
    GET -> return all user's skills, grouped by categories
    POST -> add new skills
    DELETE -> remove skills from the user
    """
    if request.method == 'POST':
        serializer = UserSkillBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        items = serializer.validated_data['items']

        # Insert new skills in bulk
        for item in items:
            for skill_id in item.get('specskills_ids', []):
                UserSkill.objects.create(user_id=user_id, specSkills_id=skill_id)

        return Response({"message": "Skills added successfully."}, status=201)

    elif request.method == 'DELETE':
        # Delete selected skills
        skill_ids_to_delete = request.data.get('specskills_ids', [])
        UserSkill.objects.filter(user_id=user_id, specSkills_id__in=skill_ids_to_delete).delete()
        return Response({"message": "Skills removed successfully."}, status=200)

    else:
        # GET: Return grouped user skills
        skills = UserSkill.objects.filter(user_id=user_id).select_related("specSkills__genSkills_id")
        skill_groups = {}
        for skill in skills:
            category = skill.specSkills.genSkills_id.genCateg
            skill_name = skill.specSkills.specName
            if category not in skill_groups:
                skill_groups[category] = []
            skill_groups[category].append(skill_name)

        return Response({"skill_groups": skill_groups}, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    print("=== DJANGO GOOGLE LOGIN DEBUG ===")
    print(f"Request data: {request.data}")
    
    email = request.data.get('email')
    name = request.data.get('name')
    image = request.data.get('image')

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
        print(f"Existing user found: {user.username}")
        
        # Generate JWT tokens for existing user
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            print("JWT tokens generated for Google login")
        except Exception as token_error:
            print(f"Token generation failed: {token_error}")
            return Response({
                "error": "Authentication system error. Please try again."
            }, status=500)
        
        # Get user payload
        user_payload = _public_user_payload(user, request)
        
        # Return user data with tokens (similar to regular login)
        user_data = {
            "access": access_token,        # ✅ Generated token
            "refresh": refresh_token,      # ✅ Generated token
            "user_id": user.id,       # ✅ Use user_id field
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "image": user_payload.get("profilePic"),
            "is_new": False
        }
        
        print(f"Returning existing user data with tokens")
        return Response(user_data, status=200)
        
    except User.DoesNotExist:
        print(f"New user with email: {email}")
        # New user – return flag to redirect to onboarding
        return Response({
            "is_new": True,
            "email": email,
            "name": name,
            "image": image
        }, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    print("=== DJANGO LOGIN DEBUG ===")
    print(f"Request method: {request.method}")
    
    # Extract credentials
    identifier = request.data.get('identifier', '').strip()
    password = request.data.get('password', '')
    
    print(f"Login attempt for identifier: '{identifier}'")

    if not identifier or not password:
        return Response({
            "error": "Username/email and password are required."
        }, status=400)

    try:
        # Find user by username or email (case-insensitive for email)
        user_query = Q(username__iexact=identifier) | Q(email__iexact=identifier)
        user = User.objects.filter(user_query).first()
        
        if not user:
            print("No user found with that identifier")
            return Response({
                "error": "Invalid username/email or password."
            }, status=401)
        
            print(f"User found: ID={user.id}, username='{user.username}'") 
        
        # Check password
        if not check_password(password, user.password):
            print("Password check failed")
            return Response({
                "error": "Invalid username/email or password."
            }, status=401)

        print("Password check successful")

        # Generate JWT tokens
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            print("JWT tokens generated successfully")
            print(f"Access token length: {len(access_token)}")
            print(f"Refresh token length: {len(refresh_token)}")
        except Exception as token_error:
            print(f"CRITICAL: Token generation failed: {token_error}")
            import traceback
            traceback.print_exc()
            return Response({
                "error": "Authentication system error. Please try again."
            }, status=500)
        
        # Get user payload
        user_payload = _public_user_payload(user, request)
        
        response_data = {
            "message": "Login successful.",
            "user_id": user.id,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "name": user.first_name,
            "profilePic": user_payload.get("profilePic"),
            "image": user_payload.get("profilePic"),
            "access": access_token,
            "refresh": refresh_token,
        }
        
        print(f"Returning response with access token: {access_token[:50]}...")
        return Response(response_data, status=200)
        
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": "Login failed. Please try again."
        }, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    refresh = request.data.get("refresh")
    if not refresh:
        return Response({"error": "Missing refresh token"}, status=400)
    try:
        token = RefreshToken(refresh)
        token.blacklist()
    except TokenError:
        return Response({"error": "Invalid refresh token"}, status=400)
    return Response({"message": "Logged out"}, status=200)

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
@permission_classes([AllowAny]) 
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
@permission_classes([AllowAny])
def user_interests(request, user_id: int):
    """
    Returns a simple list of general interests (GenSkill.genCateg) for a user.
    """
    qs = UserInterest.objects.filter(user_id=user_id).select_related("genSkills_id")
    interests = [ui.genSkills_id.genCateg for ui in qs]
    return Response({"interests": interests})

@api_view(['GET'])
@permission_classes([AllowAny]) 
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
@permission_classes([AllowAny]) 
@transaction.atomic
def complete_registration(request):
    """
    Complete user registration with profile, interests, and skills.
    Supports file uploads and full FormData payload.
    """
    import json

    print("=== COMPLETE REGISTRATION DEBUG ===")
    print("Request data keys:", list(request.data.keys()))
    print("Request files:", list(request.FILES.keys()))

    # Get and validate user fields
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    username = request.data.get("username", "")
    email = request.data.get("email", "")
    password = request.data.get("password", "")
    profilePic = request.FILES.get("profilePic")
    userVerifyId = request.FILES.get("userVerifyId")
    bio = request.data.get("bio", "")
    location = request.data.get("location", "")
    
    # Handle files from request.FILES
    profilePic = request.FILES.get("profilePic")
    userVerifyId = request.FILES.get("userVerifyId")
    
    # Handle links as JSON array
    links_raw = request.data.get("links", "[]")
    try:
        links_array = json.loads(links_raw)
        # Store as JSON string in database
        links = json.dumps(links_array) if links_array else ""
    except json.JSONDecodeError:
        print(f"Failed to parse links: {links_raw}")
        links = ""

    print(f"Files received - profilePic: {profilePic is not None}, userVerifyId: {userVerifyId is not None}")
    print(f"Links parsed: {links}")
    print(f"User data: {username}, {email}, {first_name}, {last_name}")

    # Validate required fields
    if not username or not email or not password:
        return Response({
            "error": "Username, email, and password are required"
        }, status=400)

    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=400)

    # Handling genSkills_ids (Array of IDs)
    genSkills_ids_raw = request.data.get("genSkills_ids", "[]")
    
    try:
        genSkills_ids = json.loads(genSkills_ids_raw)
    except json.JSONDecodeError:
        return Response({"error": "Invalid format for genSkills_ids"}, status=400)

    # Handling specSkills (Object with arrays)
    specSkills_raw = request.data.get("specSkills", "{}")
    try:
        specSkills = json.loads(specSkills_raw)
    except json.JSONDecodeError:
        return Response({"error": "Invalid format for specSkills"}, status=400)

    # Ensure genSkills_ids is a list of integers
    if isinstance(genSkills_ids, list):
        genSkills_ids = [int(id) for id in genSkills_ids if str(id).isdigit()]
    else:
        return Response({"error": "genSkills_ids should be an array"}, status=400)

    try:
        # Create user using the custom manager (REMOVE the duplicate Django auth call)
        user = User.objects.create_user(
            username=username,
            email=email, 
            password=password,
            first_name=first_name,
            last_name=last_name,
            bio=bio,
            location=location,
            links=links,
        )

        # Handle file uploads separately since they're not regular fields
        if profilePic:
            user.profilePic = profilePic
            
        if userVerifyId:
            user.userVerifyId = userVerifyId
            user.verification_status = VerificationStatus.PENDING
            user.is_verified = False
        
        user.save()

        print(f"User created successfully with ID: {user.id}")
        user_id = user.id

        # Save general interests
        interests_added = 0
        for gid in genSkills_ids:
            try:
                GenSkill.objects.get(pk=gid)
                UserInterest.objects.get_or_create(
                    user_id=user.id,
                    genSkills_id_id=gid
                )
                interests_added += 1
            except GenSkill.DoesNotExist:
                print(f"GenSkill {gid} does not exist")
                continue

        # Save specific skills
        skills_added = 0
        for gid_str, spec_ids in specSkills.items():
            try:
                gid = int(gid_str)
                for sid in spec_ids:
                    try:
                        spec = SpecSkill.objects.get(pk=sid, genSkills_id_id=gid)
                        UserSkill.objects.get_or_create(
                            user_id=user.id,
                            specSkills_id=sid
                        )
                        skills_added += 1
                    except SpecSkill.DoesNotExist:
                        print(f"SpecSkill {sid} does not exist for GenSkill {gid}")
                        continue
            except ValueError:
                continue

        return Response({
            "message": "Registration completed successfully",
            "user_id": user.id,
            "interests_added": interests_added,
            "skills_added": skills_added
        }, status=201)

    except Exception as e:
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Registration failed: {str(e)}"
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_trade_request(request):
    """
    Create a new trade request with initial data (reqname and reqdeadline)
    """
    print("=== CREATE TRADE REQUEST DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    reqname = request.data.get('reqname', '').strip()
    reqdeadline = request.data.get('reqdeadline', '')
    
    if not reqname:
        return Response({"error": "Service request name is required"}, status=400)
        
    if not reqdeadline:
        return Response({"error": "Request deadline is required"}, status=400)
    
    try:        
        trade_request = TradeRequest.objects.create(
            requester=request.user,
            reqname=reqname,
            reqdeadline=reqdeadline,
            # Set default reqtype for now
            reqtype='SERVICE' 
        )
        
        return Response({
            "message": "Trade request created successfully",
            "tradereq_id": trade_request.tradereq_id,
            "reqname": trade_request.reqname,
            "reqdeadline": trade_request.reqdeadline
        }, status=201)
        
    except Exception as e:
        print(f"Trade request creation error: {str(e)}")
        return Response({
            "error": f"Failed to create trade request: {str(e)}"
        }, status=500)

@api_view(["GET"])
@permission_classes([AllowAny])
def explore_feed(request):
    """
    Returns a simple feed for Explore cards with proper skill matching logic.
    - "Needs" = exact reqname that User B posted
    - "Can Offer" = GenSkill that User A is interested in AND exists in User B's skills
    """
    viewer = request.user if getattr(request.user, "id", None) else None

    # Load recent requests, exclude viewer's own requests
    qs = (TradeRequest.objects
          .select_related("requester", "specSkills")
          .order_by("-tradereq_id"))
    
    if viewer:
        qs = qs.exclude(requester=viewer)
    
    qs = qs[:50]

    # 🔍 DEBUG: Check for duplicates in database query
    tradereq_ids = list(qs.values_list('tradereq_id', flat=True))
    print(f"DEBUG: Total trade requests from DB: {len(tradereq_ids)}")
    print(f"DEBUG: Unique trade request IDs: {len(set(tradereq_ids))}")
    
    if len(tradereq_ids) != len(set(tradereq_ids)):
        print("🚨 CRITICAL: Duplicate tradereq_ids in database query!")
        duplicates = [id for id in tradereq_ids if tradereq_ids.count(id) > 1]
        print(f"Duplicate IDs: {set(duplicates)}")

    # Preload viewer's interests if authenticated
    viewer_gen_interests = []
    if viewer:
        viewer_gen_interests = list(
            UserInterest.objects.filter(user_id=viewer.id)
            .values_list("genSkills_id_id", flat=True)
        )

    items_with_matches = []
    items_without_matches = []
    
    for tr in qs:
        u = tr.requester  # User B (the person who posted the request)
        display_name = (f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}").strip() or u.username

        # "Needs" = exact reqname that User B posted
        needs = tr.reqname

        # Get all GenSkills that User B has skills in
        user_b_gen_skills_query = (
            UserSkill.objects.filter(user_id=u.id)
            .select_related("specSkills__genSkills_id")
            .values_list("specSkills__genSkills_id_id", "specSkills__genSkills_id__genCateg")
        )
        user_b_gen_skills = dict(user_b_gen_skills_query)  # {gen_skill_id: gen_skill_name}
        
        can_offer = ""
        has_match = False
        
        # Try to find a matching skill first (viewer interested + User B has)
        if viewer and viewer_gen_interests and user_b_gen_skills:
            matching_gen_skills = set(viewer_gen_interests) & set(user_b_gen_skills.keys())
            
            if matching_gen_skills:
                # Get the first matching GenSkill name
                matching_gen_skill_id = list(matching_gen_skills)[0]
                can_offer = user_b_gen_skills[matching_gen_skill_id]
                has_match = True
        
        # If no match, show any random skill from User B
        if not can_offer and user_b_gen_skills:
            can_offer = list(user_b_gen_skills.values())[0]  # Just pick the first one
        
        item_data = {
            "tradereq_id": tr.tradereq_id,  # Add trade request ID
            "requester_id": u.id,  # Add requester user ID
            "name": display_name,
            "rating": float(u.avgStars or 0),
            "ratingCount": int(u.ratingCount or 0),
            "level": int(u.level or 0),
            "need": needs,  # User B's exact reqname
            "offer": can_offer,  # GenSkill that viewer is interested in AND User B has, or random User B skill
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
        }
        
        # Separate into matched vs non-matched for sorting
        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)
    
    # Combine: matches first, then non-matches
    items = items_with_matches + items_without_matches
    
    final_tradereq_ids = [item.get('tradereq_id') for item in items]
    print(f"DEBUG: Final items count: {len(final_tradereq_ids)}")
    print(f"DEBUG: Unique final items: {len(set(final_tradereq_ids))}")
    
    if len(final_tradereq_ids) != len(set(final_tradereq_ids)):
        print("🚨 CRITICAL: Duplicate items in final response!")
    
    def unique_by_tradereq(items):
        seen = set()
        unique = []
        for item in items:
            if item["tradereq_id"] not in seen:
                seen.add(item["tradereq_id"])
                unique.append(item)
        return unique

    items = unique_by_tradereq(items_with_matches) + unique_by_tradereq(items_without_matches)

    return Response({"items": items}, status=200)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def express_trade_interest(request):
    """
    Express interest in a trade request.
    Creates a TradeInterest record - multiple users can express interest.
    """
    print("=== EXPRESS TRADE INTEREST DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    # Get the trade request ID from the request
    tradereq_id = request.data.get('tradereq_id')
    
    if not tradereq_id:
        return Response({"error": "Trade request ID is required"}, status=400)
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester').get(
            tradereq_id=tradereq_id
        )
        
        # Validate that the user isn't trying to respond to their own request
        if trade_request.requester.id == request.user.id:
            return Response({
                "error": "You cannot express interest in your own trade request"
            }, status=400)
        
        # Check if this user has already expressed interest
        existing_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            interested_user=request.user
        ).exists()
        
        if existing_interest:
            return Response({
                "error": "You have already expressed interest in this trade request"
            }, status=400)
        
        # Create the interest record
        trade_interest = TradeInterest.objects.create(
            trade_request=trade_request,
            interested_user=request.user,
        )
        
        # Update trade request status to PENDING if it's the first interest (NULL -> PENDING)
        if not trade_request.status:  # If status is NULL/empty
            trade_request.status = TradeRequest.Status.PENDING
            trade_request.save()
        
        # Get total interest count
        interest_count = TradeInterest.objects.filter(trade_request=trade_request).count()
        
        print(f"Trade interest created successfully")
        print(f"Requester: {trade_request.requester.username}")
        print(f"Interested User: {request.user.username}")
        print(f"Total interests: {interest_count}")
        
        return Response({
            "message": "Interest expressed successfully",
            "tradereq_id": trade_request.tradereq_id,
            "requester": {
                "id": trade_request.requester.id,
                "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username,
                "username": trade_request.requester.username
            },
            "interested_user": {
                "id": request.user.id,
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                "username": request.user.username
            },
            "total_interests": interest_count,
            "reqname": trade_request.reqname,
            "created_at": trade_interest.created_at
        }, status=201)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Express interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to express interest: {str(e)}"
        }, status=500)

# Optional: Add a view to get all interests for a trade request
@api_view(['GET'])
@permission_classes([AllowAny])
def get_trade_interests(request, tradereq_id):
    """
    Get all users who expressed interest in a trade request
    """
    try:
        trade_request = TradeRequest.objects.get(tradereq_id=tradereq_id)
        interests = TradeInterest.objects.filter(trade_request=trade_request).select_related('interested_user')
        
        interests_data = []
        for interest in interests:
            user = interest.interested_user
            interests_data.append({
                "user_id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "username": user.username,
                "level": user.level,
                "rating": float(user.avgStars or 0),
                "created_at": interest.created_at,
            })
        
        return Response({
            "trade_request": {
                "tradereq_id": trade_request.tradereq_id,
                "reqname": trade_request.reqname,
                "requester": trade_request.requester.username
            },
            "interests": interests_data,
            "total_count": len(interests_data)
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posted_trades(request):
    """
    Get all trades posted by the authenticated user with interested users.
    These are trades where the user is the requester.
    """
    user = request.user
    
    # Get trades where user is the requester
    posted_trades = TradeRequest.objects.filter(
        requester=user
    ).prefetch_related(
        'interests__interested_user'  # Prefetch interested users
    ).order_by('-tradereq_id')
    
    trades_data = []
    
    for trade in posted_trades:
        # Get all interested users for this trade
        interested_users = []
        for interest in trade.interests.all():
            interested_user = interest.interested_user
            interested_users.append({
                "id": interested_user.id,
                "name": f"{interested_user.first_name} {interested_user.last_name}".strip() or interested_user.username,
                "username": interested_user.username,
                "level": interested_user.level,
                "rating": float(interested_user.avgStars or 0),
                "rating_count": interested_user.ratingCount,
                "profilePic": f"/media/{interested_user.profilePic}" if interested_user.profilePic else None,
                "created_at": interest.created_at.isoformat()
            })
        
        trades_data.append({
            "tradereq_id": trade.tradereq_id,
            "reqname": trade.reqname,
            "reqbio": trade.reqbio,
            "deadline": trade.reqdeadline.isoformat() if trade.reqdeadline else "",
            "status": trade.status,
            "interested_users": interested_users,
            "interest_count": len(interested_users),
            "created_at": trade.created_at if hasattr(trade, 'created_at') else None
        })
    
    return Response({
        "posted_trades": trades_data,
        "count": len(trades_data)
    }, status=200)