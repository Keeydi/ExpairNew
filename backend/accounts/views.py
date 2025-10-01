import json
import datetime
import os
from datetime import date

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone as django_timezone
from django.utils.timezone import localdate
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, EmailMultiAlternatives
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

from .models import (
    Evaluation, GenSkill, ReputationSystem, TradeDetail, TradeHistory, UserInterest, User, VerificationStatus, UserCredential,
    SpecSkill, UserSkill, TradeRequest, TradeInterest, PasswordResetToken
)
from .serializers import (
    ProfileUpdateSerializer, UserCredentialSerializer,
    SpecSkillSerializer, UserSkillBulkSerializer,
    UserSerializer, GenSkillSerializer, UserInterestBulkSerializer
)

# In views.py

@csrf_exempt
@api_view(['POST']) 
@permission_classes([AllowAny])
def validate_field(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            field_name = data.get('field')
            value = data.get('value')

            if not field_name or not value:
                return JsonResponse({'error': 'Field and value are required.'}, status=400)

            if field_name == 'username':
                exists = User.objects.filter(username__iexact=value).exists()
            elif field_name == 'email':
                exists = User.objects.filter(email__iexact=value).exists()
            else:
                return JsonResponse({'error': 'Invalid field for validation.'}, status=400)

            return JsonResponse({'exists': exists})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Handles a forgot password request.
    Always returns a successful response to prevent user enumeration.
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)

        # Invalidate old tokens and create a new one
        PasswordResetToken.objects.filter(user=user).delete()
        token = PasswordResetToken.objects.create(user=user)

        # Link to your frontend password reset page
        reset_link = f"http://localhost:3000/reset-password?token={token.token}"
        context = {'user': user, 'reset_link': reset_link}

        # Render email content
        html_message = render_to_string('emails/password_reset_email.html', context)
        plain_message = f"Hello {user.first_name},\n\nClick the following link to reset your password:\n{reset_link}"

        # Send the email
        send_mail(
            'Expair Password Reset Request',
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message,
        )
    except User.DoesNotExist:
        # If the user does not exist, we do nothing.
        # This prevents revealing that the email is not in our system.
        pass
    except Exception as e:
        # It's good practice to log the actual error for debugging
        print(f"Error in forgot_password view: {e}")

    # ✅ Always return this generic success message
    return Response(
        {'message': 'If an account with that email exists, a password reset link has been sent.'},
        status=status.HTTP_200_OK
    )
        
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Handles a password reset request by validating the token and updating the password.
    """
    try:
        token_value = request.data.get('token')
        new_password = request.data.get('password')
        
        if not token_value or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find the token and validate it
        token_obj = get_object_or_404(PasswordResetToken, token=token_value)
        if not token_obj.is_valid():
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        
        # Update the user's password and delete the token
        user.set_password(new_password)
        user.save()
        token_obj.delete()

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error in reset_password view: {e}")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

print(f"DEBUG: Expected template path: {os.path.join(settings.BASE_DIR, 'accounts', 'templates', 'emails', 'password_reset_email.html')}")
   
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
    links_array = user.links or []

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
    
    # Interests
    interests = []
    try:
        qs = UserInterest.objects.filter(user_id=user.id).select_related("genSkills_id")
        interests = [ui.genSkills_id.genCateg for ui in qs]
    except Exception as e:
        print(f"[DEBUG] could not fetch interests for user {user.id}: {e}")

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
        "location": getattr(user, "location", ""),
        "links": links_array,
        "interests": [
            ui.genSkills_id.genCateg
            for ui in UserInterest.objects.filter(user=user).select_related("genSkills_id")
        ],        
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
    print(f"  - location: '{payload['location']}'")
    print(f"  - links: {links_array}")
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
                if isinstance(data["links"], str):
                    data["links"] = json.loads(data["links"])
                # now guaranteed to be a Python list
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
        serializer.save(user_id=user_id)
        
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
    name = request.data.get('name', '')
    image = request.data.get('image')

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        # Check if user exists
        user = User.objects.get(email=email)
        print(f"Existing user found: {user.username}")
        
        # EXISTING USER LOGIC - Generate JWT tokens like regular login
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            print("JWT tokens generated for existing Google user")
        except Exception as token_error:
            print(f"Token generation failed: {token_error}")
            return Response({
                "error": "Authentication system error. Please try again."
            }, status=500)
        
        # Get user payload (same as your regular login)
        user_payload = _public_user_payload(user, request)
        
        # Return same format as your regular login for existing users
        return Response({
            "is_new": False,
            "message": "Login successful",
            "user_id": user.id,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": user.first_name,  # For compatibility
            "profilePic": user_payload.get("profilePic"),
            "image": user_payload.get("profilePic"),
            "access": access_token,  # JWT tokens for existing user
            "refresh": refresh_token,
        }, status=200)
        
    except User.DoesNotExist:
        print(f"New user with email: {email}")
        
        # NEW USER LOGIC - Parse name and return registration data
        full_name = name.strip()
        name_parts = full_name.split(" ") if full_name else []
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        # Return data for new user registration flow (NO tokens)
        return Response({
            "is_new": True,
            "email": email,
            "name": name,
            "first_name": first_name,
            "last_name": last_name,
            "image": image,
            "message": "New user detected - please complete registration"
        }, status=200)
        
    except Exception as e:
        print(f"Error in google_login: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": "Server error occurred"
        }, status=500)

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
            "last_name": user.last_name,
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

@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def user_interests(request, user_id: int):
    """
    GET -> list user interests
    DELETE -> remove selected interests (bulk supported)
    """
    if request.method == 'GET':
        qs = UserInterest.objects.filter(user_id=user_id).select_related("genSkills_id")
        interests = [ui.genSkills_id.genCateg for ui in qs]
        return Response(interests, status=200)

    elif request.method == 'DELETE':
        # Expect: { "genSkills_ids": [1, 3, 5] }
        ids = request.data.get("genSkills_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"error": "genSkills_ids must be a non-empty list"}, status=400)

        deleted, _ = UserInterest.objects.filter(
            user_id=user_id,
            genSkills_id_id__in=ids
        ).delete()

        return Response({"deleted_count": deleted}, status=200)

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
        ids = list(it.get('specskills') or [])
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
                        {"detail": f"specskills {sid} does not belong to genskills_id {gid}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except SpecSkill.DoesNotExist:
                return Response({"detail": f"specskills {sid} not found."}, status=404)

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_home_active_trades(request):
    """
    Get ACTIVE and COMPLETED trades where both users have submitted trade details - for home page display.
    ✅ FILTERS OUT trades where current user has already rated (using requester_rated/responder_rated flags).
    Shows the OTHER user's information and what they're offering.
    """
    user = request.user
    
    print(f"=== GET_HOME_ACTIVE_TRADES DEBUG ===")
    print(f"User ID: {user.id}")
    
    try:
        # Get ACTIVE and COMPLETED trades where user is either requester or responder
        # ✅ NEW FILTERING LOGIC: Exclude trades where current user has already rated
        active_trades_query = TradeRequest.objects.filter(
            Q(status=TradeRequest.Status.ACTIVE) | Q(status=TradeRequest.Status.COMPLETED)
        ).filter(
            Q(requester=user) | Q(responder=user)
        ).select_related('requester', 'responder')
        
        # ✅ FILTER OUT trades where current user has already rated
        filtered_trades = []
        for trade in active_trades_query:
            current_user_is_requester = (trade.requester.id == user.id)
            
            # Skip if current user has already rated
            if current_user_is_requester and trade.requester_rated:
                print(f"Skipping trade {trade.tradereq_id} - requester (current user) has already rated")
                continue
            elif not current_user_is_requester and trade.responder_rated:
                print(f"Skipping trade {trade.tradereq_id} - responder (current user) has already rated")
                continue
            
            filtered_trades.append(trade)
        
        print(f"Found {len(filtered_trades)} active trades where user hasn't rated yet")
        
        # Get all trade details in one query to avoid N+1 problem
        trade_ids = [trade.tradereq_id for trade in filtered_trades]
        all_trade_details = TradeDetail.objects.filter(
            trade_request_id__in=trade_ids
        ).select_related('user', 'trade_request')
        
        # Group trade details by trade_request_id for easy lookup
        trade_details_map = {}
        for detail in all_trade_details:
            trade_id = detail.trade_request_id
            if trade_id not in trade_details_map:
                trade_details_map[trade_id] = []
            trade_details_map[trade_id].append(detail)
        
        # Filter trades where BOTH users have submitted details (regardless of proof status)
        trades_with_both_details = []
        for trade in filtered_trades:
            details_for_trade = trade_details_map.get(trade.tradereq_id, [])
            user_ids_with_details = {detail.user_id for detail in details_for_trade}
            
            # Check if both requester and responder have submitted details
            if trade.requester_id in user_ids_with_details and trade.responder_id in user_ids_with_details:
                trades_with_both_details.append(trade)
                print(f"Trade {trade.tradereq_id} has both details submitted - showing in Active Trades")
        
        print(f"Found {len(trades_with_both_details)} trades with both details submitted")
        
        # Pre-fetch user skills and interests to avoid queries in loop
        all_user_ids = set()
        for trade in trades_with_both_details:
            all_user_ids.add(trade.requester_id)
            all_user_ids.add(trade.responder_id)
        
        # Get all user skills at once
        user_skills_map = {}
        all_user_skills = UserSkill.objects.filter(
            user_id__in=all_user_ids
        ).select_related('specSkills__genSkills_id')
        
        for skill in all_user_skills:
            if skill.user_id not in user_skills_map:
                user_skills_map[skill.user_id] = []
            user_skills_map[skill.user_id].append(skill.specSkills.genSkills_id.genCateg)
        
        # Get all user interests at once
        user_interests_map = {}
        all_user_interests = UserInterest.objects.filter(
            user_id__in=all_user_ids
        ).select_related('genSkills_id')
        
        for interest in all_user_interests:
            if interest.user_id not in user_interests_map:
                user_interests_map[interest.user_id] = []
            user_interests_map[interest.user_id].append(interest.genSkills_id.genCateg)
        
        # Get fallback skill once
        fallback_skill = GenSkill.objects.first()
        fallback_skill_name = fallback_skill.genCateg if fallback_skill else "Skills & Services"
        
        home_trades_data = []
        
        for trade in trades_with_both_details:
            print(f"Processing trade {trade.tradereq_id}")
            
            # Determine which user is the "other" user
            is_requester = (trade.requester.id == user.id)
            other_user = trade.responder if is_requester else trade.requester
            
            # Get the other user's trade detail from our pre-fetched data
            other_user_detail = None
            details_for_trade = trade_details_map.get(trade.tradereq_id, [])
            for detail in details_for_trade:
                if detail.user_id == other_user.id:
                    other_user_detail = detail
                    break
            
            # Determine what the other user is offering to current user
            if is_requester:
                # Current user is requester, other user (responder) is offering their exchange skill
                offering = trade.exchange if trade.exchange else fallback_skill_name
            else:
                # Current user is responder, other user (requester) can offer their skills
                # Use pre-fetched data instead of making queries
                requester_skills = user_skills_map.get(trade.requester.id, [])
                responder_interests = user_interests_map.get(user.id, [])
                
                # Find matching skill between requester's skills and responder's interests
                offering = ""
                if responder_interests and requester_skills:
                    matching_skills = set(requester_skills) & set(responder_interests)
                    if matching_skills:
                        offering = list(matching_skills)[0]
                
                # If no match, show any skill the requester has
                if not offering and requester_skills:
                    offering = requester_skills[0]
                
                # If requester has no skills, use fallback
                if not offering:
                    offering = fallback_skill_name
            
            # Get profile picture URL
            profile_pic_url = None
            if other_user.profilePic:
                profile_pic_url = request.build_absolute_uri(f"/media/{other_user.profilePic}")
            
            home_trades_data.append({
                "tradereq_id": trade.tradereq_id,
                "other_user": {
                    "id": other_user.id,
                    "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                    "username": other_user.username, 
                    "profilePic": profile_pic_url,
                    "level": other_user.level,
                    "rating": float(other_user.avgStars or 0)
                },
                "offering": offering,  # What the other user is offering to current user
                "reqname": trade.reqname,  # The original request name
                "total_xp": other_user_detail.total_xp if other_user_detail else 0,
                "deadline": trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                "deadline_formatted": trade.reqdeadline.strftime('%B %d') if trade.reqdeadline else "No deadline",
                "is_requester": is_requester,
                "status": trade.status,
                # Remove these fields since we're showing all ACTIVE trades now
                # "ready_to_rate": True,  
                # "both_proofs_approved": True  
            })
        
        print(f"Returning {len(home_trades_data)} active trades")
        
        return Response({
            "home_active_trades": home_trades_data,
            "count": len(home_trades_data)
        }, status=200)
        
    except Exception as e:
        print(f"ERROR in get_home_active_trades: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to get home active trades: {str(e)}",
            "home_active_trades": [],
            "count": 0
        }, status=500)

@api_view(["GET"])
@permission_classes([AllowAny])
def explore_feed(request):
    """
    Returns explore feed. Shows what each requester can offer based on skill matching.
    Includes CANCELLED trades so they can receive new offers.
    """
    viewer = request.user if getattr(request.user, "id", None) else None

    # Load recent requests, exclude viewer's own requests
    # Show PENDING, NULL (no status), and CANCELLED trades in explore feed
    # Exclude only ACTIVE and COMPLETED trades
    qs = (TradeRequest.objects
          .select_related("requester")
          .exclude(status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED])  # Exclude only active/completed
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
        requester = tr.requester  # The person who posted the request
        display_name = (f"{(requester.first_name or '').strip()} {(requester.last_name or '').strip()}").strip() or requester.username

        # "Needs" = what the requester is asking for
        needs = tr.reqname

        # Get profile picture URL
        profile_pic_url = None
        if requester.profilePic:
            # Build absolute URL for the profile picture
            profile_pic_url = request.build_absolute_uri(requester.profilePic.url)

        # Get all skills that the REQUESTER has (what they can offer in exchange)
        requester_skills_query = (
            UserSkill.objects.filter(user_id=requester.id)
            .select_related("specSkills__genSkills_id")
            .values_list("specSkills__genSkills_id_id", "specSkills__genSkills_id__genCateg")
        )
        requester_gen_skills = dict(requester_skills_query)
        
        # Determine what the requester "can offer"
        can_offer = ""
        has_match = False
        
        # Priority 1: Find skills that the requester has AND the viewer is interested in
        if viewer and viewer_gen_interests and requester_gen_skills:
            # Find intersection of requester's skills and viewer's interests
            matching_skills = set(viewer_gen_interests) & set(requester_gen_skills.keys())
            
            if matching_skills:
                # Use the first matching skill
                matching_skill_id = list(matching_skills)[0]
                can_offer = requester_gen_skills[matching_skill_id]
                has_match = True
        
        # Priority 2: If no match, show any skill the requester has
        if not can_offer and requester_gen_skills:
            can_offer = list(requester_gen_skills.values())[0]
        
        # Priority 3: If requester has no skills, use fallback
        if not can_offer:
            any_skill = GenSkill.objects.first()
            can_offer = any_skill.genCateg if any_skill else "Skills & Services"
        
        item_data = {
            "tradereq_id": tr.tradereq_id,
            "requester_id": requester.id,
            "name": display_name,
            "rating": float(requester.avgStars or 0),
            "ratingCount": int(requester.ratingCount or 0),
            "level": int(requester.level or 0),
            "need": needs,
            "offer": can_offer,  # What the requester can offer
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
            "profilePicUrl": profile_pic_url,  # Add profile picture URL
            "userId": requester.id,  # Add user ID for profile linking
            "username": requester.username, 
        }
        
        # Separate matched items (requester has skill viewer wants) from non-matched
        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)
    
    # Combine: prioritize matches first, then non-matches
    def unique_by_tradereq(items):
        seen = set()
        unique = []
        for item in items:
            if item["tradereq_id"] not in seen:
                seen.add(item["tradereq_id"])
                unique.append(item)
        return unique

    # Ensure uniqueness and combine matched + non-matched
    items = unique_by_tradereq(items_with_matches) + unique_by_tradereq(items_without_matches)

    return Response({"items": items}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def express_trade_interest(request):
    """
    Express interest in a trade request.
    Creates a TradeInterest record - multiple users can express interest.
    If user was previously DECLINED, reactivates their interest to PENDING.
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
        
        # Check if this user has already expressed PENDING or ACCEPTED interest
        # Allow re-expressing interest if previously DECLINED
        existing_active_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            interested_user=request.user,
            status__in=[TradeInterest.InterestStatus.PENDING, TradeInterest.InterestStatus.ACCEPTED]
        ).exists()
        
        if existing_active_interest:
            return Response({
                "error": "You have already expressed interest in this trade request"
            }, status=400)
        
        # Check if there's a DECLINED interest - if so, update it to PENDING instead of creating new
        declined_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            interested_user=request.user,
            status=TradeInterest.InterestStatus.DECLINED
        ).first()
        
        if declined_interest:
            # Reactivate the declined interest
            declined_interest.status = TradeInterest.InterestStatus.PENDING
            declined_interest.created_at = django_timezone.now()  # Update timestamp
            declined_interest.save()
            
            trade_interest = declined_interest
            print(f"Reactivated declined interest for user {request.user.id}")
        else:
            # Create new interest record
            trade_interest = TradeInterest.objects.create(
                trade_request=trade_request,
                interested_user=request.user,
            )
            print(f"Created new trade interest for user {request.user.id}")
        
        # Update trade request status to PENDING if it's the first interest (NULL -> PENDING)
        if not trade_request.status:  # If status is NULL/empty
            trade_request.status = TradeRequest.Status.PENDING
            trade_request.save()
        
        # Get total PENDING interest count (exclude declined)
        interest_count = TradeInterest.objects.filter(
            trade_request=trade_request,
            status=TradeInterest.InterestStatus.PENDING
        ).count()
        
        print(f"Trade interest created/reactivated successfully")
        print(f"Requester: {trade_request.requester.username}")
        print(f"Interested User: {request.user.username}")
        print(f"Total pending interests: {interest_count}")
        
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
            "created_at": trade_interest.created_at,
            "reactivated": declined_interest is not None
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

            profile_pic_url = None
            if user.profilePic:
                profile_pic_url = request.build_absolute_uri(user.profilePic.url)

            interests_data.append({
                "user_id": user.id,
                "interest_id": interest.trade_interests_id,
                "status": interest.status,  
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "username": user.username,
                "level": user.level,
                "rating": float(user.avgStars or 0),
                "rating_count": user.ratingCount,
                "profilePic": profile_pic_url,
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
    # Show PENDING (waiting for confirmation), NULL (no interests yet), and CANCELLED (can pick another offer)
    # Hide ACTIVE (already confirmed) and COMPLETED trades
    posted_trades = TradeRequest.objects.filter(
        requester=user
    ).exclude(
        status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED]
    ).prefetch_related(
        'interests__interested_user'
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

            if not matching_skill and requester_skills:
                matching_skill = list(requester_skills.keys())[0]  # Show any skill from requester
            elif not matching_skill:
                any_skill = GenSkill.objects.first()
                matching_skill = any_skill.genCateg if any_skill else "Skills & Services"

            interested_users.append({
                "id": interested_user.id,
                "interest_id": interest.trade_interests_id,
                "status": interest.status,  # ✅ Include the status field
                "name": f"{interested_user.first_name} {interested_user.last_name}".strip() or interested_user.username,
                "username": interested_user.username,
                "level": interested_user.level,
                "rating": float(interested_user.avgStars or 0),
                "rating_count": interested_user.ratingCount,
                "profilePic": request.build_absolute_uri(f"/media/{interested_user.profilePic}") if interested_user.profilePic else None,
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

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_trade_request(request, tradereq_id):
    """
    Delete a trade request - only the requester can delete their own posts
    """
    try:
        trade_request = TradeRequest.objects.get(
            tradereq_id=tradereq_id,
            requester=request.user
        )
        
        # Check if trade has any accepted interests (shouldn't delete if someone already accepted)
        has_accepted_interests = TradeInterest.objects.filter(
            trade_request=trade_request,
            status=TradeInterest.InterestStatus.ACCEPTED
        ).exists()
        
        if has_accepted_interests:
            return Response({
                "error": "Cannot delete trade request that has been accepted by someone"
            }, status=400)
        
        # Delete the trade request (this will cascade delete related interests)
        trade_request.delete()
        
        return Response({
            "message": "Trade request deleted successfully",
            "tradereq_id": tradereq_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found or you don't have permission to delete it"
        }, status=404)
    except Exception as e:
        print(f"Delete trade request error: {str(e)}")
        return Response({
            "error": f"Failed to delete trade request: {str(e)}"
        }, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_trade_interest(request, interest_id):
    """
    Decline a trade interest - sets status to DECLINED
    Only the requester (who posted the trade) can decline
    If no more pending interests remain, revert trade status to null
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
        
        with transaction.atomic():
            # Update status to DECLINED
            trade_interest.status = TradeInterest.InterestStatus.DECLINED
            trade_interest.save()
            
            # ✅ CHECK IF ANY PENDING INTERESTS REMAIN
            remaining_pending_interests = TradeInterest.objects.filter(
                trade_request=trade_interest.trade_request,
                status=TradeInterest.InterestStatus.PENDING
            ).count()
            
            print(f"Remaining pending interests: {remaining_pending_interests}")
            
            # ✅ IF NO PENDING INTERESTS REMAIN, REVERT TRADE STATUS TO NULL
            if remaining_pending_interests == 0:
                trade_request = trade_interest.trade_request
                trade_request.status = None  # Revert to null/no status
                trade_request.save()
                print(f"Trade {trade_request.tradereq_id} status reverted to NULL - no pending interests remain")
        
        print(f"Trade interest {interest_id} declined successfully")
        
        return Response({
            "message": "Trade interest declined successfully",
            "interest_id": trade_interest.trade_interests_id,
            "status": trade_interest.status,
            "trade_request": {
                "tradereq_id": trade_interest.trade_request.tradereq_id,
                "reqname": trade_interest.trade_request.reqname,
                "status": trade_interest.trade_request.status,  # Will be None if reverted
                "reverted_to_explore": remaining_pending_interests == 0
            },
            "interested_user": {
                "id": trade_interest.interested_user.id,
                "name": f"{trade_interest.interested_user.first_name} {trade_interest.interested_user.last_name}".strip() or trade_interest.interested_user.username
            },
            "remaining_pending_interests": remaining_pending_interests
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
    Accept a trade interest - sets interest status to ACCEPTED but keeps trade as PENDING
    Trade only becomes ACTIVE after evaluation confirmation
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
            
            # Set trade to PENDING and assign responder
            trade_request.status = TradeRequest.Status.PENDING
            trade_request.responder = trade_interest.interested_user
            
            print(f"Setting responder to user ID: {trade_interest.interested_user.id}")
            print(f"Requester ID: {trade_request.requester.id}")
            print(f"Trade status set to: {trade_request.status}")
            
            # Calculate and save the exchange field using CONSISTENT logic with explore_feed
            responder = trade_interest.interested_user
            
            # Get responder's skills (what they can offer) - same logic as explore_feed
            responder_skills_query = (
                UserSkill.objects.filter(user_id=responder.id)
                .select_related("specSkills__genSkills_id")
                .values_list("specSkills__genSkills_id_id", "specSkills__genSkills_id__genCateg")
            )
            responder_gen_skills = dict(responder_skills_query)
            
            # Get requester's interests (what they want to learn)
            requester_interests = UserInterest.objects.filter(
                user=trade_request.requester
            ).select_related('genSkills_id').values_list('genSkills_id__genCateg', flat=True)
            
            print(f"Responder skills: {list(responder_gen_skills.values())}")
            print(f"Requester interests: {list(requester_interests)}")
            
            # Find matching skill between responder's skills and requester's interests
            # SAME LOGIC as explore_feed for consistency
            exchange_skill = ""
            has_match = False
            
            if requester_interests and responder_gen_skills:
                # Find intersection of responder's skills and requester's interests
                matching_skills = set(responder_gen_skills.values()) & set(requester_interests)
                
                if matching_skills:
                    # Use the first matching skill
                    exchange_skill = list(matching_skills)[0]
                    has_match = True
                    print(f"Found matching skill: {exchange_skill}")
            
            # If no match, show any skill the responder has
            if not exchange_skill and responder_gen_skills:
                exchange_skill = list(responder_gen_skills.values())[0]
                print(f"No match found, using first responder skill: {exchange_skill}")
            
            # If responder has no skills, use fallback
            if not exchange_skill:
                any_skill = GenSkill.objects.first()
                exchange_skill = any_skill.genCateg if any_skill else "Skills & Services"
                print(f"No responder skills found, using fallback: {exchange_skill}")
            
            # Save the exchange field
            trade_request.exchange = exchange_skill
            trade_request.save()
            
            # Force refresh to ensure the save worked
            trade_request.refresh_from_db()
            
            # Verify the responder was set correctly
            if not trade_request.responder:
                raise Exception("Failed to set responder for trade request")
            
            print(f"Exchange field saved: {exchange_skill}")
            print(f"Trade saved with requester ID: {trade_request.requester.id}, responder ID: {trade_request.responder.id}")
            print(f"VERIFICATION - Reloaded trade: requester={trade_request.requester.id}, responder={trade_request.responder.id}")
            
            # Decline all other pending interests for this trade
            other_interests = TradeInterest.objects.filter(
                trade_request=trade_request,
                status=TradeInterest.InterestStatus.PENDING
            ).exclude(trade_interests_id=interest_id)
            
            declined_count = other_interests.update(status=TradeInterest.InterestStatus.DECLINED)
            
            print(f"Trade interest {interest_id} accepted successfully")
            print(f"Trade {trade_request.tradereq_id} is now PENDING (waiting for evaluation)")
            print(f"{declined_count} other interests were declined")
            print(f"Exchange field set to: {trade_request.exchange}")
            
            return Response({
                "message": "Trade interest accepted successfully - proceed to evaluation",
                "interest_id": trade_interest.trade_interests_id,
                "interest_status": trade_interest.status,
                "trade_request": {
                    "tradereq_id": trade_request.tradereq_id,
                    "reqname": trade_request.reqname,
                    "status": trade_request.status,  # Will be PENDING, not ACTIVE
                    "exchange": trade_request.exchange,
                    "requester_id": trade_request.requester.id,
                    "responder_id": trade_request.responder.id if trade_request.responder else None,
                    "responder": {
                        "id": trade_request.responder.id,
                        "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
                    },
                    "requires_evaluation": True  # Indicate that evaluation is needed
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
            "profile_pic": request.build_absolute_uri(f"/media/{requester.profilePic}") if requester.profilePic else None,
            "created_at": interest.created_at.isoformat(),
            "requester": {
                "id": requester.id,
                "username": requester.username,
                "name": f"{requester.first_name} {requester.last_name}".strip() or requester.username,
                "profile_pic": request.build_absolute_uri(f"/media/{requester.profilePic}") if requester.profilePic else None
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
    Get all PENDING trades where the authenticated user is either requester or responder.
    These are accepted trades waiting for details submission and evaluation.
    """
    user = request.user
    
    print(f"=== GET_ACTIVE_TRADES DEBUG ===")
    print(f"User ID: {user.id}")
    
    # Get PENDING trades where user is either requester or responder
    active_trades = TradeRequest.objects.filter(
        status=TradeRequest.Status.PENDING
    ).filter(
        Q(requester=user) | Q(responder=user)
    ).select_related('requester', 'responder').order_by('-tradereq_id')
    
    print(f"Found {active_trades.count()} PENDING trades")
    
    trades_data = []
    
    for trade in active_trades:
        print(f"Processing Trade {trade.tradereq_id}:")
        print(f"  - Requester: {trade.requester.id}")
        print(f"  - Responder: {trade.responder.id if trade.responder else 'None'}")
        print(f"  - User is requester: {trade.requester.id == user.id}")
        print(f"  - User is responder: {trade.responder and trade.responder.id == user.id}")
        
        # Skip if responder is not set
        if not trade.responder:
            print(f"  - SKIPPING: No responder set for trade {trade.tradereq_id}")
            continue
        
        # Determine if current user is the requester or responder
        is_requester = (trade.requester.id == user.id)
        other_user = trade.responder if is_requester else trade.requester
        
        # Get fallback skill once
        fallback_skill = GenSkill.objects.first()
        fallback_skill_name = fallback_skill.genCateg if fallback_skill else "Skills & Services"
        
        # ✅ USE THE SAVED EXCHANGE FIELD - no recalculation needed!
        # The exchange field was set correctly when the interest was accepted
        if is_requester:
            # Current user is requester
            needs = trade.exchange if trade.exchange else fallback_skill_name  # What responder is offering
            can_offer = trade.reqname  # What requester originally requested
        else:
            # Current user is responder
            needs = trade.reqname  # What requester originally requested
            can_offer = trade.exchange if trade.exchange else fallback_skill_name  # What responder is offering
        
        print(f"  - Is requester: {is_requester}")
        print(f"  - Needs: {needs}")
        print(f"  - Can offer: {can_offer}")
        print(f"  - Other user: {other_user.username}")
        print(f"  - Exchange field: {trade.exchange}")
        
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
            "status": "PENDING",
            "other_user_profile_pic": request.build_absolute_uri(f"/media/{other_user.profilePic}") if other_user.profilePic else None,
            "is_requester": is_requester,
            "created_at": None,
            "requester": {
                "id": trade.requester.id,
                "username": trade.requester.username,
                "name": f"{trade.requester.first_name} {trade.requester.last_name}".strip() or trade.requester.username
            },
            "responder": {
                "id": trade.responder.id,
                "username": trade.responder.username,
                "name": f"{trade.responder.first_name} {trade.responder.last_name}".strip() or trade.responder.username
            },
            "other_user": {
                "id": other_user.id,
                "username": other_user.username,
                "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username
            }
        })
    
    print(f"Returning {len(trades_data)} trades for user {user.id}")
    
    return Response({
        "active_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_evaluation_details(request, tradereq_id):
    """
    Get evaluation details for a trade request.
    Creates evaluation if both users have submitted trade details.
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view this evaluation"
            }, status=403)
        
        # Check if both users have submitted details
        trade_details = TradeDetail.objects.filter(trade_request=trade_request)
        requester_detail = trade_details.filter(user=trade_request.requester).first()
        responder_detail = trade_details.filter(user=trade_request.responder).first()
        
        if not (requester_detail and responder_detail):
            return Response({
                "error": "Both users must submit trade details before evaluation"
            }, status=400)
        
        # Calculate evaluation scores based on trade details
        def calculate_complexity(req_detail, resp_detail):
            complexity_map = {
                TradeDetail.RequestType.OUTPUT: 40,
                TradeDetail.RequestType.SERVICE: 60,
                TradeDetail.RequestType.PROJECT: 80,
            }
            req_complexity = complexity_map.get(req_detail.reqtype, 50)
            resp_complexity = complexity_map.get(resp_detail.reqtype, 50)
            return min(100, max(20, (req_complexity + resp_complexity) // 2))
        
        def calculate_time_commitment(req_detail, resp_detail):
            time_map = {
                TradeDetail.RequestType.OUTPUT: 30,
                TradeDetail.RequestType.SERVICE: 50,
                TradeDetail.RequestType.PROJECT: 80,
            }
            req_time = time_map.get(req_detail.reqtype, 40)
            resp_time = time_map.get(resp_detail.reqtype, 40)
            return min(100, max(20, (req_time + resp_time) // 2))
        
        def calculate_skill_level(req_detail, resp_detail):
            skill_map = {
                TradeDetail.SkillProficiency.BEGINNER: 40,
                TradeDetail.SkillProficiency.INTERMEDIATE: 60,
                TradeDetail.SkillProficiency.ADVANCED: 80,
                TradeDetail.SkillProficiency.CERTIFIED: 90,
            }
            req_skill = skill_map.get(req_detail.skillprof, 50)
            resp_skill = skill_map.get(resp_detail.skillprof, 50)
            return min(100, max(20, (req_skill + resp_skill) // 2))
        
        # Calculate dynamic values
        task_complexity = calculate_complexity(requester_detail, responder_detail)
        time_commitment = calculate_time_commitment(requester_detail, responder_detail)
        skill_level = calculate_skill_level(requester_detail, responder_detail)
        
        # Generate dynamic feedback
        complexity_desc = "challenging" if task_complexity > 70 else "moderate" if task_complexity > 40 else "simple"
        time_desc = "high" if time_commitment > 70 else "moderate" if time_commitment > 40 else "low"
        skill_desc = "advanced" if skill_level > 70 else "intermediate" if skill_level > 40 else "basic"
        
        dynamic_feedback = (
            f"This trade between {trade_request.requester.first_name} and {trade_request.responder.first_name} "
            f"involves {complexity_desc} tasks with {time_desc} time commitment and requires {skill_desc} skill levels. "
            f"The exchange of {trade_request.reqname} for {trade_request.exchange} offers valuable learning opportunities "
            f"for both parties and represents a well-balanced trade arrangement."
        )
        
        # Get or create evaluation with calculated values
        evaluation, created = Evaluation.objects.get_or_create(
            trade_request=trade_request,
            defaults={
                'taskcomplexity': task_complexity,
                'timecommitment': time_commitment,
                'skilllevel': skill_level,
                'evaluationdescription': dynamic_feedback
            }
        )
        
        # If evaluation already exists but was created with defaults, update it
        if not created and evaluation.evaluationdescription.startswith("Trade evaluation for"):
            evaluation.taskcomplexity = task_complexity
            evaluation.timecommitment = time_commitment
            evaluation.skilllevel = skill_level
            evaluation.evaluationdescription = dynamic_feedback
            evaluation.save()
        
        print(f"Evaluation data: complexity={task_complexity}, time={time_commitment}, skill={skill_level}")
        
        return Response({
            "evaluation": {
                "tradereq_id": trade_request.tradereq_id,
                "requestTitle": trade_request.reqname,
                "offerTitle": trade_request.exchange,
                "taskComplexity": evaluation.taskcomplexity,
                "timeCommitment": evaluation.timecommitment,
                "skillLevel": evaluation.skilllevel,
                "tradeScore": min(10, max(1, (evaluation.taskcomplexity + evaluation.timecommitment + evaluation.skilllevel) // 30)),
                "feedback": evaluation.evaluationdescription,
                "requester_evaluation_status": evaluation.requester_evaluation_status,
                "responder_evaluation_status": evaluation.responder_evaluation_status,
                "both_users_responded": (
                    evaluation.requester_evaluation_status is not None and 
                    evaluation.responder_evaluation_status is not None
                )
            },
            "current_user_response": (
                evaluation.requester_evaluation_status if request.user == trade_request.requester 
                else evaluation.responder_evaluation_status
            ),
            "can_respond": (
                evaluation.requester_evaluation_status is None if request.user == trade_request.requester
                else evaluation.responder_evaluation_status is None
            )
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error in get_evaluation_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get evaluation details: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_trade_evaluation(request, tradereq_id):
    """
    Confirm trade after evaluation - stores user's CONFIRMED response
    """
    print(f"=== CONFIRM TRADE EVALUATION DEBUG ===")
    print(f"Trade ID: {tradereq_id}")
    print(f"User: {request.user.id}")
    
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to confirm this trade"}, status=403)
        
        # Get the evaluation
        evaluation = Evaluation.objects.filter(trade_request=trade_request).first()
        if not evaluation:
            return Response({"error": "No evaluation found for this trade"}, status=404)
        
        print(f"Current evaluation status:")
        print(f"  Requester status: {evaluation.requester_evaluation_status}")
        print(f"  Responder status: {evaluation.responder_evaluation_status}")
        print(f"  Current user is requester: {request.user == trade_request.requester}")
        
        with transaction.atomic():
            # Set user's evaluation status to CONFIRMED
            if request.user == trade_request.requester:
                if evaluation.requester_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.requester_evaluation_status = Evaluation.EvaluationStatus.CONFIRMED
                evaluation.requester_responded_at = django_timezone.now()
                print(f"Set requester status to CONFIRMED")
            else:  # responder
                if evaluation.responder_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.responder_evaluation_status = Evaluation.EvaluationStatus.CONFIRMED
                evaluation.responder_responded_at = django_timezone.now()
                print(f"Set responder status to CONFIRMED")
            
            evaluation.save()
            print(f"Evaluation saved successfully")
            
            # Check if both users have confirmed
            both_confirmed = (
                evaluation.requester_evaluation_status == Evaluation.EvaluationStatus.CONFIRMED and 
                evaluation.responder_evaluation_status == Evaluation.EvaluationStatus.CONFIRMED
            )
            
            print(f"Both users confirmed: {both_confirmed}")
            
            if both_confirmed:
                # Both confirmed - activate trade
                trade_request.status = TradeRequest.Status.ACTIVE
                trade_request.save()
                print(f"Trade status set to ACTIVE")
                message = "Trade confirmed by both parties! Trade is now active."
                trade_status = "ACTIVE"
            else:
                # Waiting for other user
                other_user_name = (trade_request.responder.first_name if request.user == trade_request.requester 
                                 else trade_request.requester.first_name)
                message = f"Your confirmation recorded. Waiting for {other_user_name} to respond."
                trade_status = "PENDING"
                print(f"Waiting for other user: {other_user_name}")
        
        return Response({
            "message": message,
            "tradereq_id": trade_request.tradereq_id,
            "trade_status": trade_status,
            "user_response": "CONFIRMED",
            "both_users_confirmed": both_confirmed,
            "evaluation_id": evaluation.evaluation_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error confirming trade: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to confirm trade: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_trade_evaluation(request, tradereq_id):
    """
    Reject trade after evaluation - stores user's REJECTED response and cancels trade
    """
    print(f"=== REJECT TRADE EVALUATION DEBUG ===")
    print(f"Trade ID: {tradereq_id}")
    print(f"User: {request.user.id}")
    
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to reject this trade"}, status=403)
        
        evaluation = Evaluation.objects.filter(trade_request=trade_request).first()
        if not evaluation:
            return Response({"error": "No evaluation found for this trade"}, status=404)
        
        with transaction.atomic():
            # Set user's evaluation status to REJECTED
            if request.user == trade_request.requester:
                if evaluation.requester_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.requester_evaluation_status = Evaluation.EvaluationStatus.REJECTED
                evaluation.requester_responded_at = django_timezone.now()   
            else:  # responder
                if evaluation.responder_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.responder_evaluation_status = Evaluation.EvaluationStatus.REJECTED
                evaluation.responder_responded_at = django_timezone.now()
            
            evaluation.save()
            print(f"Evaluation rejection saved")
            
            # Any rejection cancels the trade immediately
            trade_request.status = TradeRequest.Status.CANCELLED
            trade_request.save()
            print(f"Trade status set to CANCELLED")
        
        return Response({
            "message": "Trade rejected successfully. Trade has been cancelled.",
            "tradereq_id": trade_request.tradereq_id,
            "trade_status": "CANCELLED",
            "user_response": "REJECTED",
            "evaluation_id": evaluation.evaluation_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error rejecting trade: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to reject trade: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_active_trade(request, tradereq_id):
    """
    Cancel an active trade via 3-dots menu - sets TradeInterest to CANCELLED
    """
    try:
        trade_request = TradeRequest.objects.get(tradereq_id=tradereq_id)
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to cancel this trade"}, status=403)
        
        trade_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            status=TradeInterest.InterestStatus.ACCEPTED
        ).first()
        
        if trade_interest:
            trade_interest.status = TradeInterest.InterestStatus.CANCELLED
            trade_interest.save()
        
        trade_request.status = TradeRequest.Status.CANCELLED
        trade_request.save()
        
        return Response({
            "message": "Trade cancelled successfully",
            "tradereq_id": trade_request.tradereq_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        return Response({"error": f"Failed to cancel trade: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_details(request, tradereq_id):
    """
    Get trade details for a specific trade request (GET only version)
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view details for this trade"
            }, status=403)
        
        # Get all trade details for this trade request
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
            "details": details_data,
            "user_has_submitted": any(d["user_id"] == request.user.id for d in details_data),
            "both_submitted": len(details_data) >= 2
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Get trade details error: {str(e)}")
        return Response({
            "error": f"Failed to get trade details: {str(e)}"
        }, status=500)
    
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

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_trade_proof(request):
    """
    Upload proof files for a trade request
    Handles both initial submission and resubmission after rejection
    """
    import os
    from django.conf import settings
    
    print("=== UPLOAD TRADE PROOF DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"Files: {list(request.FILES.keys())}")
    print(f"User: {request.user.id}")
    
    trade_request_id = request.data.get('trade_request_id')
    if not trade_request_id:
        return Response({"error": "trade_request_id is required"}, status=400)
    
    try:
        # Get the trade request and verify user is part of it
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=trade_request_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to upload proof for this trade"}, status=403)
        
        # Get or create trade history record
        trade_history, created = TradeHistory.objects.get_or_create(
            trade_request=trade_request
        )
        
        # Handle multiple file uploads
        proof_files = request.FILES.getlist('proof_files')
        if not proof_files:
            return Response({"error": "At least one proof file is required"}, status=400)
        
        # For now, we'll just save the first file as the main proof
        main_proof_file = proof_files[0]
        
        # Validate file
        if main_proof_file.size > 10 * 1024 * 1024:  # 10MB limit
            return Response({"error": "File too large (max 10MB)"}, status=400)
        
        # Determine if user is requester or responder
        current_user_is_requester = (request.user == trade_request.requester)
        
        # Check if this is a resubmission and clean up old file
        if current_user_is_requester and trade_history.requester_proof:
            # User is resubmitting, delete old file
            old_proof = trade_history.requester_proof
            try:
                old_file_path = os.path.join(settings.MEDIA_ROOT, str(old_proof))
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
                    print(f"Deleted old requester proof file during resubmission: {old_file_path}")
            except Exception as e:
                print(f"Warning: Could not delete old requester proof file: {e}")
        elif not current_user_is_requester and trade_history.responder_proof:
            # User is resubmitting, delete old file
            old_proof = trade_history.responder_proof
            try:
                old_file_path = os.path.join(settings.MEDIA_ROOT, str(old_proof))
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
                    print(f"Deleted old responder proof file during resubmission: {old_file_path}")
            except Exception as e:
                print(f"Warning: Could not delete old responder proof file: {e}")
        
        # Save new proof
        with transaction.atomic():
            if current_user_is_requester:
                trade_history.requester_proof = main_proof_file
                trade_history.requester_proof_status = TradeHistory.ProofStatus.PENDING
                user_type = "requester"
                is_resubmission = trade_history.requester_proof_status in [
                    TradeHistory.ProofStatus.REJECTED, 
                    TradeHistory.ProofStatus.PENDING
                ]
            else:
                trade_history.responder_proof = main_proof_file
                trade_history.responder_proof_status = TradeHistory.ProofStatus.PENDING
                user_type = "responder"
                is_resubmission = trade_history.responder_proof_status in [
                    TradeHistory.ProofStatus.REJECTED, 
                    TradeHistory.ProofStatus.PENDING
                ]
            
            trade_history.save()
        
        message = "Proof resubmitted successfully" if is_resubmission else "Proof uploaded successfully"
        print(f"Proof {'resubmitted' if is_resubmission else 'uploaded'} successfully for {user_type}")
        
        return Response({
            "message": message,
            "trade_request_id": trade_request.tradereq_id,
            "user_type": user_type,
            "proof_status": "PENDING",
            "files_uploaded": len(proof_files),
            "is_resubmission": is_resubmission
        }, status=201)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Upload proof error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to upload proof: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_proof_status(request, tradereq_id):
    """
    Get comprehensive proof submission and approval status for a trade
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            Q(tradereq_id=tradereq_id) &
            Q(status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED])
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's proof status"}, status=403)
        
        # Get trade history
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        
        if not trade_history:
            # No proof submissions yet
            return Response({
                "trade_request_id": trade_request.tradereq_id,
                "current_user_submitted": False,
                "partner_submitted": False,
                "both_submitted": False,
                "current_user_approved": False,
                "partner_approved": False,
                "both_approved": False,
                "current_user_is_requester": request.user == trade_request.requester,
                "status": "waiting_for_proofs"
            }, status=200)
        
        # Check submission and approval status
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            # Current user is requester
            current_user_submitted = bool(trade_history.requester_proof)
            partner_submitted = bool(trade_history.responder_proof)
            current_user_approved = trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED
            partner_approved = trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
        else:
            # Current user is responder
            current_user_submitted = bool(trade_history.responder_proof)
            partner_submitted = bool(trade_history.requester_proof)
            current_user_approved = trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
            partner_approved = trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED
        
        both_submitted = current_user_submitted and partner_submitted
        both_approved = current_user_approved and partner_approved
        
        # Determine overall status
        if both_approved:
            status = "ready_to_rate"
        elif both_submitted:
            status = "waiting_for_approval"
        elif current_user_submitted and not partner_submitted:
            status = "waiting_for_partner_proof"
        elif not current_user_submitted and partner_submitted:
            status = "waiting_for_your_proof"
        else:
            status = "waiting_for_proofs"
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "current_user_submitted": current_user_submitted,
            "partner_submitted": partner_submitted,
            "both_submitted": both_submitted,
            "current_user_approved": current_user_approved,
            "partner_approved": partner_approved,
            "both_approved": both_approved,
            "current_user_is_requester": current_user_is_requester,
            "status": status,
            "requester_proof_status": trade_history.requester_proof_status,
            "responder_proof_status": trade_history.responder_proof_status
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get proof status error: {str(e)}")
        return Response({"error": f"Failed to get proof status: {str(e)}"}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_partner_proof(request, tradereq_id):
    """
    Get partner's proof files for viewing/approval
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            Q(tradereq_id=tradereq_id) &
            Q(status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED])
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's proof"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        # Determine partner's proof
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            # Current user is requester, get responder's proof
            partner_proof = trade_history.responder_proof
            partner_proof_status = trade_history.responder_proof_status
            partner_name = f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
        else:
            # Current user is responder, get requester's proof
            partner_proof = trade_history.requester_proof
            partner_proof_status = trade_history.requester_proof_status
            partner_name = f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username
        
        if not partner_proof:
            return Response({"error": "Partner has not submitted proof yet"}, status=404)
        
        # Build proof file URL
        proof_url = request.build_absolute_uri(partner_proof.url) if partner_proof else None
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "partner_name": partner_name,
            "proof_file": {
                "url": proof_url,
                "name": partner_proof.name.split('/')[-1] if partner_proof else None,
                "is_image": partner_proof.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')) if partner_proof else False
            },
            "proof_status": partner_proof_status
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get partner proof error: {str(e)}")
        return Response({"error": f"Failed to get partner proof: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_proof(request, tradereq_id):
    """
    Get current user's own proof submission for a trade
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found for this trade"}, status=404)
        
        # Determine which proof belongs to current user
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            user_proof = trade_history.requester_proof
            user_proof_status = trade_history.requester_proof_status
        else:
            user_proof = trade_history.responder_proof
            user_proof_status = trade_history.responder_proof_status
        
        if not user_proof:
            return Response({
                "message": "You have not submitted proof yet",
                "has_proof": False
            }, status=200)
        
        # Build proof file URL and info
        proof_url = request.build_absolute_uri(user_proof.url) if user_proof else None
        file_name = user_proof.name.split('/')[-1] if user_proof else None
        is_image = user_proof.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')) if user_proof else False
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "has_proof": True,
            "proof_file": {
                "url": proof_url,
                "name": file_name,
                "is_image": is_image
            },
            "proof_status": user_proof_status,
            "submitted_by": {
                "id": request.user.id,
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get my proof error: {str(e)}")
        return Response({"error": f"Failed to get proof: {str(e)}"}, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_partner_proof(request, tradereq_id):
    """
    Approve partner's proof submission
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to approve proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        # Determine which proof to approve
        current_user_is_requester = (request.user == trade_request.requester)
        
        with transaction.atomic():
            if current_user_is_requester:
                # Requester approving responder's proof
                if not trade_history.responder_proof:
                    return Response({"error": "Responder has not submitted proof yet"}, status=400)
                trade_history.responder_proof_status = TradeHistory.ProofStatus.APPROVED
            else:
                # Responder approving requester's proof
                if not trade_history.requester_proof:
                    return Response({"error": "Requester has not submitted proof yet"}, status=400)
                trade_history.requester_proof_status = TradeHistory.ProofStatus.APPROVED
            
            trade_history.save()
            
            # Check if both proofs are approved
            both_approved = (
                trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED and
                trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
            )
            
        
        return Response({
            "message": "Proof approved successfully",
            "trade_request_id": trade_request.tradereq_id,
            "both_approved": both_approved,
            "trade_completed": both_approved,
            "current_user_approved_partner": True,
            "workflow_status": "ready_to_rate" if both_approved else "waiting_for_approval"
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Approve proof error: {str(e)}")
        return Response({"error": f"Failed to approve proof: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_partner_proof(request, tradereq_id):
    """
    Reject partner's proof submission - resets their proof status so they can resubmit
    """
    import os
    from django.conf import settings
    
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to reject proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        current_user_is_requester = (request.user == trade_request.requester)
        
        with transaction.atomic():
            if current_user_is_requester:
                # Requester rejecting responder's proof
                old_proof = trade_history.responder_proof
                if old_proof:
                    # Delete the old file from filesystem
                    try:
                        old_file_path = os.path.join(settings.MEDIA_ROOT, str(old_proof))
                        if os.path.exists(old_file_path):
                            os.remove(old_file_path)
                            print(f"Deleted rejected proof file: {old_file_path}")
                    except Exception as e:
                        print(f"Warning: Could not delete old proof file: {e}")
                    
                trade_history.responder_proof = None
                trade_history.responder_proof_status = TradeHistory.ProofStatus.PENDING
            else:
                # Responder rejecting requester's proof
                old_proof = trade_history.requester_proof
                if old_proof:
                    # Delete the old file from filesystem
                    try:
                        old_file_path = os.path.join(settings.MEDIA_ROOT, str(old_proof))
                        if os.path.exists(old_file_path):
                            os.remove(old_file_path)
                            print(f"Deleted rejected proof file: {old_file_path}")
                    except Exception as e:
                        print(f"Warning: Could not delete old proof file: {e}")
                
                trade_history.requester_proof = None
                trade_history.requester_proof_status = TradeHistory.ProofStatus.PENDING
            
            trade_history.save()
        
        return Response({
            "message": "Proof rejected successfully. Partner can now resubmit.",
            "trade_request_id": trade_request.tradereq_id,
            "file_cleanup_completed": True
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Reject proof error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to reject proof: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_trade_rating(request):
    """
    Submit rating and review for a completed trade.
    Awards XP IMMEDIATELY upon rating and updates user's rated flag.
    Trade disappears from that user's Active Trades list immediately.
    Trade becomes COMPLETED only after both users rate.
    """
    print("=== SUBMIT TRADE RATING DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    trade_request_id = request.data.get('trade_request_id')
    rating = request.data.get('rating', 4)  # Default to 4 stars
    review_description = request.data.get('review_description', '').strip()
    
    # Validate input
    if not trade_request_id:
        return Response({"error": "trade_request_id is required"}, status=400)
    
    if not review_description:
        return Response({"error": "Please provide feedback about your trade experience"}, status=400)
    
    if len(review_description) > 500:
        return Response({"error": "Review description must be 500 characters or less"}, status=400)
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=trade_request_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to rate this trade"}, status=403)
        
        # Verify trade is in correct status (should be ACTIVE with both proofs approved)
        if trade_request.status not in [TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED]:
            return Response({"error": "Trade must be active or completed to submit rating"}, status=400)
        
        # Check if both proofs are approved
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "Trade history not found"}, status=404)
        
        if (trade_history.requester_proof_status != TradeHistory.ProofStatus.APPROVED or
            trade_history.responder_proof_status != TradeHistory.ProofStatus.APPROVED):
            return Response({"error": "Both proofs must be approved before rating can be submitted"}, status=400)
        
        # Determine if current user is requester or responder
        current_user_is_requester = (request.user == trade_request.requester)
        partner_user = trade_request.responder if current_user_is_requester else trade_request.requester
        
        with transaction.atomic():
            # Check if user has already rated (using boolean flags)
            if current_user_is_requester:
                if trade_request.requester_rated:
                    return Response({"error": "You have already submitted a rating for this trade."}, status=400)
                # Mark requester as having rated
                trade_request.requester_rated = True
            else:
                if trade_request.responder_rated:
                    return Response({"error": "You have already submitted a rating for this trade."}, status=400)
                # Mark responder as having rated
                trade_request.responder_rated = True
            
            # Get or create reputation system record
            reputation_record, created = ReputationSystem.objects.get_or_create(
                trade_request=trade_request
            )
            
            # Save rating and description with timestamp
            current_time = django_timezone.now()
            if current_user_is_requester:
                reputation_record.requester_starcount = rating
                reputation_record.requester_rating_desc = review_description
                reputation_record.requester_rated_at = current_time
            else:
                reputation_record.responder_starcount = rating
                reputation_record.responder_rating_desc = review_description
                reputation_record.responder_rated_at = current_time
            
            reputation_record.save()
            
            # ✅ IMMEDIATE XP AWARD - Award XP to current user immediately upon their rating
            trade_detail = TradeDetail.objects.filter(trade_request=trade_request, user=request.user).first()
            xp_awarded = 0
            if trade_detail:
                xp_awarded = trade_detail.total_xp or 0
                request.user.tot_XpPts += xp_awarded
                request.user.level = max(1, (request.user.tot_XpPts // 1000) + 1)
                request.user.save()
                print(f"Awarded {xp_awarded} XP to user {request.user.id} immediately upon rating")
            
            # ✅ UPDATE PARTNER'S RATING - Update partner's rating stats immediately
            partner_new_rating_count = partner_user.ratingCount + 1
            partner_total_stars = (float(partner_user.avgStars or 0) * partner_user.ratingCount) + rating
            partner_new_avg = partner_total_stars / partner_new_rating_count
            
            partner_user.ratingCount = partner_new_rating_count
            partner_user.avgStars = round(partner_new_avg, 2)
            partner_user.save()
            
            print(f"Updated partner {partner_user.id} rating: {partner_user.avgStars} stars ({partner_user.ratingCount} reviews)")
            
            # Check if both users have now rated
            both_rated = trade_request.requester_rated and trade_request.responder_rated
            
            if both_rated:
                # ✅ MARK TRADE AS COMPLETED - Only when both users have rated
                trade_request.status = TradeRequest.Status.COMPLETED
                
                # Set completion timestamp in trade history
                if not trade_history.completed_at:
                    trade_history.completed_at = django_timezone.now()
                    trade_history.save()
                
                print(f"Trade {trade_request_id} marked as COMPLETED - both users have rated")
            
            # Save the updated trade request with rating flags
            trade_request.save()
        
        return Response({
            "message": "Rating submitted successfully! You have been awarded XP.",
            "trade_request_id": trade_request.tradereq_id,
            "user_rating_submitted": rating,
            "both_users_rated": both_rated,
            "trade_completed": both_rated,
            "trade_status": "COMPLETED" if both_rated else "ACTIVE",
            "xp_awarded": xp_awarded,  # XP awarded immediately
            "new_total_xp": request.user.tot_XpPts,
            "new_level": request.user.level,
            "trade_disappears_for_user": True,  # Trade will disappear from this user's active trades
            "partner_still_needs_to_rate": not both_rated
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Submit rating error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to submit rating: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_rating_status(request, tradereq_id):
    """
    Get rating status for a trade - whether current user has rated and if partner has rated
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's rating status"}, status=403)
        
        # Get reputation record
        reputation_record = ReputationSystem.objects.filter(trade_request=trade_request).first()
        
        if not reputation_record:
            return Response({
                "trade_request_id": trade_request.tradereq_id,
                "current_user_rated": False,
                "partner_rated": False,
                "both_rated": False,
                "trade_completed": False,
                "can_rate": True
            }, status=200)
        
        # Determine rating status
        current_user_is_requester = (request.user == trade_request.requester)
        
        current_user_rated = (reputation_record.requester_starcount is not None if current_user_is_requester 
                            else reputation_record.responder_starcount is not None)
        partner_rated = (reputation_record.responder_starcount is not None if current_user_is_requester 
                       else reputation_record.requester_starcount is not None)
        
        both_rated = current_user_rated and partner_rated
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "current_user_rated": current_user_rated,
            "partner_rated": partner_rated,
            "both_rated": both_rated,
            "trade_completed": trade_request.status == TradeRequest.Status.COMPLETED,
            "can_rate": not current_user_rated,
            "trade_details": {
                "reqname": trade_request.reqname,
                "exchange": trade_request.exchange,
                "partner_name": (f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username 
                               if current_user_is_requester else 
                               f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username)
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Get rating status error: {str(e)}")
        return Response({"error": f"Failed to get rating status: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def award_trade_xp(request, tradereq_id: int):
    """
    Awards XP to the current user for this trade once THEY have submitted their rating.
    Idempotent: will not award twice for the same user+trade.
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester','responder').get(tradereq_id=tradereq_id)
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error":"Not authorized for this trade"}, status=403)

        # Has current user rated?
        rep = ReputationSystem.objects.filter(trade_request=trade_request).first()
        if not rep:
            return Response({"error":"No rating record yet"}, status=400)

        current_user_is_requester = (request.user == trade_request.requester)
        has_rated = (rep.requester_starcount is not None) if current_user_is_requester else (rep.responder_starcount is not None)
        if not has_rated:
            return Response({"error":"You must submit a rating first"}, status=400)

        # Idempotency: prevent double-award (flag per user in TradeDetail, or a separate table)
        detail = TradeDetail.objects.filter(trade_request=trade_request, user=request.user).first()
        if not detail:
            return Response({"error":"Trade detail not found for user"}, status=404)
        if getattr(detail, "xp_awarded", False):
            return Response({
                "message":"XP already awarded",
                "updated_users":[{"user_id": request.user.id, "xp_gained": 0,
                                  "new_total_xp": request.user.tot_XpPts,
                                  "new_level": request.user.level}]
            }, status=200)

        # Award this user's XP from total_xp
        gained = int(detail.total_xp or 0)
        request.user.tot_XpPts = int(request.user.tot_XpPts or 0) + gained

        # (Simple level; replace with your cumulative thresholds if you want it server-side)
        request.user.level = max(1, (request.user.tot_XpPts // 1000) + 1)
        request.user.save()

        # mark as awarded
        detail.xp_awarded = True
        detail.save(update_fields=["xp_awarded"])

        return Response({
            "message": "XP awarded",
            "updated_users":[{"user_id": request.user.id, "xp_gained": gained,
                              "new_total_xp": request.user.tot_XpPts,
                              "new_level": request.user.level}]
        }, status=200)
    except TradeRequest.DoesNotExist:
        return Response({"error":"Trade not found"}, status=404)
    except Exception as e:
        return Response({"error": f"Failed to award XP: {e}"}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_reviews(request, user_id: int):
    """
    Get all reviews for a specific user (where they were the trade partner being rated)
    """
    try:
        user = get_object_or_404(User, pk=user_id)
        
        # Get all reputation records where this user received ratings
        # Either as requester (rated by responder) or responder (rated by requester) 
        reputation_records = ReputationSystem.objects.filter(
            Q(trade_request__requester=user, responder_starcount__isnull=False) |
            Q(trade_request__responder=user, requester_starcount__isnull=False)
        ).select_related(
            'trade_request__requester', 
            'trade_request__responder'
        ).order_by('-responder_rated_at', '-requester_rated_at')
        
        reviews = []
        
        for rep in reputation_records:
            trade_request = rep.trade_request
            
            # Determine if the user being viewed is requester or responder
            user_is_requester = (trade_request.requester.id == user.id)
            
            if user_is_requester and rep.responder_starcount is not None:
                # User was requester, rated by responder
                reviewer = trade_request.responder
                rating = rep.responder_starcount
                review_description = rep.responder_rating_desc or ""
                rated_at = rep.responder_rated_at
                
            elif not user_is_requester and rep.requester_starcount is not None:
                # User was responder, rated by requester  
                reviewer = trade_request.requester
                rating = rep.requester_starcount
                review_description = rep.requester_rating_desc or ""
                rated_at = rep.requester_rated_at
            else:
                continue
            
            # Get trade completion date
            trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
            completed_at = trade_history.completed_at if trade_history else trade_request.created_at
            
            reviews.append({
                "trade_id": trade_request.tradereq_id,
                "reviewer_first_name": reviewer.first_name,
                "reviewer_last_name": reviewer.last_name,
                "reviewer_username": reviewer.username,
                "request_title": trade_request.reqname,
                "offer_title": trade_request.exchange or "Service Exchange",
                "rating": rating,
                "review_description": review_description,
                "completed_at": completed_at.isoformat() if completed_at else None,
                "rated_at": rated_at.isoformat() if rated_at else None,
                "likes_count": 0,  # You can implement likes later if needed
            })
        
        return Response({
            "reviews": reviews,
            "total_count": len(reviews)
        }, status=200)
        
    except Exception as e:
        print(f"Error fetching reviews for user {user_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to fetch reviews: {str(e)}",
            "reviews": [],
            "total_count": 0
        }, status=500) 
