# AI Student Attendance System

A premium, modern AI-based Student Attendance System. It uses facial recognition to automatically detect students via a webcam feed and logs their attendance into a MongoDB database. Features include student registration, real-time face detection, session-based attendance tracking, and automatic Excel report generation.

---

## 📋 Features
- **Premium Dashboard**: Glassmorphism UI, smooth micro-animations, modern SaaS design.
- **AI Face Recognition**: High accuracy real-time face matching using OpenCV and face_recognition.
- **Session-Based Attendance**: Create targeted sessions that independently track present and absent students.
- **Automatic Excel Reports**: Generates downloadable Excel `.xlsx` reports upon closing a session.
- **Student Enrollment**: Complete flow for registering student faces via the webcam.
- **Secure Authentication**: JWT-based login for Admin and Faculty roles.

---

## 🛠️ Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/varshini2419/Student-attendance-system.git
   cd "Student-attendance-system"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **AI Service Setup**
   ```bash
   cd "ai_service"
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

## 🔐 Environment Variables

You need to set up `.env` files for both the Backend and Frontend.

**Backend (`backend/.env`)**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_attendance
JWT_SECRET=your_jwt_secret_key_here
AI_SERVICE_URL=http://127.0.0.1:8000
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ MongoDB Setup
1. Ensure MongoDB is installed and running locally on port `27017`, or provide a valid MongoDB Atlas URI in `MONGO_URI`.
2. On initial startup, the backend will automatically seed a default admin account.
3. Default Admin Credentials:
   - **Email**: admin@gmail.com
   - **Password**: admin123

---

## 🤖 AI Service Setup
1. Ensure your Python virtual environment is activated.
2. The AI Service relies on `dlib` and `face_recognition`. Ensure you have CMake and Visual Studio C++ build tools installed if you are on Windows.
3. Start the Flask service:
   ```bash
   cd ai_service
   python app.py
   ```
   *The service will start on `http://127.0.0.1:8000`.*

---

## 🏃 Running the Application

Open three separate terminals to run each service:

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3: AI Service**
```bash
cd ai_service
venv\Scripts\python.exe -u app.py
```

---

## 📸 Attendance Workflow
1. Navigate to **Real-Time Scanner** in the dashboard.
2. Click **INITIALIZE SCANNER**. This creates a new session in the database.
3. As students step in front of the camera, the AI will match their face against the database.
4. Matched students will be added to the live Activity Log and marked as **Present**.
5. Once all students have passed, click **TERMINATE SESSION**.

---

## 📊 Report Generation Workflow
1. When you click **TERMINATE SESSION**, the backend automatically calculates which enrolled students were not seen during the session.
2. These missing students are marked as **Absent**.
3. An Excel `.xlsx` report containing Roll No, Name, Status, Detection Time, and Session ID is automatically generated and saved in the backend's `public/reports` folder.
4. The scanner UI updates to show total Present/Absent counts.
5. Click **EXPORT SHEET** to instantly download the generated session report.

---

## ⚠️ Troubleshooting

- **Webcam not working**: Ensure your browser has granted camera permissions to the `localhost` or local IP. Also, check if another app is currently using the camera.
- **Python `dlib` installation failing**: If you're on Windows, you must install Visual Studio Build Tools (with C++ development workflow) and CMake. 
- **Connection Refused on AI Service**: Make sure `app.py` is actively running and bound to `127.0.0.1:8000`. The backend relies on this port as defined in your `.env`.
- **Images not matching**: Make sure lighting is adequate when registering faces in the "Enrollment" page to ensure high-quality embeddings.