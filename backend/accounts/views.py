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
from .models import SpecSkill, UserSkill, TradeRequest, TradeInterest, TradeDetail  
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
    Returns explore feed. For PENDING trades, exchange is NULL so we calculate can_offer.
    For ACTIVE trades, we use the exchange field.
    """
    viewer = request.user if getattr(request.user, "id", None) else None

    # Load recent requests, exclude viewer's own requests
    # Only show PENDING trades in explore feed (not ACTIVE ones)
    qs = (TradeRequest.objects
          .select_related("requester")
          .filter(Q(status__isnull=True) | Q(status=TradeRequest.Status.PENDING))  # Only pending/null
          .order_by("-tradereq_id"))
    
    if viewer:
        qs = qs.exclude(requester=viewer)
    
    qs = qs[:50]

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

        # For PENDING trades, exchange is NULL, so calculate can_offer from skills
        can_offer = ""
        has_match = False
        
        # Get all GenSkills that User B has skills in
        user_b_gen_skills_query = (
            UserSkill.objects.filter(user_id=u.id)
            .select_related("specSkills__genSkills_id")
            .values_list("specSkills__genSkills_id_id", "specSkills__genSkills_id__genCateg")
        )
        user_b_gen_skills = dict(user_b_gen_skills_query)
        
        # Try to find a matching skill first (viewer interested + User B has)
        if viewer and viewer_gen_interests and user_b_gen_skills:
            matching_gen_skills = set(viewer_gen_interests) & set(user_b_gen_skills.keys())
            
            if matching_gen_skills:
                # Get the first matching GenSkill name
                matching_gen_skill_id = list(matching_gen_skills)[0]
                can_offer = user_b_gen_skills[matching_gen_skill_id]
                has_match = True
        
        # If no match, show any skill from User B
        if not can_offer and user_b_gen_skills:
            can_offer = list(user_b_gen_skills.values())[0]
        
        # ✅ If User B has no skills, get any skill from database instead of "General Skills"
        if not can_offer:
            any_skill = GenSkill.objects.first()
            can_offer = any_skill.genCateg if any_skill else "Skills & Services"
        
        item_data = {
            "tradereq_id": tr.tradereq_id,
            "requester_id": u.id,
            "name": display_name,
            "rating": float(u.avgStars or 0),
            "ratingCount": int(u.ratingCount or 0),
            "level": int(u.level or 0),
            "need": needs,
            "offer": can_offer,
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
        }
        
        # Separate into matched vs non-matched for sorting
        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)
    
    # Combine: matches first, then non-matches
    items = items_with_matches + items_without_matches
    
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
                "interest_id": interest.trade_interests_id,
                "status": interest.status,  
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
    
    # Get requester's skills (Francis's skills)
    requester_skills = {}
    user_skills = UserSkill.objects.filter(user=user).select_related('specSkills__genSkills_id')
    for skill in user_skills:
        gen_category = skill.specSkills.genSkills_id.genCateg
        if gen_category not in requester_skills:
            requester_skills[gen_category] = []
        requester_skills[gen_category].append(skill.specSkills.specName)
    
    trades_data = []
    
    for trade in posted_trades:
        # Get all interested users for this trade
        interested_users = []
        for interest in trade.interests.all():
            interested_user = interest.interested_user
            
            # Get this interested user's interests (what they want to learn/get)
            user_interests = UserInterest.objects.filter(
                user=interested_user
            ).select_related('genSkills_id').values_list('genSkills_id__genCateg', flat=True)
            
            # Find matching skill between requester's skills and interested user's interests
            matching_skill = None
            for gen_category, spec_skills in requester_skills.items():
                if gen_category in user_interests:
                    matching_skill = gen_category  # Use the general category
                    break
            
            interested_users.append({
                "id": interested_user.id,
                "interest_id": interest.trade_interests_id,
                "status": interest.status,  # ✅ Include the status field
                "name": f"{interested_user.first_name} {interested_user.last_name}".strip() or interested_user.username,
                "username": interested_user.username,
                "level": interested_user.level,
                "rating": float(interested_user.avgStars or 0),
                "rating_count": interested_user.ratingCount,
                "profilePic": f"/media/{interested_user.profilePic}" if interested_user.profilePic else None,
                "created_at": interest.created_at.isoformat(),
                "interests": list(user_interests),  # What this user wants to learn
                "matching_skill": matching_skill, 
            })
        
        trades_data.append({
            "tradereq_id": trade.tradereq_id,
            "reqname": trade.reqname,
            "deadline": trade.reqdeadline.isoformat() if trade.reqdeadline else "",
            "status": trade.status,
            "interested_users": interested_users,
            "interest_count": len(interested_users),
            "created_at": trade.created_at if hasattr(trade, 'created_at') else None,
            "requester_skills": requester_skills,  
        })
    
    return Response({
        "posted_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_trade_interest(request, interest_id):
    """
    Decline a trade interest - sets status to DECLINED
    Only the requester (who posted the trade) can decline
    """
    print(f"=== DECLINE TRADE INTEREST DEBUG ===")
    print(f"Interest ID: {interest_id}")
    print(f"User: {request.user.id}")
    
    try:
        # Get the trade interest with related objects
        trade_interest = TradeInterest.objects.select_related(
            'trade_request__requester',
            'interested_user'
        ).get(trade_interests_id=interest_id)
        
        # Check if the current user is the requester (owner of the trade)
        if trade_interest.trade_request.requester.id != request.user.id:
            return Response({
                "error": "Only the trade requester can decline interests"
            }, status=403)
        
        # Check if already processed
        if trade_interest.status != TradeInterest.InterestStatus.PENDING:
            return Response({
                "error": f"This interest has already been {trade_interest.status.lower()}"
            }, status=400)
        
        # Update status to DECLINED
        trade_interest.status = TradeInterest.InterestStatus.DECLINED
        trade_interest.save()
        
        print(f"Trade interest {interest_id} declined successfully")
        
        return Response({
            "message": "Trade interest declined successfully",
            "interest_id": trade_interest.trade_interests_id,
            "status": trade_interest.status,
            "trade_request": {
                "tradereq_id": trade_interest.trade_request.tradereq_id,
                "reqname": trade_interest.trade_request.reqname
            },
            "interested_user": {
                "id": trade_interest.interested_user.id,
                "name": f"{trade_interest.interested_user.first_name} {trade_interest.interested_user.last_name}".strip() or trade_interest.interested_user.username
            }
        }, status=200)
        
    except TradeInterest.DoesNotExist:
        return Response({
            "error": "Trade interest not found"
        }, status=404)
        
    except Exception as e:
        print(f"Decline interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to decline interest: {str(e)}"
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_trade_interest(request, interest_id):
    """
    Accept a trade interest - sets interest status to ACCEPTED and trade status to ACTIVE
    Only the requester (who posted the trade) can accept
    """
    print(f"=== ACCEPT TRADE INTEREST DEBUG ===")
    print(f"Interest ID: {interest_id}")
    print(f"User: {request.user.id}")
    
    try:
        with transaction.atomic():  # Use transaction to ensure consistency
            # Get the trade interest with related objects
            trade_interest = TradeInterest.objects.select_related(
                'trade_request__requester',
                'interested_user'
            ).get(trade_interests_id=interest_id)
            
            # Check if the current user is the requester (owner of the trade)
            if trade_interest.trade_request.requester.id != request.user.id:
                return Response({
                    "error": "Only the trade requester can accept interests"
                }, status=403)
            
            # Check if already processed
            if trade_interest.status != TradeInterest.InterestStatus.PENDING:
                return Response({
                    "error": f"This interest has already been {trade_interest.status.lower()}"
                }, status=400)
            
            # Check if the trade is still available for acceptance
            trade_request = trade_interest.trade_request
            if trade_request.status == TradeRequest.Status.ACTIVE:
                return Response({
                    "error": "This trade has already been accepted by someone else"
                }, status=400)
            
            # Update the trade interest status to ACCEPTED
            trade_interest.status = TradeInterest.InterestStatus.ACCEPTED
            trade_interest.save()
            
            # Update the trade request status to ACTIVE and set responder
            trade_request.status = TradeRequest.Status.ACTIVE
            trade_request.responder = trade_interest.interested_user
            
            # ✅ Calculate and save the exchange field (what responder can offer)
            responder = trade_interest.interested_user
            
            # Get responder's skills (what they can offer)
            responder_skills = UserSkill.objects.filter(
                user=responder
            ).select_related('specSkills__genSkills_id')
            
            # Get requester's interests (what they want to learn)
            requester_interests = UserInterest.objects.filter(
                user=trade_request.requester
            ).select_related('genSkills_id').values_list('genSkills_id__genCateg', flat=True)
            
            # Get all general categories where responder has skills
            responder_gen_categories = set()
            for skill in responder_skills:
                responder_gen_categories.add(skill.specSkills.genSkills_id.genCateg)
            
            print(f"Responder skills categories: {responder_gen_categories}")
            print(f"Requester interests: {list(requester_interests)}")
            
            # Find matching skill between responder's skills and requester's interests
            matching_skills = responder_gen_categories & set(requester_interests)
            
            if matching_skills:
                # Use the first matching skill
                exchange_skill = list(matching_skills)[0]
                print(f"Found matching skill: {exchange_skill}")
            elif responder_gen_categories:
                # If no match with interests, use responder's first skill category
                exchange_skill = list(responder_gen_categories)[0]
                print(f"No match found, using first responder skill: {exchange_skill}")
            else:
                # ✅ Fallback: get ANY skill from any user if responder has no skills
                any_skill = GenSkill.objects.first()
                exchange_skill = any_skill.genCateg if any_skill else "Skills & Services"
                print(f"No responder skills found, using any available skill: {exchange_skill}")
            
            # Save the exchange field
            trade_request.exchange = exchange_skill
            trade_request.save()
            
            print(f"Exchange field saved: {exchange_skill}")
            
            # Decline all other pending interests for this trade
            other_interests = TradeInterest.objects.filter(
                trade_request=trade_request,
                status=TradeInterest.InterestStatus.PENDING
            ).exclude(trade_interests_id=interest_id)
            
            declined_count = other_interests.update(status=TradeInterest.InterestStatus.DECLINED)
            
            print(f"Trade interest {interest_id} accepted successfully")
            print(f"Trade {trade_request.tradereq_id} is now ACTIVE")
            print(f"{declined_count} other interests were declined")
            print(f"Exchange field set to: {trade_request.exchange}")
            
            return Response({
                "message": "Trade interest accepted successfully",
                "interest_id": trade_interest.trade_interests_id,
                "interest_status": trade_interest.status,
                "trade_request": {
                    "tradereq_id": trade_request.tradereq_id,
                    "reqname": trade_request.reqname,
                    "status": trade_request.status,
                    "exchange": trade_request.exchange,
                    "responder": {
                        "id": trade_request.responder.id,
                        "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
                    }
                },
                "other_interests_declined": declined_count
            }, status=200)
            
    except TradeInterest.DoesNotExist:
        return Response({
            "error": "Trade interest not found"
        }, status=404)
        
    except Exception as e:
        print(f"Accept interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to accept interest: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_interested_trades(request):
    """
    Get all trades the authenticated user has expressed interest in (PENDING status)
    """
    user = request.user
    
    # Get all PENDING interests for this user
    user_interests = TradeInterest.objects.filter(
        interested_user=user,
        status=TradeInterest.InterestStatus.PENDING
    ).select_related(
        'trade_request__requester'
    ).order_by('-created_at')
    
    trades_data = []
    
    for interest in user_interests:
        trade_request = interest.trade_request
        requester = trade_request.requester
        
        # Get what the user can offer (their skills)
        user_gen_skills = UserSkill.objects.filter(
            user=user
        ).select_related('specSkills__genSkills_id').values_list(
            'specSkills__genSkills_id__genCateg', flat=True
        ).distinct()
        
        # Pick the first skill they can offer, or any skill if they have none
        if user_gen_skills:
            can_offer = list(user_gen_skills)[0]
        else:
            # ✅ Get any skill from database instead of "General Skills"
            any_skill = GenSkill.objects.first()
            can_offer = any_skill.genCateg if any_skill else "Skills & Services"
        
        # With this logic that matches explore_feed:
        # Get what the REQUESTER can offer (their skills that matched your interests)
        requester_skills = UserSkill.objects.filter(
            user=requester
        ).select_related('specSkills__genSkills_id')

        # Get your interests
        your_interests = UserInterest.objects.filter(
            user=user
        ).values_list('genSkills_id__genCateg', flat=True)

        # Find the matching skill (same logic as explore feed)
        matching_skill = None
        for skill in requester_skills:
            skill_category = skill.specSkills.genSkills_id.genCateg
            if skill_category in your_interests:
                matching_skill = skill_category
                break

        # Use matching skill or fallback
        if matching_skill:
            can_offer = matching_skill
        elif requester_skills:
            can_offer = requester_skills.first().specSkills.genSkills_id.genCateg
        else:
            any_skill = GenSkill.objects.first()
            can_offer = any_skill.genCateg if any_skill else "Skills & Services"
        
        trades_data.append({
            "id": interest.trade_interests_id,
            "trade_request_id": trade_request.tradereq_id,
            "interest_id": interest.trade_interests_id,
            "name": f"{requester.first_name} {requester.last_name}".strip() or requester.username,
            "rating": float(requester.avgStars or 0),
            "reviews": str(requester.ratingCount or 0),
            "level": str(requester.level or 1),
            "needs": trade_request.reqname,  # What they need
            "offers": can_offer,  # What the current user can offer
            "until": trade_request.reqdeadline.strftime('%B %d') if trade_request.reqdeadline else "No deadline",
            "status": "Waiting for approval",
            "created_at": interest.created_at.isoformat(),
            "requester": {
                "id": requester.id,
                "username": requester.username,
                "name": f"{requester.first_name} {requester.last_name}".strip() or requester.username
            }
        })
    
    return Response({
        "interested_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_trades(request):
    """
    Get all ACTIVE trades where the authenticated user is either requester or responder.
    Display from the OTHER user's perspective (what they need and can offer).
    """
    user = request.user
    
    # Get ACTIVE trades where user is either requester or responder
    active_trades = TradeRequest.objects.filter(
        status=TradeRequest.Status.ACTIVE
    ).filter(
        Q(requester=user) | Q(responder=user)
    ).select_related(
        'requester', 'responder'
    ).order_by('-tradereq_id')
    
    trades_data = []
    
    for trade in active_trades:
        # Determine if current user is the requester or responder
        is_requester = (trade.requester.id == user.id)
        other_user = trade.responder if is_requester else trade.requester
        
        # Show from OTHER user's perspective
        if is_requester:
            # You need what the responder can offer - use the exchange field or calculate it
            if trade.exchange:
                needs = trade.exchange  # This should be the skill that matched originally
            else:
                # Fallback logic if exchange is somehow empty
                responder_skills = UserSkill.objects.filter(user=trade.responder).select_related('specSkills__genSkills_id')
                your_interests = UserInterest.objects.filter(user=user).values_list('genSkills_id__genCateg', flat=True)
                
                # Find matching skill
                for skill in responder_skills:
                    if skill.specSkills.genSkills_id.genCateg in your_interests:
                        needs = skill.specSkills.genSkills_id.genCateg
                        break
                else:
                    needs = responder_skills.first().specSkills.genSkills_id.genCateg if responder_skills else "Skills & Services"
            
            can_offer = trade.reqname
        
        trades_data.append({
            "id": trade.tradereq_id,
            "trade_request_id": trade.tradereq_id,
            "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
            "rating": float(other_user.avgStars or 0),
            "reviews": str(other_user.ratingCount or 0),
            "level": str(other_user.level or 1),
            "needs": needs,  
            "offers": can_offer, 
            "until": trade.reqdeadline.strftime('%B %d') if trade.reqdeadline else "No deadline",
            "status": "ACTIVE",
            "is_requester": is_requester,
            "created_at": trade.created_at if hasattr(trade, 'created_at') else None,
            "requester": {
                "id": trade.requester.id,
                "username": trade.requester.username,
                "name": f"{trade.requester.first_name} {trade.requester.last_name}".strip() or trade.requester.username
            },
            "responder": {
                "id": trade.responder.id,
                "username": trade.responder.username,
                "name": f"{trade.responder.first_name} {trade.responder.last_name}".strip() or trade.responder.username
            } if trade.responder else None,
            "other_user": {
                "id": other_user.id,
                "username": other_user.username,
                "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username
            }
        })
    
    return Response({
        "active_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['POST', 'GET'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def add_trade_details(request, tradereq_id):
    """
    Add or get trade details for a specific trade request.
    Both requester and responder must submit their details.
    Calculates XP based on user choices.
    
    POST: Create/update trade details for the authenticated user
    GET: Get all trade details for this trade request
    """
    
    def calculate_xp(skill_prof, mode_del, req_type):
        """
        Calculate total XP based on user choices
        """
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
        
        skill_xp = xp_mapping.get(skill_prof, 0)
        delivery_xp = xp_mapping.get(mode_del, 0)
        request_xp = xp_mapping.get(req_type, 0)
        
        total_xp = skill_xp + delivery_xp + request_xp
        
        print(f"XP Calculation:")
        print(f"  Skill ({skill_prof}): {skill_xp} XP")
        print(f"  Delivery ({mode_del}): {delivery_xp} XP")
        print(f"  Request ({req_type}): {request_xp} XP")
        print(f"  Total: {total_xp} XP")
        
        return total_xp
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade (either requester or responder)
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to add details to this trade"
            }, status=403)
        
        if request.method == 'GET':
            # Return all trade details for this trade request
            trade_details = TradeDetail.objects.filter(
                trade_request=trade_request
            ).select_related('user')
            
            details_data = []
            for detail in trade_details:
                context_pic_url = None
                if detail.contextpic:
                    context_pic_url = request.build_absolute_uri(f"/media/{detail.contextpic}")
                
                details_data.append({
                    "user_id": detail.user.id,
                    "user_name": f"{detail.user.first_name} {detail.user.last_name}".strip() or detail.user.username,
                    "skillprof": detail.skillprof,
                    "modedel": detail.modedel,
                    "reqtype": detail.reqtype,
                    "reqbio": detail.reqbio,
                    "contextpic": context_pic_url,
                    "total_xp": detail.total_xp,
                    "created_at": detail.created_at,
                })
            
            return Response({
                "trade_request": {
                    "tradereq_id": trade_request.tradereq_id,
                    "reqname": trade_request.reqname,
                    "deadline": trade_request.reqdeadline,
                    "status": trade_request.status,
                    "exchange": trade_request.exchange,
                    "requester": {
                        "id": trade_request.requester.id,
                        "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username
                    },
                    "responder": {
                        "id": trade_request.responder.id,
                        "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
                    } if trade_request.responder else None
                },
                "details": details_data,
                "user_has_submitted": any(d["user_id"] == request.user.id for d in details_data),
                "both_submitted": len(details_data) >= 2
            }, status=200)
        
        elif request.method == 'POST':
            print("=== ADD TRADE DETAILS DEBUG ===")
            print(f"Trade request ID: {tradereq_id}")
            print(f"User: {request.user.id}")
            print(f"Request data: {request.data}")
            print(f"Files: {list(request.FILES.keys())}")
            
            # Validate required fields
            delivery_mode = request.data.get('deliveryMode')
            skill_level = request.data.get('skillLevel') 
            request_type = request.data.get('requestType')
            details = request.data.get('details', '').strip()
            
            if not all([delivery_mode, skill_level, request_type, details]):
                return Response({
                    "error": "All fields (delivery mode, skill level, request type, and details) are required"
                }, status=400)
            
            # Map frontend field names to backend choices
            delivery_mode_mapping = {
                'onsite': TradeDetail.ModeDelivery.ONSITE,
                'online': TradeDetail.ModeDelivery.ONLINE,
                'hybrid': TradeDetail.ModeDelivery.HYBRID
            }
            
            skill_level_mapping = {
                'beginner': TradeDetail.SkillProficiency.BEGINNER,
                'intermediate': TradeDetail.SkillProficiency.INTERMEDIATE,
                'advanced': TradeDetail.SkillProficiency.ADVANCED,
                'certified': TradeDetail.SkillProficiency.CERTIFIED
            }
            
            request_type_mapping = {
                'service': TradeDetail.RequestType.SERVICE,
                'output': TradeDetail.RequestType.OUTPUT,
                'project': TradeDetail.RequestType.PROJECT
            }
            
            # Validate and map values
            mapped_delivery = delivery_mode_mapping.get(delivery_mode.lower())
            mapped_skill = skill_level_mapping.get(skill_level.lower())
            mapped_request_type = request_type_mapping.get(request_type.lower())
            
            if not mapped_delivery:
                return Response({"error": f"Invalid delivery mode: {delivery_mode}"}, status=400)
            if not mapped_skill:
                return Response({"error": f"Invalid skill level: {skill_level}"}, status=400)
            if not mapped_request_type:
                return Response({"error": f"Invalid request type: {request_type}"}, status=400)
            
            # Calculate total XP based on choices
            total_xp = calculate_xp(mapped_skill, mapped_delivery, mapped_request_type)
            
            # Handle photo upload
            context_pic = request.FILES.get('photo')
            
            # Create or update trade detail
            trade_detail, created = TradeDetail.objects.get_or_create(
                trade_request=trade_request,
                user=request.user,
                defaults={
                    'skillprof': mapped_skill,
                    'modedel': mapped_delivery,
                    'reqtype': mapped_request_type,
                    'reqbio': details[:150],  # Limit to database field length
                    'contextpic': context_pic,
                    'total_xp': total_xp,  # Store calculated XP
                }
            )
            
            if not created:
                # Update existing record
                trade_detail.skillprof = mapped_skill
                trade_detail.modedel = mapped_delivery
                trade_detail.reqtype = mapped_request_type
                trade_detail.reqbio = details[:150]
                trade_detail.total_xp = total_xp  # Update XP calculation
                if context_pic:
                    trade_detail.contextpic = context_pic
                trade_detail.save()
            
            # Check if both users have submitted details
            total_details = TradeDetail.objects.filter(trade_request=trade_request).count()
            both_submitted = total_details >= 2
            
            context_pic_url = None
            if trade_detail.contextpic:
                context_pic_url = request.build_absolute_uri(f"/media/{trade_detail.contextpic}")
            
            print(f"Trade detail {'created' if created else 'updated'} successfully")
            print(f"Both users submitted details: {both_submitted}")
            print(f"XP awarded: {total_xp}")
            
            return Response({
                "message": f"Trade details {'added' if created else 'updated'} successfully",
                "trade_detail": {
                    "user_id": request.user.id,
                    "skillprof": trade_detail.skillprof,
                    "modedel": trade_detail.modedel,
                    "reqtype": trade_detail.reqtype,
                    "reqbio": trade_detail.reqbio,
                    "contextpic": context_pic_url,
                    "total_xp": trade_detail.total_xp,
                    "created_at": trade_detail.created_at,
                },
                "both_submitted": both_submitted,
                "created": created,
                "xp_breakdown": {
                    "skill_proficiency": {
                        "choice": mapped_skill,
                        "xp": 50 if mapped_skill == TradeDetail.SkillProficiency.BEGINNER else
                             100 if mapped_skill == TradeDetail.SkillProficiency.INTERMEDIATE else
                             150 if mapped_skill == TradeDetail.SkillProficiency.ADVANCED else 200
                    },
                    "delivery_mode": {
                        "choice": mapped_delivery,
                        "xp": 100 if mapped_delivery == TradeDetail.ModeDelivery.ONSITE else
                             75 if mapped_delivery == TradeDetail.ModeDelivery.ONLINE else 150
                    },
                    "request_type": {
                        "choice": mapped_request_type,
                        "xp": 100 if mapped_request_type == TradeDetail.RequestType.OUTPUT else
                             150 if mapped_request_type == TradeDetail.RequestType.SERVICE else 300
                    },
                    "total_xp": total_xp
                }
            }, status=201 if created else 200)
            
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Add trade details error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to add trade details: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_trade_details_status(request, tradereq_id):
    """
    Check the status of trade details submission for both requester and responder
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view this trade's details"
            }, status=403)
        
        # Check if both users have submitted details
        trade_details = TradeDetail.objects.filter(trade_request=trade_request)
        
        requester_detail = trade_details.filter(user=trade_request.requester).first()
        responder_detail = None
        if trade_request.responder:
            responder_detail = trade_details.filter(user=trade_request.responder).first()
        
        requester_submitted = requester_detail is not None
        responder_submitted = responder_detail is not None
        both_submitted = requester_submitted and responder_submitted
        
        current_user_submitted = any(
            detail.user == request.user for detail in trade_details
        )
        
        return Response({
            "trade_request": {
                "tradereq_id": trade_request.tradereq_id,
                "reqname": trade_request.reqname,
                "status": trade_request.status,
                "exchange": trade_request.exchange,
            },
            "requester": {
                "id": trade_request.requester.id,
                "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username,
                "has_submitted": requester_submitted
            },
            "responder": {
                "id": trade_request.responder.id if trade_request.responder else None,
                "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username if trade_request.responder else None,
                "has_submitted": responder_submitted
            } if trade_request.responder else None,
            "current_user": {
                "id": request.user.id,
                "is_requester": request.user == trade_request.requester,
                "is_responder": request.user == trade_request.responder,
                "has_submitted": current_user_submitted
            },
            "submission_status": {
                "both_submitted": both_submitted,
                "requester_submitted": requester_submitted,
                "responder_submitted": responder_submitted,
                "ready_to_proceed": both_submitted
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)