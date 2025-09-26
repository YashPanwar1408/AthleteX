import json
from .analysis.vertical_jump import analyze as analyze_vertical_jump
from .analysis.situps import analyze as analyze_situps
from .analysis.shuttle_run import analyze as analyze_shuttle_run
from .analysis.endurance_run import analyze as analyze_endurance_run

def run_analysis(test_type: str, input_path: str, output_path: str,):
    analysis_results = {}

    if test_type.lower() == "vertical-jump":
        analysis_results = analyze_vertical_jump(input_path, output_path, )
    
    elif test_type.lower() == "sit-ups":
        analysis_results = analyze_situps(input_path, output_path, )
        
    elif test_type.lower() == "shuttle-run":
        analysis_results = analyze_shuttle_run(input_path, output_path,)
        
    elif test_type.lower() == "endurance-run":
        analysis_results = analyze_endurance_run(input_path, output_path, )
        
    else:
        error_message = f"Error: Analysis for test type '{test_type}' is not implemented."
        print(error_message)
        return {"error": error_message}

    print(json.dumps(analysis_results, indent=4))
    return analysis_results

if __name__ == "__main__":
    test_to_run = "vertical-jump"
    input_video = "input.mp4" 
    output_video = f"{test_to_run}_result.mp4"
    athlete_level_input = "Intermediate"
    
    run_analysis(test_to_run, input_video, output_video, athlete_level_input)