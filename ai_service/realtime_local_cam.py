import os
import sys
import cv2
import numpy as np
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Ensure we can import from local files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from face_processor import FaceProcessor

# Load environment variables
load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_attendance_system")
print(f"Connecting to MongoDB at {MONGO_URI}...")
try:
    client = MongoClient(MONGO_URI)
    db_name = MONGO_URI.split("/")[-1].split("?")[0] or "ai_attendance_system"
    db = client[db_name]
    print(f"Connected to MongoDB database: {db_name}")
except Exception as e:
    print(f"CRITICAL: Failed to connect to MongoDB: {e}")
    sys.exit(1)

def get_today_date_string():
    """Returns the current local date in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")

def mark_attendance_in_db(student_id, student_name, roll_number):
    """
    Checks if student has attendance marked today.
    If not, creates a new attendance record.
    Returns:
        - "marked": if successfully marked present now.
        - "already_marked": if already present.
        - "error": if database insertion failed.
    """
    today_str = get_today_date_string()
    
    try:
        # Check if record already exists for this student on this day
        # Collection name: 'attendances' (Mongoose default lowercase plural of 'Attendance')
        existing = db.attendances.find_one({
            "student": student_id,
            "date": today_str
        })
        
        if existing:
            if existing.get("status") == "Present":
                return "already_marked"
            else:
                # Update status to present
                db.attendances.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"status": "Present", "timestamp": datetime.utcnow()}}
                )
                return "marked"
        
        # Create new record
        db.attendances.insert_one({
            "student": student_id,
            "date": today_str,
            "status": "Present",
            "timestamp": datetime.utcnow()
        })
        print(f"SUCCESS: Marked attendance for {student_name} ({roll_number}) on {today_str}")
        return "marked"
        
    except Exception as e:
        print(f"Database Error: {e}")
        return "error"

def run_realtime_recognition():
    # Initialize the FaceProcessor (loads SFace ONNX or Haar Cascade fallback)
    processor = FaceProcessor()
    
    # 1. Fetch registered student embeddings from MongoDB
    print("Loading face templates database from MongoDB...")
    students = list(db.students.find(
        {"embeddings": {"$exists": True, "$not": {"$size": 0}}},
        {"_id": 1, "name": 1, "rollNumber": 1, "embeddings": 1}
    ))
    
    if not students:
        print("WARNING: No students with registered face templates found in MongoDB!")
        print("Please register student faces via the web application dashboard first.")
        
    print(f"Loaded {len(students)} student profiles with face templates.")
    
    # Set threshold
    # Cosine threshold: DNN = 0.45. Fallback Pixel Correlation = 0.85
    threshold = 0.45 if processor.use_dnn else 0.85
    print(f"AI Recognition Threshold: {threshold} (DNN mode: {processor.use_dnn})")
    
    # 2. Open Local Webcam
    print("Initializing webcam. Press 'q' in the window to quit...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("ERROR: Could not open webcam source. Make sure camera is not in use by another app.")
        return

    # Frame skipping to avoid lagging on slower systems
    frame_count = 0
    
    # Cache to store last recognized student to avoid spamming db checks on every single frame
    last_recognized_id = None
    last_recognized_status = ""
    status_timer = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("ERROR: Failed to read frame from webcam.")
            break
            
        frame_count += 1
        h, w = frame.shape[:2]
        
        # Run detection on every frame, but perform heavy matching every 3 frames
        success, face_data = processor.detect_face(frame)
        
        if success:
            # We found a face! Draw a bounding box depending on the detector output
            x, y, box_w, box_h = 0, 0, 0, 0
            
            if processor.use_dnn:
                # YuNet output: bbox is at indices 0,1,2,3
                x, y, box_w, box_h = map(int, face_data[0:4])
            else:
                # Haar Cascade fallback outputs cropped image, so we search gray frame for box
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = processor.face_cascade.detectMultiScale(gray, 1.1, 5)
                if len(faces) > 0:
                    x, y, box_w, box_h = faces[0]
            
            # Draw primary face target bounding box
            cv2.rectangle(frame, (x, y), (x + box_w, y + box_h), (255, 255, 255), 2)
            
            # Perform face recognition comparison
            if frame_count % 3 == 0:
                frame_emb = processor.extract_embedding(frame)
                
                if frame_emb is not None and students:
                    best_sim = -1.0
                    best_student = None
                    
                    for student in students:
                        for reg_emb in student["embeddings"]:
                            if len(reg_emb) != len(frame_emb):
                                continue
                            sim = processor.cosine_similarity(frame_emb, reg_emb)
                            if sim > best_sim:
                                best_sim = sim
                                best_student = student
                                
                    if best_sim >= threshold and best_student:
                        student_id = best_student["_id"]
                        student_name = best_student["name"]
                        roll_number = best_student["rollNumber"]
                        
                        # Mark attendance directly in MongoDB
                        status = mark_attendance_in_db(student_id, student_name, roll_number)
                        
                        last_recognized_id = student_id
                        last_recognized_status = status
                        best_student_name = student_name
                        best_student_roll = roll_number
                        status_timer = 20 # Show status for next 20 frames
                    else:
                        last_recognized_id = None
                        last_recognized_status = "unknown"
                        status_timer = 20
                elif not students:
                    last_recognized_id = None
                    last_recognized_status = "no_templates"
                    status_timer = 20
            
            # Render labels based on recognition status cache
            if status_timer > 0:
                status_timer -= 1
                if last_recognized_status == "marked":
                    label = f"{best_student_name} - Present"
                    color = (0, 200, 0) # Green
                elif last_recognized_status == "already_marked":
                    label = f"{best_student_name} - Already Marked"
                    color = (255, 120, 0) # Orange/Blue
                elif last_recognized_status == "unknown":
                    label = "Unknown Face"
                    color = (0, 0, 255) # Red
                elif last_recognized_status == "no_templates":
                    label = "No registered students in DB"
                    color = (120, 120, 120) # Gray
                else:
                    label = "Processing..."
                    color = (255, 255, 255)
                
                # Draw text background
                cv2.rectangle(frame, (x, y - 22), (x + box_w, y), color, -1)
                cv2.putText(frame, label, (x + 5, y - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
                
                # Draw colored bounding box
                cv2.rectangle(frame, (x, y), (x + box_w, y + box_h), color, 2)
        else:
            # If no face is detected, reset status timer
            status_timer = 0
            
        # Draw status instructions on screen
        cv2.putText(frame, "AI Attendance Camera Feed", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "Press 'q' to close camera window", (15, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        
        cv2.imshow("AI Student Attendance System - Camera Scanner", frame)
        
        # Stop on pressing 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()
    print("Webcam capture terminated.")

if __name__ == "__main__":
    run_realtime_recognition()
