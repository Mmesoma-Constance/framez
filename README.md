# Framez - Social Media App

A mobile social media application built with **React Native**, **TypeScript**, and **Supabase**.

## 🚀 Features

- ✅ User Authentication (Sign Up, Login, Logout)
- ✅ Persistent Sessions
- ✅ Create Posts (Text & Images)
- ✅ Feed with Real-time Updates
- ✅ User Profile
- ✅ View User's Posts
- ✅ Full TypeScript Support

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo) with TypeScript  
- **Backend:** Supabase  
- **Navigation:** React Navigation  
- **State Management:** React Context API  
- **Image Handling:** expo-image-picker  
- **Language:** TypeScript  

---

## ⚙️ Setup Instructions

### 🧩 Prerequisites

- Node.js (v16 or higher)  
- npm or yarn  
- Expo Go app on your phone (for testing)  

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Framez
2. Install dependencies

npm install


3. Configure Supabase

Create a project on Supabase

Run the SQL commands from the setup section

Update src/lib/supabase.ts with your Supabase URL and anon key



4. Start the development server

npm start


5. Test on your device

Install Expo Go from App Store / Play Store

Scan the QR code shown in your terminal





---

🧱 Database Schema

Posts Table

id (uuid, primary key)

user_id (uuid, foreign key to auth.users)

user_email (text)

text (text, nullable)

image_url (text, nullable)

created_at (timestamp)


Storage Bucket

post-images — Stores user-uploaded images



---

🧩 Features Implementation

Authentication

Implemented using Supabase Auth

Email/password authentication

Session persistence with AsyncStorage

Auto-login on app restart


Posts

Text and image support

Image upload to Supabase Storage

Real-time feed updates

Chronological ordering


Profile

User information display

Personal posts gallery

Post count statistics

Logout functionality



---

🧪 Testing Steps

1. Create an account


2. Login with your credentials


3. Create a post with text and/or image


4. View posts in the feed


5. Check your profile


6. Logout and login again (session should persist)




---

🎬 Demo

🔗 
 [YouTube Demo](https://youtube.com/shorts/3Xc-ztnqJpM?si=sb0bAt4llVG_Q_d_)
[Appetize Live Link](https://appetize.io/app/b_wnzqtsjztfzzw55qbhniaak5wy)


---

👤 Author

Nwokem Mmesoma
📧 mmesomanwokem@gmail.com

---

