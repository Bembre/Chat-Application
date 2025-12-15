from django.contrib import admin
from .models import Group, Message


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'created_at')
    search_fields = ('name', 'owner__username')
    filter_horizontal = ('members',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'to_user', 'to_group', 'created_at', 'reaction', 'is_deleted', 'attachment')
    search_fields = ('text', 'sender__username')
    list_filter = ('to_group', 'sender', 'is_deleted')
