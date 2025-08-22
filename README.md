# ChatDot – Real-Time Chat Application

#### ChatDot is a full-stack real-time chat application similar to WhatsApp that allows users to communicate instantly through text and images. It includes robust account creation with email verification, friend requests, chat features, and message management tools.

# 🔧 Features
## ✅ Authentication & User Management
- Create account using email
- Email verification with OTP code
- Choose and claim a unique username
- Set secure password
- Login / logout functionality
- Block & unblock other users

## 👥 Friend System
- Search users by username or name
- Send & accept friend requests
- Unfriend / remove users from contact list
 
## 💬 Messaging
- Send and receive text messages in real-time
- Send and receive image
- Send and receive voice records
- Send and receive video
- Message status (delete for me / delete for everyone)
- Edit message feature
- Clear full chat / history

## 🛡️ Privacy / Controls
- Block or unblock users
- Hide messages from blocked users
- Friends cannot message until request accepted

## 📂 Tech Stack 
- Frontend: React.js, Tailwind CSS, WebSocket
- Backend: Django with Django Channels 
- Database: MongoDB (with GridFS for storing images) and sql (for user related information)
- Authentication: OTP verification via email using Djang smtp

## 🧾 Functional Flow

- User Registration
- User enters email → receives OTP → verifies → sets username and password.
- User Login with username or email and user password.
- Search & Add Friends
- Search by username → send friend request → on accept, they become contacts.
- Send messages to contacts

## Chat
- Select contact → open chat → send messages (text, image or voice).
- Messages are pushed through WebSocket for real-time update.
- Selected contact get the message in realtime.

## Message Actions
- Send Image  → users can send images to otehr user.
- Send Video  → users can send video to otehr user.
- Voice Recording  → users can send voice records to other user.
- Download Image → users can download images they receive.
- View Image → click to open image in full view / preview mode.
- Edit → update the content of the message.
- Delete for me → only you no longer see it.
- Delete for everyone → removes the message from both sides (within time limit).


## Privacy Controls
- Block user → they cannot send messages.
- Unblock user → resume conversation.

#  🚀 Future Improvements (Under construction)

- Group Chats
- More attachment options
- Online / Offline status indicators
- Voice & video call
- Story/Status updates 
