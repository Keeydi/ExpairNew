from django.urls import path
from .views import register_user, complete_registration
from django.conf import settings
from django.conf.urls.static import static
from .views import register_user, list_general_skills, add_user_interests
from .views import list_specific_skills, add_user_skills
from .views import login_user
from .views import google_login
from . import views 

urlpatterns = [
    path('register/', register_user, name='register_user'),
    path('complete-registration/', complete_registration, name='complete_registration'),
    path('skills/general/', list_general_skills),      # GET general skills
    path('skills/interests/', add_user_interests),    # POST selected interests
    path('skills/specific/', list_specific_skills),   # GET ?genskills_id=...
    path('skills/user/', add_user_skills),            # POST selected specs

    path('login/', login_user, name='login_user'),
    path('google-login/', views.google_login, name='google_login'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)