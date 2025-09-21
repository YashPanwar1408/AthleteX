import cv2
import numpy as np
from collections import deque
from ..pose_detection import PoseDetector

def analyze(input_path: str, output_path: str, user_level: str):
    print("--- Running Endurance Run Analysis ---")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return {"error": f"Could not open video file {input_path}"}
        
    detector = PoseDetector()

    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))

    activity_log = []
    hip_positions = deque(maxlen=2)
    
    LEFT_HIP, RIGHT_HIP = 11, 12

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        results = detector.detect(frame)
        annotated_frame = results.plot()
        
        current_activity = "Stopped"

        if results.keypoints and results.keypoints.has_visible:
            keypoints = results.keypoints.xy[0]
            if len(keypoints) > max(LEFT_HIP, RIGHT_HIP):
                hip_center = (keypoints[LEFT_HIP].numpy() + keypoints[RIGHT_HIP].numpy()) / 2
                hip_positions.append(hip_center)

                if len(hip_positions) == 2:
                    displacement = np.linalg.norm(hip_positions[1] - hip_positions[0])
                    speed_px_per_frame = displacement
                    
                    if speed_px_per_frame > 10:
                        current_activity = "Running"
                    elif speed_px_per_frame > 2:
                        current_activity = "Walking"
        
        activity_log.append(current_activity)

        cv2.putText(annotated_frame, f"Activity: {current_activity}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        out.write(annotated_frame)

    cap.release()
    out.release()
    
    total_frames = len(activity_log)
    if total_frames > 0:
        run_percentage = (activity_log.count("Running") / total_frames) * 100
        walk_percentage = (activity_log.count("Walking") / total_frames) * 100
        stop_percentage = (activity_log.count("Stopped") / total_frames) * 100
    else:
        run_percentage = walk_percentage = stop_percentage = 0
    
    analysis_results = {
        "test_type": "Endurance Run",
        "run_percentage": round(run_percentage, 2),
        "walk_percentage": round(walk_percentage, 2),
        "stop_percentage": round(stop_percentage, 2),
        "analysis_video_path": output_path
    }
    
    return analysis_results