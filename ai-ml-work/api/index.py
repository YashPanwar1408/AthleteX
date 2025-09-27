import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import uuid
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import requests
from supabase import create_client, Client
from src.main import run_analysis

load_dotenv()

app = Flask(__name__)

supabase_url = "https://sjckpssttekwosrpsmqc.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2twc3N0dGVrd29zcnBzbXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDg4ODgsImV4cCI6MjA3Mzg4NDg4OH0.gfNagdji7H1PHZG9_h868y48HGinpSprn-LyY3jZxaQ"
supabase: Client = create_client(supabase_url, supabase_key)

TEMP_DIR = "/tmp"

@app.route("/api/analyze", methods=["POST"])
def handle_analysis():
    print(f"Received request: {request.method} {request.url}")
    print(f"Content-Type: {request.content_type}")
    print(f"Raw data: {request.get_data()}")
    
    data = request.get_json()
    if not data:
        print("ERROR: No JSON data received")
        return jsonify({"error": "Invalid request body - no JSON data"}), 400

    print(f"Parsed JSON data: {data}")
    
    video_url = data.get("videoUrl")
    test_type = data.get("testType")
    attempt_id = data.get("attemptId")
    user_id = data.get("userId")
    user_name = data.get("username")
    # Handle both field name variations for backward compatibility
    profile_image_url = data.get("profileImageUrl") or data.get("imageProfileUrl")

    print(f"Extracted fields - video_url: {video_url}, test_type: {test_type}, attempt_id: {attempt_id}")
    print(f"user_id: {user_id}, user_name: {user_name}, profile_image_url: {profile_image_url}")

    missing_fields = []
    if not video_url:
        missing_fields.append("videoUrl")
    if not test_type:
        missing_fields.append("testType")
    if not attempt_id:
        missing_fields.append("attemptId")
    if not user_id:
        missing_fields.append("userId")
    if not user_name:
        missing_fields.append("username")
    if not profile_image_url:
        missing_fields.append("profileImageUrl")

    if missing_fields:
        error_msg = f"Missing required fields: {', '.join(missing_fields)}"
        print(f"ERROR: {error_msg}")
        return jsonify({"error": error_msg}), 400

    # Validate test type
    valid_test_types = ["vertical-jump", "sit-ups", "shuttle-run", "endurance-run"]
    if test_type.lower() not in valid_test_types:
        error_msg = f"Invalid test type '{test_type}'. Supported types: {', '.join(valid_test_types)}"
        print(f"ERROR: {error_msg}")
        return jsonify({"error": error_msg}), 400

    print(f"All validation passed. Starting analysis for test type: {test_type}")
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    unique_id = str(uuid.uuid4())
    temp_input_path = os.path.join(TEMP_DIR, f"{unique_id}_input.mp4")
    temp_output_path = os.path.join(TEMP_DIR, f"{unique_id}_output.mp4")

    try:
        print(f"Downloading video from: {video_url}")
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        print(f"Video download successful. Status code: {response.status_code}")
        
        with open(temp_input_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Video saved to: {temp_input_path}")
        
        print(f"Starting analysis for test type: {test_type}")
        ml_analysis_results = run_analysis(
            test_type=test_type,
            input_path=temp_input_path,
            output_path=temp_output_path,
            profile_image_url=profile_image_url
        )
        print(f"Analysis completed. Results: {ml_analysis_results}")
        
        if "error" in ml_analysis_results:
             raise Exception(ml_analysis_results["error"])

        with open(temp_output_path, "rb") as f:
            bucket_name = "videos"
            upload_path = f"analysis_results/{unique_id}.mp4"
            supabase.storage.from_(bucket_name).upload(upload_path, f)
            annotated_video_url = supabase.storage.from_(bucket_name).get_public_url(upload_path)
        
        final_result_payload = {
            "userId": user_id,
            "username": user_name,
            "analysisData": ml_analysis_results
        }

        update_data = {
            "status": "done",
            "result": json.dumps(final_result_payload, indent=2),
            "annotated_video": annotated_video_url
            
        }

        supabase.table("attempts").update(update_data).eq("id", attempt_id).execute()
        
        return jsonify({"status": "success", "attemptId": attempt_id}), 200

    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        supabase.table("attempts").update({"status": "failed", "result": error_message}).eq("id", attempt_id).execute()
        return jsonify({"error": error_message}), 500
    
    finally:
        if os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        if os.path.exists(temp_output_path):
            os.remove(temp_output_path)