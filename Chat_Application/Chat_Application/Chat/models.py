from django.db import models

# Create your models here.
class User(models.Model):
    name = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)

    def __str__(self):
        return self.name

class Group(models.Model):
    name = models.CharField(max_length=150, unique=True)
    members = models.ManyToManyField(User, related_name='groups')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Message(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    to_group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages',null=True, blank=True)
    text = models.TextField(blank=True)
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reaction = models.CharField(max_length=50, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        if self.to_group:
            return f'Message from {self.sender.name} to {self.to_group.name} at {self.created_at}'
        elif self.to_user:
            return f'Message from {self.sender.name} to {self.to_user.name} at {self.created_at}'
        return f'Message from {self.sender.name} at {self.created_at}'
    
    @property
    def is_image(self):
        if not self.attachment:
            return False
        ext = self.attachment.name.split('.')[-1].lower()
        return ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    
    @property
    def is_video(self):
        if not self.attachment:
            return False
        ext = self.attachment.name.split('.')[-1].lower()
        return ext in ['mp4', 'webm', 'ogg', 'mov', 'avi']
    
    @property
    def file_name(self):
        if self.attachment:
            return self.attachment.name.split('/')[-1]
        return None
    
    class Meta:
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['to_user']),
            models.Index(fields=['to_group']),
            models.Index(fields=['created_at']),
        ]