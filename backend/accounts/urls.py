from django.urls import path, include
from accounts.views import validate_field 
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import add_user_interests, user_interests
from django.contrib import admin

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('complete-registration/', views.complete_registration, name='complete_registration'),

    path('skills/general/', views.list_general_skills),
    path('skills/interests/', views.user_interests),
    path('skills/specific/', views.list_specific_skills),
    path('skills/user/', views.add_user_skills),

    path('login/', views.login_user, name='login_user'),
    path('google-login/', views.google_login, name='google_login'),
    path('logout/', views.logout_user, name="logout_user"),
    
    path('trade-requests/', views.create_trade_request, name='create_trade_request'),
    path('explore/feed/', views.explore_feed, name='explore_feed'),
    path('express-interest/', views.express_trade_interest, name='express_trade_interest'),
    path('posted-trades/', views.get_posted_trades, name='get_posted_trades'),
    path('interested-trades/', views.get_user_interested_trades, name='get_user_interested_trades'),  
    path('active-trades/', views.get_active_trades, name='get_active_trades'),
    path('home/active-trades/', views.get_home_active_trades, name='home_active_trades'),

    # Trade interest management endpoints
    path('trade-requests/<int:tradereq_id>/interests/', views.get_trade_interests, name='get_trade_interests'),
    path('trade-interests/<int:interest_id>/accept/', views.accept_trade_interest, name='accept_trade_interest'),
    path('trade-interests/<int:interest_id>/decline/', views.decline_trade_interest, name='decline_trade_interest'),
    path('trade-requests/<int:tradereq_id>/details/', views.add_trade_details, name='add_trade_details'),
    path('trade-details/<int:tradereq_id>/', views.get_trade_details, name='get_trade_details'),
    path('trade-requests/<int:tradereq_id>/details/status/', views.check_trade_details_status, name='check_trade_details_status'),
    path('trade-requests/<int:tradereq_id>/cancel/', views.cancel_active_trade, name='cancel_active_trade'),

    # Trade evaluation management endpoints
    path('trade-requests/<int:tradereq_id>/evaluation/', views.get_evaluation_details, name='get_evaluation_details'),
    path('trade-requests/<int:tradereq_id>/evaluation/confirm/', views.confirm_trade_evaluation, name='confirm_trade_evaluation'),
    path('trade-requests/<int:tradereq_id>/evaluation/reject/', views.reject_trade_evaluation, name='reject_trade_evaluation'),
    
    # Trade proof management endpoints
    path('trade-proof/upload/', views.upload_trade_proof, name='upload_trade_proof'),
    path('trade-proof/<int:tradereq_id>/partner/', views.get_partner_proof, name='get_partner_proof'),
    path('trade-proof/<int:tradereq_id>/approve/', views.approve_partner_proof, name='approve_partner_proof'),
    path('trade-proof/<int:tradereq_id>/reject/', views.reject_partner_proof, name='reject_partner_proof'),
    path('trade-requests/<int:tradereq_id>/delete/', views.delete_trade_request, name='delete_trade_request'),
    path('trade-proof/<int:tradereq_id>/my-proof/', views.get_my_proof, name='get_my_proof'),
    path('home/trade-proof-status/<int:tradereq_id>/', views.get_trade_proof_status, name='trade_proof_status'),

    # Trade rating endpoints
    path('trade-rating/submit/', views.submit_trade_rating, name='submit_trade_rating'),
    path('trade-rating/status/<int:tradereq_id>/', views.get_trade_rating_status, name='get_trade_rating_status'),

    path('trade-xp/award/<int:tradereq_id>/', views.award_trade_xp, name='award_trade_xp'),

    path('users/<int:user_id>/reviews/', views.user_reviews, name='user_reviews'),


    path('me/', views.me, name='me'),
    
    # 👇 expose BOTH variants
    path('users/<int:user_id>/', views.user_detail),
    path('users/by-username/<str:username>/', views.user_detail_by_username),
    path("users/username/<str:username>/", views.user_detail_by_username),

    path('users/<int:user_id>/interests/', views.user_interests),
    path("users/add_interests/", views.add_user_interests, name="add-user-interests"),
    path('users/<int:user_id>/skills/', views.user_skills),
    path('users/<int:user_id>/credentials/', views.user_credentials),

    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path("users/add_interests/", add_user_interests, name="add-user-interests"),
    path("users/<int:user_id>/interests/", user_interests, name="user_interests"),
    
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    
    path('validate-field/', validate_field, name='validate_field'),
]


