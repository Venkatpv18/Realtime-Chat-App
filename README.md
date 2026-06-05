# 💬 Real-Time Chat App

A full-stack Real-Time Chat Application built using the MERN Stack, Socket.IO, and JWT Authentication. The application enables users to communicate 
instantly through private messaging, share files, send voice messages, react to messages, and receive real-time notifications.

## 🚀 Features

### 🔐 Authentication & Security
- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Secure Password Storage

### 💬 Real-Time Messaging
- Private One-to-One Chat
- Real-Time Message Delivery
- Online Users List
- Typing Indicator
- Message Seen Status
- Chat History Persistence

### 📁 Media & File Sharing
- Image Sharing
- File Uploads
- Voice Message Recording
- Audio Playback

### 😀 User Experience
- Emoji Picker
- Message Reactions (❤️ 😂 👍 🔥)
- Search Messages
- Browser Notifications
- Dark / Light Theme
- Auto Scroll to Latest Message

### 🗄️ Database
- MongoDB Storage
- Persistent Chat History
- User Data Management

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Router DOM
- Socket.IO Client
- Emoji Picker React

### Backend
- Node.js
- Express.js
- Socket.IO
- JWT Authentication
- Multer

### Database
- MongoDB Atlas
- Mongoose

---

## 📂 Project Structure
Realtime-Chat-App
│
├── Backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── package.json
│   └── server.js
│
├── Frontend
│   ├── public
│   ├── src
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Realtime-Chat-App.git
```

```bash
cd Realtime-Chat-App
```

---

### 2️⃣ Backend Setup

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_SECRET_KEY
```

Run backend:

```bash
npm start
```

---

### 3️⃣ Frontend Setup

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

---

## 🌐 Environment Variables

Create a `.env` file inside the Backend folder.

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_SECRET_KEY
```

---


## 🔄 Application Workflow

```text
User Registration/Login
        ↓
JWT Authentication
        ↓
Connect via Socket.IO
        ↓
Real-Time Messaging
        ↓
Store Messages in MongoDB
        ↓
Display Chat History
```

---

## 🎯 Key Functionalities

- Real-Time Communication
- Secure Authentication
- Private Messaging
- File & Image Sharing
- Voice Messaging
- Online Status Tracking
- Message Reactions
- Browser Notifications
- Theme Switching

## 🚀 Future Enhancements

- Group Chat
- Audio Calling
- Video Calling
- User Profile Pictures
- Message Editing
- Message Deletion
- Push Notifications
- End-to-End Encryption

---

## 👨‍💻 Author

**Venkat**

GitHub: https://github.com/Venkatpv18

---

## 📄 License

This project is developed for educational and portfolio purposes.
