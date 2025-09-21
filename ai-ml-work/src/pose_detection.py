import cv2
from ultralytics import YOLO

class PoseDetector:
    def __init__(self):
        self.model = YOLO('yolov8n-pose.pt')

    def detect(self, frame):
        results = self.model(frame, verbose=False)
        return results[0]