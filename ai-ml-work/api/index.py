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
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request body"}), 400

    video_url = data.get("videoUrl")
    test_type = data.get("testType")
    attempt_id = data.get("attemptId")
    user_id = data.get("userId")
    user_name = data.get("username")

    if not all([video_url, test_type, attempt_id, user_id, user_name]):
        return jsonify({"error": "Missing required fields"}), 400

    os.makedirs(TEMP_DIR, exist_ok=True)
    
    unique_id = str(uuid.uuid4())
    temp_input_path = os.path.join(TEMP_DIR, f"{unique_id}_input.mp4")
    temp_output_path = os.path.join(TEMP_DIR, f"{unique_id}_output.mp4")

    try:
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        with open(temp_input_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        ml_analysis_results = run_analysis(
            test_type=test_type,
            input_path=temp_input_path,
            output_path=temp_output_path
        )
        
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