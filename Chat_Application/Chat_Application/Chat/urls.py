from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('chat/', views.chat, name='chat'),
    # Form-based views
    path('auth/login/', views.login_form_view, name='login'),
    path('auth/signup/', views.signup_form_view, name='signup'),
    # API
    path('api/auth/login/', views.login_view, name='api-login'),
    path('api/auth/signup/', views.signup_view, name='api-signup'),
    path('api/auth/me/', views.me_view, name='api-me'),
    path('api/users/', views.UserListView.as_view(), name='api-users'),
    path('api/groups/', views.GroupListCreateView.as_view(), name='api-groups'),
    path('api/messages/', views.MessageListCreateView.as_view(), name='api-messages'),
    path('api/messages/<int:pk>/', views.MessageDetailView.as_view(), name='api-message-detail'),
    path('api/messages/export/', views.export_csv, name='api-messages-export'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)