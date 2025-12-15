import csv
from io import StringIO

from django.contrib.auth import authenticate, login, logout as auth_logout
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import models
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Group, Message, User as CustomUser
from .serializers import AuthUserSerializer, ChatUserSerializer, GroupSerializer, MessageSerializer

User = get_user_model()


def index(request):
    if request.GET.get('logout'):
        auth_logout(request)
    return render(request, 'index.html')


def chat(request):
    # Handle authentication - if not logged in, still render page but show login modal
    current_custom_user = None
    users = CustomUser.objects.none()
    groups = Group.objects.none()
    
    if request.user.is_authenticated:
        # Get all users (from custom User model)
        try:
            current_custom_user = CustomUser.objects.get(email=request.user.email)
            groups = Group.objects.filter(members=current_custom_user).distinct()
            users = CustomUser.objects.exclude(id=current_custom_user.id)
        except CustomUser.DoesNotExist:
            pass
    
    context = {
        'current_user': request.user,
        'current_custom_user': current_custom_user,
        'users': users,
        'groups': groups,
        'MEDIA_URL': settings.MEDIA_URL,
    }
    return render(request, 'chat.html', context)


@api_view(['POST'])
@permission_classes([])
@csrf_exempt
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, username=email, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': AuthUserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([])
@csrf_exempt
def signup_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name') or email
    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=email).exists():
        return Response({'detail': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': AuthUserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


def login_form_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            next_url = request.GET.get('next', 'chat')
            return redirect(next_url)
        else:
            # If login fails, redirect back to chat page
            return redirect('chat')
    # For GET requests, redirect to chat page (which will show login modal)
    return redirect('chat')


def signup_form_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        name = request.POST.get('name') or email
        profile_photo = request.FILES.get('profile_photo')
        
        if not email or not password:
            return render(request, 'chat.html', {'error': 'Email and password required'})
        
        # Check if user exists in both models
        if User.objects.filter(username=email).exists() or CustomUser.objects.filter(email=email).exists():
            return render(request, 'chat.html', {'error': 'User already exists'})
        
        # Create Django User for authentication
        django_user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        
        # Create Custom User for profile photo and chat features
        custom_user = CustomUser.objects.create(
            name=name,
            email=email,
            password=django_user.password  # Store hashed password
        )
        
        if profile_photo:
            custom_user.profile_photo = profile_photo
            custom_user.save()
        
        login(request, django_user)
        return redirect('chat')
    return redirect('chat')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response(AuthUserSerializer(request.user).data)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        if not custom_user:
            return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
        qs = CustomUser.objects.exclude(id=custom_user.id)
        return Response(ChatUserSerializer(qs, many=True).data)


class GroupListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        if not custom_user:
            return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
        groups = Group.objects.filter(members=custom_user).distinct()
        return Response(GroupSerializer(groups, many=True).data)

    def post(self, request):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        if not custom_user:
            return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = GroupSerializer(data=request.data, context={'request': request, 'custom_user': custom_user})
        serializer.is_valid(raise_exception=True)
        group = serializer.save()
        return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)


class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        if not custom_user:
            return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
        user_id = request.query_params.get('user_id')
        group_id = request.query_params.get('group_id')
        if not user_id and not group_id:
            return Response({'detail': 'user_id or group_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Message.objects.filter(is_deleted=False)
        if user_id:
            qs = qs.filter(
                (models.Q(sender=custom_user, to_user_id=user_id) |
                 models.Q(sender_id=user_id, to_user=custom_user))
            )
        if group_id:
            qs = qs.filter(to_group_id=group_id, to_group__members=custom_user)
        qs = qs.order_by('created_at')
        serializer = MessageSerializer(qs, many=True, context={'request': request, 'custom_user': custom_user})
        return Response(serializer.data)

    def post(self, request):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        if not custom_user:
            return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
        # Handle both JSON and FormData
        data = request.data.copy()
        
        # Convert to_user and to_group from string IDs to integers if needed
        if 'to_user' in data and isinstance(data['to_user'], str):
            try:
                data['to_user'] = int(data['to_user'])
            except ValueError:
                pass
        if 'to_group' in data and isinstance(data['to_group'], str):
            try:
                data['to_group'] = int(data['to_group'])
            except ValueError:
                pass
        
        serializer = MessageSerializer(data=data, context={'request': request, 'custom_user': custom_user})
        serializer.is_valid(raise_exception=True)
        to_group = serializer.validated_data.get('to_group')
        if to_group and not to_group.members.filter(id=custom_user.id).exists():
            return Response({'detail': 'Not a member of this group'}, status=status.HTTP_403_FORBIDDEN)
        message = serializer.save()
        response_serializer = MessageSerializer(message, context={'request': request, 'custom_user': custom_user})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MessageDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            msg = Message.objects.get(pk=pk)
        except Message.DoesNotExist:
            return None
        if msg.sender != user:
            return None
        return msg

    def patch(self, request, pk):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        msg = self.get_object(pk, custom_user) if custom_user else None
        if not msg:
            return Response({'detail': 'Not found or not permitted'}, status=status.HTTP_404_NOT_FOUND)
        text = request.data.get('text')
        reaction = request.data.get('reaction')
        if text is not None:
            msg.text = text
            msg.updated_at = timezone.now()
        if reaction is not None:
            msg.reaction = reaction or None
        msg.save()
        return Response(MessageSerializer(msg, context={'request': request, 'custom_user': custom_user}).data)

    def delete(self, request, pk):
        custom_user = CustomUser.objects.filter(email=request.user.email).first()
        msg = self.get_object(pk, custom_user) if custom_user else None
        if not msg:
            return Response({'detail': 'Not found or not permitted'}, status=status.HTTP_404_NOT_FOUND)
        msg.is_deleted = True
        msg.text = ''
        msg.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_csv(request):
    custom_user = CustomUser.objects.filter(email=request.user.email).first()
    if not custom_user:
        return Response({'detail': 'Custom user not found for this account'}, status=status.HTTP_400_BAD_REQUEST)
    user_id = request.query_params.get('user_id')
    group_id = request.query_params.get('group_id')
    if not user_id and not group_id:
        return Response({'detail': 'user_id or group_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    qs = Message.objects.filter(is_deleted=False)
    if user_id:
        qs = qs.filter(
            (models.Q(sender=custom_user, to_user_id=user_id) |
             models.Q(sender_id=user_id, to_user=custom_user))
        )
    elif group_id:
        qs = qs.filter(to_group_id=group_id, to_group__members=custom_user)

    qs = qs.order_by('created_at')
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['From', 'To', 'Message', 'Time', 'Reaction'])
    for m in qs:
        to_val = m.to_user.email if m.to_user else f'Group:{m.to_group.name}'
        writer.writerow([
            m.sender.email,
            to_val,
            m.text.replace('"', '""'),
            timezone.localtime(m.created_at).strftime('%Y-%m-%d %H:%M'),
            m.reaction or ''
        ])
    resp = HttpResponse(buffer.getvalue(), content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename="chat_export.csv"'
    return resp