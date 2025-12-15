# Chat Application

A full-stack chat application built with Django and Bootstrap, featuring real-time messaging, group chats, message reactions, and profile photo uploads.

## Features

- User authentication (login/signup)
- Profile photo uploads and display
- One-on-one messaging
- Group chat creation
- Message reactions (emojis)
- Edit and delete messages
- CSV export of conversations
- Modern, responsive UI with Bootstrap

## Setup Instructions

1. **Navigate to the project directory:**
   ```bash
   cd Chat_Application/Chat_Application
   ```

2. **Activate virtual environment:**
   ```bash
   ..\venv\Scripts\activate  # On Windows
   # OR
   source ../venv/bin/activate  # On Linux/Mac
   ```

3. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create media directory:**
   ```bash
   mkdir media
   mkdir media\profile_photos
   ```

5. **Create a superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

7. **Access the application:**
   - Home page: http://127.0.0.1:8000/
   - Chat page: http://127.0.0.1:8000/chat/
   - Admin panel: http://127.0.0.1:8000/admin/

## Usage

1. **Sign Up:**
   - Click "Sign Up" in the navbar
   - Fill in name, email, password
   - Optionally upload a profile photo
   - Submit the form

2. **Login:**
   - Click "Login" in the navbar
   - Enter your email and password
   - Submit the form

3. **Start Chatting:**
   - Select a contact from the list to start a one-on-one chat
   - Or create a group by clicking "+ Create Group"
   - Type messages and click Send

4. **Message Actions:**
   - Hover over a message to see action buttons
   - React with emojis (❤️ 😂 👍 🎉 🙏 😮)
   - Edit your own messages (click ✏️, edit in input, click Save)
   - Delete your own messages (click 🗑️)

5. **Export Chat:**
   - Click "⬇ Export CSV" button in the chat header
   - Downloads conversation as CSV file

## Project Structure

```
Chat_Application/
├── Chat_Application/
│   ├── Chat/
│   │   ├── models.py       # User, Group, Message models
│   │   ├── views.py        # Views and API endpoints
│   │   ├── serializers.py  # DRF serializers
│   │   └── urls.py         # URL routing
│   ├── templates/
│   │   ├── index.html      # Landing page
│   │   └── chat.html       # Chat interface
│   └── settings.py         # Django settings
├── media/                  # User uploaded files (profile photos)
└── db.sqlite3             # SQLite database
```

## Technical Details

- **Backend:** Django 5.2.9 with Django REST Framework
- **Frontend:** Bootstrap 5.3.3, vanilla JavaScript
- **Database:** SQLite (can be changed to PostgreSQL in settings.py)
- **Authentication:** Django's built-in authentication + JWT tokens for API
- **File Storage:** Django's FileField for profile photos

## Notes

- Profile photos are stored in `media/profile_photos/`
- The application uses Django's default User model for authentication
- Custom User model is used for chat-specific features and profile photos
- Messages are stored with reactions, edit history, and timestamps
- CSV export includes all message details including reactions




