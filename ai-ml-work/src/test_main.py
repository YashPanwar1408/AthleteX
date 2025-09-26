from analysis.vertical_jump import analyze as analyze_vertical_jump
from analysis.situps import analyze as analyze_situps
from analysis.shuttle_run import analyze as analyze_shuttle_run
from analysis.endurance_run import analyze as analyze_endurance_run

def test_six_jumps_video():
    input_video_path = "tests/VerticalJump.mp4"
    output_video_path = "test_output_6_jumps.mp4"
    results = analyze_vertical_jump(input_video_path, output_video_path, "intermediate")
    
    assert "error" not in results, f"Analysis failed with an error: {results.get('error')}"
    assert results["total_jumps"] == 6



def test_situps_video():
    input_video_path = "tests/SitUps.mp4"
    output_video_path = "test_output_situps.mp4"
    results = analyze_situps(input_video_path, output_video_path, "intermediate")

    assert "error" not in results, f"Analysis failed with an error: {results.get('error')}"
    assert results["total_reps"] > 0

def test_shuttle_run_video():
    input_video_path = "tests/ShuttleRun.mp4"
    output_video_path = "test_output_shuttlerun.mp4"
    results = analyze_shuttle_run(input_video_path, output_video_path, "intermediate")

    assert "error" not in results, f"Analysis failed with an error: {results.get('error')}"
    assert results["total_laps"] > 0
    assert results["total_time_seconds"] > 0

def test_endurance_run_video():
    input_video_path = "tests/Endurance.mp4"
    output_video_path = "test_output_endurance.mp4"
    results = analyze_endurance_run(input_video_path, output_video_path, "intermediate")

    assert "error" not in results, f"Analysis failed with an error: {results.get('error')}"
    assert results["run_percentage"] > 0