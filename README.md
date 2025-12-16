# <h1 align="center">
  📩 <img src="Chat_Application/Chat_Application/media/icon.png" height="40" style="vertical-align: middle;"> Connect
</h1>




## 🚀 Project Overview
**Connect** is a **Full-Stack Chat Application** built using **Django**, **Django REST Framework (DRF)**, **JavaScript**, and modern frontend technologies (**HTML, CSS, and Bootstrap**).

It supports real-world chat features such as user authentication, direct and group messaging, message reactions, message editing and deletion, profile photo uploads, and chat history export.

It allows users to:

- Register and authenticate using **JWT tokens**
- Send **one-to-one** and **group messages**
- React to messages (👍 ❤️ 😂 etc.)
- Edit and delete messages
- Export chat history as a **CSV file**

---

## 🧰 Tech Stack (What is Used & Why)

Below is the complete technology stack used in **Connect**. This project intentionally follows a **full‑stack approach**, meaning it covers **both backend and frontend responsibilities**, so it helps to understand how a real application is built end‑to‑end.

In simple words:

* The **backend** decides *what should happen* and *how data is stored*
* The **frontend** decides *what the user sees* and *how they interact*

---

### 🐍 Python

* Core programming language of the project
* Used to write all backend business logic
* Controls how data flows between database, APIs, and frontend
* Chosen because of its readable syntax and huge ecosystem

Python acts as the **brain of the application**, making decisions and executing logic whenever a request comes in.

---

### 🌐 Django

* A high‑level Python web framework
* Responsible for setting up the project structure
* Handles:

  * URL routing
  * Database interaction using ORM
  * User management
  * Security features like CSRF, hashing, admin authentication

Django acts as the **foundation and backbone** of Connect, helps to focus on features instead of boilerplate code.

---

### 🔄 Django REST Framework (DRF)

* A powerful extension of Django
* Used to build **RESTful APIs**
* Converts Python objects into JSON responses
* Manages:

  * API views
  * Request validation
  * Authentication & permissions

DRF works as the **translator** between backend logic and frontend communication.

---

### 🔐 JWT (JSON Web Tokens)

* Used for secure authentication
* After login, the server generates a token
* This token proves the user’s identity
* Sent with every protected API request

JWT removes the need for server‑side sessions and acts as the **security guard** of the application.

---

### 🗃️ SQLite Database

* Lightweight relational database
* Stores structured data in tables
* Used to save:

  * Users
  * Messages
  * Groups
  * Message reactions

SQLite is chosen to keep setup simple while efficiently storing application data.

---

### 🧱 HTML (Frontend Structure)

* Defines the structure of the user interface
* Creates elements such as:

  * Chat window
  * Message list
  * Input box
  * Buttons

HTML provides the **skeleton of the frontend**, deciding *what exists* on the page.

---

### 🎨 CSS (Styling)

* Controls how the UI looks
* Responsible for:

  * Colors and themes
  * Spacing and alignment
  * Message positioning (left/right)

CSS turns raw HTML into a **visually understandable interface**.

---

### 🅱️ Bootstrap (UI Framework)

* A popular CSS framework
* Speeds up frontend development
* Provides:

  * Responsive grid system
  * Pre‑styled buttons, cards, forms
  * Mobile‑friendly layouts

Bootstrap helps build clean UI **without writing complex CSS**.

---

### ⚙️ JavaScript (Frontend Logic & Dynamism)

* Adds life to the frontend
* Responsible for:

  * Calling backend APIs
  * Sending messages asynchronously
  * Loading messages dynamically
  * Updating UI without page reloads

JavaScript acts as the **bridge between UI and backend APIs**.

---

### 📄 CSV (Python Module)

* Used to export chat data
* Converts database records into CSV files

This feature demonstrates how applications generate **reports and data exports**.

---

## 🧠 Which Tech Stack Does What?

