from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('complete-registration/', views.complete_registration, name='complete_registration'),

    path('skills/general/', views.list_general_skills),
    path('skills/interests/', views.add_user_interests),
    path('skills/specific/', views.list_specific_skills),
    path('skills/user/', views.add_user_skills),

    path('login/', views.login_user, name='login_user'),
    path('google-login/', views.google_login, name='google_login'),

    path('me/', views.me, name='me'),

    # 👇 expose BOTH variants
    path('users/<int:user_id>/', views.user_detail),
    path('users/by-username/<str:username>/', views.user_detail_by_username),

    path('users/<int:user_id>/interests/', views.user_interests),
    path('users/<int:user_id>/skills/', views.user_skills),
    
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

]

