
import cv2
import numpy as np
from ..pose_detection import PoseDetector

def calculate_angle(a, b, c):
    """Calculates the angle between three points (in degrees)."""
    a = np.array(a) # First point
    b = np.array(b) # Mid point
    c = np.array(c) # End point
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle

def analyze(input_path: str, output_path: str):
    print("--- Running Sit-ups Analysis ---")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return {"error": f"Could not open video file {input_path}"}
        
    detector = PoseDetector()

    # Video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))

    # --- Sit-up detection parameters ---
    # Angle thresholds for counting a rep
    UP_THRESHOLD_ANGLE = 100
    DOWN_THRESHOLD_ANGLE = 150
    
    # --- State variables for sit-up logic ---
    rep_count = 0
    state = "down" # Start in the "down" state
    
    # YOLOv8 keypoint indices for left side of the body
    LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE = 5, 11, 13

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
            
        results = detector.detect(frame)
        annotated_frame = results.plot()

        if results.keypoints and results.keypoints.has_visible:
            keypoints = results.keypoints.xy[0]

            # Ensure all three keypoints are detected
            if len(keypoints) > max(LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE):
                shoulder = keypoints[LEFT_SHOULDER].numpy()
                hip = keypoints[LEFT_HIP].numpy()
                knee = keypoints[LEFT_KNEE].numpy()
                
                # Calculate the angle of the torso
                torso_angle = calculate_angle(shoulder, hip, knee)
                
                # --- Repetition Counting Logic ---
                # State: "down", looking for an "up" motion
                if torso_angle < UP_THRESHOLD_ANGLE and state == "down":
                    state = "up"
                    rep_count += 1
                    print(f"Sit-up #{rep_count} detected.")
                
                # State: "up", looking for a "down" motion to reset
                if torso_angle > DOWN_THRESHOLD_ANGLE and state == "up":
                    state = "down"

                # --- Visualization ---
                # Display the angle on the frame
                cv2.putText(annotated_frame, f"Angle: {int(torso_angle)}", (hip[0].astype(int) + 10, hip[1].astype(int)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(annotated_frame, f"Sit-ups: {rep_count}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        out.write(annotated_frame)

    cap.release()
    out.release()
    
    # --- Prepare results dictionary ---
    analysis_results = {
        "test_type": "Sit-ups",
        "total_reps": rep_count,
        "analysis_video_path": output_path
    }
    
    return analysis_results