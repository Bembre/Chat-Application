from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, Message, User as CustomUser


AuthUser = get_user_model()


class AuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class ChatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email', 'profile_photo']


class GroupSerializer(serializers.ModelSerializer):
    members = ChatUserSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'member_ids', 'owner', 'created_at']
        read_only_fields = ['owner', 'created_at']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        owner = self.context['custom_user']
        group = Group.objects.create(owner=owner, **validated_data)
        members = list(CustomUser.objects.filter(id__in=member_ids))
        if owner not in members:
            members.append(owner)
        group.members.set(members)
        return group


class MessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(required=False, allow_blank=True)
    sender = ChatUserSerializer(read_only=True)
    to_user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), required=False, allow_null=True)
    to_group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), required=False, allow_null=True)
    attachment_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    is_video = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'to_user', 'to_group', 'text', 'attachment', 'attachment_url', 'file_name', 'is_image', 'is_video', 'reaction', 'is_deleted', 'created_at', 'updated_at']
        read_only_fields = ['sender', 'is_deleted', 'created_at', 'updated_at']

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def get_file_name(self, obj):
        if obj.attachment:
            return obj.attachment.name.split('/')[-1]
        return None

    def get_is_image(self, obj):
        return obj.is_image if hasattr(obj, 'is_image') else False

    def get_is_video(self, obj):
        return obj.is_video if hasattr(obj, 'is_video') else False

    def validate(self, attrs):
        to_user = attrs.get('to_user')
        to_group = attrs.get('to_group')
        if bool(to_user) == bool(to_group):
            raise serializers.ValidationError("Provide either to_user or to_group (but not both).")
        return attrs

    def create(self, validated_data):
        validated_data['sender'] = self.context['custom_user']
        return super().create(validated_data)

