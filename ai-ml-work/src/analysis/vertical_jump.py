import cv2
from ..pose_detection import PoseDetector

PERFORMANCE_THRESHOLDS = {
    "beginner": 20,
    "intermediate": 45,
    "advanced": 70
}

def analyze_performance(max_jump_height):
    assessed_level = "Beginner"
    if max_jump_height >= PERFORMANCE_THRESHOLDS["advanced"]:
        assessed_level = "Advanced"
    elif max_jump_height >= PERFORMANCE_THRESHOLDS["intermediate"]:
        assessed_level = "Intermediate"
        
    pass_fail_status = "Fail"
    if max_jump_height >= PERFORMANCE_THRESHOLDS["beginner"]:
        pass_fail_status = "Pass"
        
    return pass_fail_status, assessed_level

def analyze(input_path: str, output_path: str, ):
    print("--- Running Vertical Jump Analysis ---")
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        return {"error": f"Could not open video file {input_path}"}
        
    detector = PoseDetector()

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_seconds = total_frames / fps if fps > 0 else 0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))

    JUMP_DETECTION_THRESHOLD_PX = 20
    JUMP_LANDING_THRESHOLD_PX = 5
    baseline_y, peak_y = None, None
    jumping = False
    jump_heights_px = []
    
    LEFT_ANKLE_INDEX = 15

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        results = detector.detect(frame)
        annotated_frame = results.plot()
        if results.keypoints and results.keypoints.has_visible:
            keypoints = results.keypoints.xy[0]
            if len(keypoints) > LEFT_ANKLE_INDEX:
                ankle_y = int(keypoints[LEFT_ANKLE_INDEX][1])
                if baseline_y is None: baseline_y = ankle_y
                if not jumping and ankle_y < (baseline_y - JUMP_DETECTION_THRESHOLD_PX):
                    jumping = True
                    peak_y = ankle_y
                if jumping:
                    if ankle_y < peak_y: peak_y = ankle_y
                    if ankle_y >= (baseline_y - JUMP_LANDING_THRESHOLD_PX):
                        jumping = False
                        jump_height = baseline_y - peak_y
                        if jump_height > 0: jump_heights_px.append(jump_height)
                        peak_y = baseline_y
        cv2.putText(annotated_frame, f"Jumps: {len(jump_heights_px)}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        out.write(annotated_frame)

    cap.release()
    out.release()
    
    max_jump_height = max(jump_heights_px) if jump_heights_px else 0
    pass_fail_status, assessed_level = analyze_performance(max_jump_height)

    analysis_results = {
        "total_jumps": len(jump_heights_px),
        "jump_heights_px": [int(h) for h in jump_heights_px],
        "max_jump_height_px": int(max_jump_height),
        "duration_seconds": round(duration_seconds, 2),
        "analysis_video_path": output_path,
        "pass_fail_status": pass_fail_status,
        "assessed_level": assessed_level
    }
    
    return analysis_results