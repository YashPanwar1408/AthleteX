import cv2  
import numpy as np
import requests  # pyright: ignore[reportMissingModuleSource]
from io import BytesIO
from PIL import Image

try:
    import face_recognition  # pyright: ignore[reportMissingImports]
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Warning: face_recognition library not available. Cheat detection will be disabled.")

def verify_face(profile_image_url: str, video_path: str):
    try:
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                "is_cheat_detected": False,
                "match_confidence_percent": 100.0,
                "details": "Face recognition library not available. Cheat detection disabled."
            }
            
        if not profile_image_url:
            return {"error": "Profile image URL was not provided."}

        # Download and process profile image
        response = requests.get(profile_image_url, timeout=30)
        response.raise_for_status()
        
        profile_image_pil = Image.open(BytesIO(response.content)).convert("RGB")
        profile_image_np = np.array(profile_image_pil)
        
        # Extract face encoding from profile image
        profile_encodings = face_recognition.face_encodings(profile_image_np)
        if not profile_encodings:
            return {"error": "No face found in the profile image."}
        known_face_encoding = profile_encodings[0]

        # Process video for face detection
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video file for cheat detection."}

        frame_count = 0
        match_count = 0
        frames_with_faces = 0
        detection_interval = 10  # Reduced interval for better detection
        max_frames_to_process = 300  # Limit processing to avoid long delays

        try:
            while cap.isOpened() and frame_count < max_frames_to_process:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % detection_interval != 0:
                    continue

                # Convert BGR to RGB for face_recognition
                rgb_frame = frame[:, :, ::-1]
                
                try:
                    face_locations = face_recognition.face_locations(rgb_frame)
                    
                    if face_locations:
                        frames_with_faces += 1
                        video_face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                        
                        if video_face_encodings:
                            matches = face_recognition.compare_faces(
                                [known_face_encoding], video_face_encodings[0], tolerance=0.6
                            )
                            if matches and matches[0]:
                                match_count += 1
                except Exception as face_error:
                    print(f"Face detection error on frame {frame_count}: {face_error}")
                    continue
        
        finally:
            cap.release()

        if frames_with_faces == 0:
            return {
                "is_cheat_detected": False,
                "match_confidence_percent": 0.0,
                "details": "No faces were detected in the test video to compare."
            }

        # Calculate confidence and determine if cheat is detected
        match_confidence = (match_count / frames_with_faces) * 100 if frames_with_faces > 0 else 0
        is_cheat = match_confidence < 50

        return {
            "is_cheat_detected": is_cheat,
            "match_confidence_percent": round(match_confidence, 2),
            "details": f"Athlete's face matched in {match_count} of {frames_with_faces} checked frames (processed {frame_count} total frames)."
        }

    except Exception as e:
        return {"error": f"An error occurred during face verification: {str(e)}"}