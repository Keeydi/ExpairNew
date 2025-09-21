from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
import logging

logger = logging.getLogger(__name__)

class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        print("\n" + "="*50)
        print("JWT COOKIE AUTHENTICATION DEBUG")
        print("="*50)
        
        # Log all cookies
        print(f"All cookies: {dict(request.COOKIES)}")
        
        # Log headers
        auth_header = request.META.get('HTTP_AUTHORIZATION', 'MISSING')
        print(f"Authorization header: {auth_header}")
        
        # Try header auth first
        print("\n--- Trying header authentication ---")
        header_auth = super().authenticate(request)
        if header_auth is not None:
            print("✅ Header authentication SUCCESS")
            print(f"User: {header_auth[0].username}")
            return header_auth
        else:
            print("❌ Header authentication FAILED/MISSING")
            
        # Try cookie auth
        print("\n--- Trying cookie authentication ---")
        raw_token = request.COOKIES.get('jwt_token')
        
        if raw_token is None:
            print("❌ No 'jwt_token' cookie found")
            print("Available cookies:", list(request.COOKIES.keys()))
            return None
        
        print(f"✅ Found jwt_token cookie")
        print(f"Token preview: {raw_token[:20]}...")
        
        try:
            print("Validating token...")
            validated_token = self.get_validated_token(raw_token)
            print("✅ Token validation SUCCESS")
            
            print("Getting user from token...")
            user = self.get_user(validated_token)
            print(f"✅ Cookie authentication SUCCESS for user: {user.username} (ID: {user.id})")
            print("="*50)
            return (user, validated_token)
            
        except TokenError as e:
            print(f"❌ Token validation FAILED: {e}")
            print(f"Token type: {type(e)}")
            print("="*50)
            return None