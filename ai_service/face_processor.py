import os
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import urllib.request

class FaceProcessor:
    def __init__(self):
        self.models_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(self.models_dir, exist_ok=True)
        
        self.yunet_path = os.path.join(self.models_dir, "face_detection_yunet_2023mar.onnx")
        self.sface_path = os.path.join(self.models_dir, "face_recognition_sface_2021dec.onnx")
        
        self.download_models()
        
        # Initialize YuNet for face detection
        self.detector = cv2.FaceDetectorYN.create(
            model=self.yunet_path,
            config="",
            input_size=(320, 240),
            score_threshold=0.3,
            nms_threshold=0.3,
            top_k=5000
        )
        
        # Initialize SFace for face recognition
        self.recognizer = cv2.FaceRecognizerSF.create(self.sface_path, "")
        print("[FACE ENGINE] OpenCV YuNet & SFace models loaded successfully.")

    def download_models(self):
        urls = {
            self.yunet_path: "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
            self.sface_path: "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
        }
        for path, url in urls.items():
            if not os.path.exists(path):
                print(f"Downloading {os.path.basename(path)}...")
                urllib.request.urlretrieve(url, path)

    def decode_base64_image(self, base64_str):
        try:
            if ',' in base64_str:
                base64_str = base64_str.split(',')[1]
            img_data = base64.b64decode(base64_str)
            img = Image.open(BytesIO(img_data)).convert('RGB')
            # OpenCV expects BGR
            bgr_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            return bgr_img
        except Exception as e:
            print(f"Error decoding base64: {e}")
            return None

    def validate_image_quality(self, bgr_img):
        gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return False, "Image is too blurry."
        brightness = np.mean(gray)
        if brightness < 40:
            return False, "Image is too dark."
        if brightness > 240:
            return False, "Image is too bright."
        return True, "Valid"

    def process_registration_image(self, bgr_img):
        """Detects 1 face, aligns, and extracts 128D SFace embedding."""
        valid, msg = self.validate_image_quality(bgr_img)
        if not valid:
            return None, msg

        h, w = bgr_img.shape[:2]
        self.detector.setInputSize((w, h))
        
        _, faces = self.detector.detect(bgr_img)
        
        if faces is None or len(faces) == 0:
            return None, "No face detected."
        if len(faces) > 1:
            return None, "Multiple faces detected. Please ensure only one face is visible."
            
        face = faces[0]
        # Align face
        aligned_face = self.recognizer.alignCrop(bgr_img, face)
        # Extract 128D embedding
        feature = self.recognizer.feature(aligned_face)
        # Normalize and flatten
        feature = feature.flatten().tolist()
        return feature, "Success"

    def extract_all_faces(self, bgr_img):
        """Extracts all faces from an image frame for attendance marking."""
        results = []
        h, w = bgr_img.shape[:2]
        self.detector.setInputSize((w, h))
        
        _, faces = self.detector.detect(bgr_img)
        if faces is not None:
            for face in faces:
                bbox = [int(face[0]), int(face[1]), int(face[2]), int(face[3])]
                aligned_face = self.recognizer.alignCrop(bgr_img, face)
                feature = self.recognizer.feature(aligned_face)
                results.append({
                    'bbox': bbox,
                    'embedding': feature.flatten().tolist()
                })
        return results

    @staticmethod
    def cosine_distance(v1, v2):
        """Calculates Cosine distance between two vectors."""
        v1 = np.array(v1)
        v2 = np.array(v2)
        dot = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        return 1.0 - (dot / (norm_v1 * norm_v2))
