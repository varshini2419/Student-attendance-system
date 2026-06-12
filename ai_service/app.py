import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from face_processor import FaceProcessor
from PIL import Image
import threading

model_lock = threading.Lock()

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

processor = FaceProcessor()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "ai": "running",
        "faceModel": "loaded"
    })

@app.route('/api/extract-embeddings', methods=['POST'])
def extract_embeddings():
    try:
        data = request.json
        if not data or 'images' not in data:
            return jsonify({"success": False, "message": "No images provided"}), 400
            
        images = data['images']
        student_id = data.get('student_id', 'Unknown')
        
        print(f"\\n[FACE REGISTER] Received {len(images)} images for student {student_id}")
        
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
            print(f"[FACE REGISTER] Encountered {len(errors)} validation errors (e.g. blurry, multiple faces).")
            
        if len(embeddings) == 0:
            return jsonify({
                "success": False,
                "message": f"Quality checks failed for all images. Reasons: {list(set(errors))}"
            }), 422
            
        return jsonify({"success": True, "embeddings": embeddings})
    except Exception as e:
        print(f"[FACE REGISTER] Error extracting embeddings: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/recognize', methods=['POST'])
def recognize():
    try:
        data = request.json
        
        print("\\n[FACE SCAN]")
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
        
        # We simply return the raw extracted embeddings so the Node.js backend can do the math.
        # This completely bypasses PyMongo DNS resolution failures!
        return jsonify({
            "success": True,
            "faces": extracted_faces
        })
        
    except Exception as e:
        print(f"Error recognizing: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 8000))
    print(f"Starting AI Face Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
