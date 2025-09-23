from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

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
    path('trade-requests/<int:tradereq_id>/details/status/', views.check_trade_details_status, name='check_trade_details_status'),
    path('trade-requests/<int:tradereq_id>/evaluation/', views.get_evaluation_details, name='get_evaluation_details'),
    path('trade-requests/<int:tradereq_id>/evaluation/confirm/', views.confirm_trade_evaluation, name='confirm_trade_evaluation'),
    path('trade-requests/<int:tradereq_id>/evaluation/reject/', views.reject_trade_evaluation, name='reject_trade_evaluation'),
    path('trade-requests/<int:tradereq_id>/cancel/', views.cancel_active_trade, name='cancel_active_trade'),
    
    path('me/', views.me, name='me'),
    
    # 👇 expose BOTH variants
    path('users/<int:user_id>/', views.user_detail),
    path('users/by-username/<str:username>/', views.user_detail_by_username),
    path("users/username/<str:username>/", views.user_detail_by_username),

    path('users/<int:user_id>/interests/', views.user_interests),
    path('users/<int:user_id>/skills/', views.user_skills),
    path('users/<int:user_id>/credentials/', views.user_credentials),

    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

