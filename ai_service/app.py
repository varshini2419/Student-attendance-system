import os
import sys
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from face_processor import FaceProcessor
import threading
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

START_TIME = time.time()

model_lock = threading.Lock()

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
# Strict CORS config for deployment communication
backend_url = os.getenv("BACKEND_URL", "https://student-attendance-system-hpw1.onrender.com")
frontend_url = os.getenv("FRONTEND_URL", "https://student-attendance-system-eight-tau.vercel.app")
CORS(app, resources={r"/*": {"origins": [backend_url, frontend_url, "http://localhost:5000", "http://localhost:5173"]}})

processor = FaceProcessor()

MONGO_URI = os.getenv("MONGO_URI", "")
mongo_client = None
if MONGO_URI:
    try:
        # We initialize it but connection is lazy. We test in /health
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    except Exception as e:
        print(f"Failed to initialize MongoDB client: {e}")

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Unhandled Exception: {e}")
    return jsonify({
        "success": False,
        "message": "Internal Server Error",
        "error": str(e)
    }), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "AI Face Recognition Engine",
        "status": "online",
        "version": "1.0.0",
        "uptime_seconds": round(time.time() - START_TIME),
        "engine": "OpenCV YuNet & SFace"
    })

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health():
    db_connected = False
    if mongo_client:
        try:
            mongo_client.admin.command('ping')
            db_connected = True
        except ServerSelectionTimeoutError:
            pass
            
    return jsonify({
        "success": True,
        "ai": "running",
        "faceModel": "loaded",
        "dbConnected": db_connected,
        "uptime": round(time.time() - START_TIME)
    })

@app.route('/api/extract-embeddings', methods=['POST'])
def extract_embeddings():
    data = request.json
    if not data or 'images' not in data:
        return jsonify({"success": False, "message": "No images provided"}), 400
        
    images = data['images']
    student_id = data.get('student_id', 'Unknown')
    
    print(f"\n[FACE REGISTER] Received {len(images)} images for student {student_id}")
    
    embeddings = []
    errors = []
    
    for idx, img_b64 in enumerate(images):
        img = processor.decode_base64_image(img_b64)
        if img is None:
            errors.append(f"Image {idx}: Failed to decode")
            continue
            
        with model_lock:
            embedding, msg = processor.process_registration_image(img)
        
        if embedding is not None:
            embeddings.append(embedding)
        else:
            errors.append(f"Image {idx}: {msg}")
            
    print(f"[FACE REGISTER] Successfully generated {len(embeddings)} embeddings.")
    if len(errors) > 0:
        print(f"[FACE REGISTER] Encountered {len(errors)} validation errors.")
        
    if len(embeddings) == 0:
        return jsonify({
            "success": False,
            "message": f"Quality checks failed for all images. Reasons: {list(set(errors))}"
        }), 422
        
    return jsonify({"success": True, "embeddings": embeddings})


@app.route('/api/recognize', methods=['POST'])
def recognize():
    data = request.json
    
    print("\n[FACE SCAN]")
    print("Image received: YES" if data and 'image' in data else "Image received: NO")
    
    if not data or 'image' not in data:
        return jsonify({"success": False, "message": "No image frame provided"}), 400
        
    img_b64 = data['image']
    img = processor.decode_base64_image(img_b64)
    if img is None:
        return jsonify({"success": False, "message": "Failed to process image frame"}), 400
        
    with model_lock:
        extracted_faces = processor.extract_all_faces(img)
    
    if not extracted_faces:
        print("Face detected: NO")
        print("Embedding generated: NO")
        return jsonify({"success": False, "message": "No face detected"})
        
    print("Face detected: YES")
    print("Embedding generated: YES")
    
    return jsonify({
        "success": True,
        "faces": extracted_faces
    })


if __name__ == '__main__':
    port = int(os.getenv("PORT", 8000))
    env = os.getenv("FLASK_ENV", "production")
    
    print(f"Starting AI Face Service on port {port} in {env} mode...")
    if env == "development":
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        from waitress import serve
        serve(app, host='0.0.0.0', port=port)
