import cv2
import numpy as np
from ..pose_detection import PoseDetector

def analyze(input_path: str, output_path: str):
    print("--- Running Shuttle Run Analysis ---")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return {"error": f"Could not open video file {input_path}"}
        
    detector = PoseDetector()

    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))

    lap_count = 0
    state = None
    start_time = None
    total_time_seconds = 0
    
    LEFT_HIP, RIGHT_HIP = 11, 12
    
    line_one_x = int(w * 0.25)
    line_two_x = int(w * 0.75)

    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame_count += 1
        results = detector.detect(frame)
        annotated_frame = results.plot()
        
        cv2.line(annotated_frame, (line_one_x, 0), (line_one_x, h), (255, 0, 0), 2)
        cv2.line(annotated_frame, (line_two_x, 0), (line_two_x, h), (255, 0, 0), 2)

        if results.keypoints and results.keypoints.has_visible:
            keypoints = results.keypoints.xy[0]

            if len(keypoints) > max(LEFT_HIP, RIGHT_HIP):
                left_hip_x = keypoints[LEFT_HIP][0].item()
                right_hip_x = keypoints[RIGHT_HIP][0].item()
                hip_center_x = (left_hip_x + right_hip_x) / 2
                
                if start_time is None:
                    start_time = frame_count / fps

                if state is None:
                    if hip_center_x < line_one_x: state = "left"
                    elif hip_center_x > line_two_x: state = "right"
                
                elif state == "left" and hip_center_x > line_two_x:
                    lap_count += 1
                    state = "right"
                
                elif state == "right" and hip_center_x < line_one_x:
                    lap_count += 1
                    state = "left"

        if start_time is not None:
            total_time_seconds = (frame_count / fps) - start_time
            cv2.putText(annotated_frame, f"Time: {total_time_seconds:.2f}s", (10, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        cv2.putText(annotated_frame, f"Laps: {lap_count}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        out.write(annotated_frame)

    cap.release()
    out.release()
    
    analysis_results = {
        "test_type": "Shuttle Run",
        "total_laps": lap_count,
        "total_time_seconds": round(total_time_seconds, 2),
        "analysis_video_path": output_path
    }
    
    return analysis_results