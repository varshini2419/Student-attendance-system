# Smart AI Student Attendance System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB)
![Node](https://img.shields.io/badge/Backend-Node.js-339933)
![Python](https://img.shields.io/badge/AI_Engine-Python_3-3776AB)

## 📌 Project Description
The Smart AI Student Attendance System is an automated, web-based platform designed to replace manual roll-calls with real-time facial recognition technology. It utilizes a microservices architecture, featuring a React frontend, a Node.js API orchestrator, and a Python Computer Vision engine utilizing OpenCV's CPU-optimized YuNet and SFace ONNX models.

## ✨ Features
- **Real-Time Facial Recognition:** Identifies students and marks attendance instantly.
- **Zero-Touch Automation:** No RFID cards or manual registers required.
- **Microservices Architecture:** Decoupled AI and Backend engines for non-blocking performance.
- **Automated Reporting:** Generates downloadable Excel (`.xlsx`) files for every class session.
- **Secure Access:** Role-Based Access Control (RBAC) via JSON Web Tokens (JWT).

## 📸 Screenshots
*(Add screenshots here)*
- `Screenshot 1: Dashboard UI`
- `Screenshot 2: Real-time Scanning Interface`
- `Screenshot 3: Excel Report Output`

## ⚙️ Tech Stack
- **Frontend:** React 19, Vite, TailwindCSS 4, React Router
- **Backend:** Node.js, Express, Mongoose, JWT, ExcelJS
- **AI Service:** Python, Flask, OpenCV (YuNet/SFace), Numpy, Waitress
- **Database:** MongoDB Atlas

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/varshini2419/Student-attendance-system.git
cd Student-attendance-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ai_attendance
JWT_SECRET=your_super_secret_key
AI_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173
```
Run Backend:
```bash
npm run dev
```

### 3. AI Service Setup
```bash
cd ai_service
pip install -r requirements.txt
```
Create a `.env` file in the `ai_service/` directory:
```env
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```
Run AI Service:
```bash
python app.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://127.0.0.1:8000
```
Run Frontend:
```bash
npm run dev
```

## 📁 Folder Structure
```
├── ai_service/                 # Python Inference Engine (Flask + OpenCV)
├── backend/                    # Node.js REST API (Express + MongoDB)
└── frontend/                   # React SPA (Vite + Tailwind)
```

## 📡 API List
- `POST /api/auth/login` - Authenticate & obtain JWT
- `GET /api/students` - Retrieve all enrolled students
- `POST /api/students/:id/register-face` - Capture & store facial 128D embeddings
- `POST /api/attendance/session/start` - Initialize a new class period
- `POST /api/attendance/recognize` - Send real-time frame for AI match
- `POST /api/attendance/session/:id/stop` - Close period & generate Excel

## 📜 License
This project is licensed under the MIT License.

## ✍️ Author
**Maddala Varshini**
[GitHub Profile](https://github.com/varshini2419)