| Technology | Responsibility               |
| ---------- | ---------------------------- |
| Python     | Backend logic & rules        |
| Django     | Project structure & ORM      |
| DRF        | API creation & JSON handling |
| JWT        | Authentication & security    |
| SQLite     | Persistent data storage      |
| HTML       | Page structure               |
| CSS        | Visual styling               |
| Bootstrap  | Responsive UI design         |
| JavaScript | Dynamic behavior & API calls |
| CSV        | Data export feature          |

---

## 🧠 What Makes This Project Different? (USP)

✨ Unlike many chat application, this project:

* Uses **REST APIs instead of WebSockets** for simplicity
* Implements **JWT authentication**, not fake login systems
* Supports **Direct Messages and Group Chats**
* Includes **Message Reactions** like modern chat apps
* Allows **Exporting Chat History to CSV**
* Clean separation between backend and frontend logic

This makes Connect a **perfect bridge** and **great stepping stone** before learning advanced tools like Django Channels or Socket.IO.

---

## 🏗️ Project Structure

```
Chat_Application/
│
├── Chat_Application/
│   ├── manage.py            # Django project entry point
│   ├── db.sqlite3           # SQLite database
│   │
│   ├── Chat/                # Main Chat App (Business Logic)
│   │   ├── models.py        # Database models (User, Message, Group)
│   │   ├── views.py         # API logic (send message, login, export, etc.)
│   │   ├── urls.py          # API routes
│   │   ├── serializers.py   # Converts data to/from JSON
│   │   └── admin.py         # Django admin config
│   │
│   ├── Chat_Application/    # Project Settings Folder
│   │   ├── settings.py      # Installed apps, database, JWT config
│   │   ├── urls.py          # Root URL router
│   │   └── wsgi.py / asgi.py
│   │
│   ├── templates/           # HTML templates
│   ├── static/              # Static files (CSS, JS)
│   ├── media/               # Uploaded files
│   └── venv/                # Virtual environment
```

👉 **Tip for beginners:** Focus mainly on the `Chat` folder. That’s where the real logic lives.

---

## 🔄 How the Application Works

### 1️⃣ User Authentication
- Users log in using **Email & Password**
- Server returns a **JWT token**
- Token is used in headers for all protected APIs

```
Authorization: Bearer <your_token>
```

---

### 2️⃣ Sending Messages
- A message can be sent to:
  - Another user (Direct Message)
  - A group
- Each message is stored in the following format:
  - Sender
  - Receiver (user or group)
  - Text
  - Time
  - Reaction (optional)

---

### 3️⃣ Group Chat
- Users can be part of multiple groups
- Messages sent to a group are visible to all members

---

### 4️⃣ Message Reactions
- Users can react to messages
- Reactions are stored in the database
- Useful for features like 👍 ❤️ 😂

---

### 5️⃣ Export Chat History
- Chat messages can be exported as a **CSV file**
- Includes:
  - From
  - To (User or Group)
  - Message
  - Time
  - Reaction

---

## 🧩 Core Logic

### 🗃️ Models (`models.py`)
Defines the database structure:

- **User** – sender & receiver
- **Message** – chat text, time, reaction
- **Group** – group chat support

---

### 🔁 Serializers (`serializers.py`)
- Converts Python objects → JSON
- Converts JSON → Python objects

---

### 🌐 Views (`views.py`)
- Handles requests like:
  - Login
  - Send message
  - Fetch chats
  - Export CSV

---

### 🧭 URLs (`urls.py`)
- Maps an API endpoint to a view

Example:
```
/api/send-message/  → send_message_view
```

---

## 🔐 Security

- JWT Authentication
- Protected APIs using permissions
- CSRF handled for APIs

---

## ▶️ How to Run the Project

```bash
# Create virtual environment
python -m venv venv

# Activate it
cd venv\Scripts
./activate

# Install dependencies
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install pillow

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

Server runs at:
```
http://127.0.0.1:8000/
```

---