import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../../../env.js";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { result, testType, annotatedVideoUrl } = body;

    if (!result || !testType) {
      return Response.json(
        { error: "Result data and testType are required" },
        { status: 400 }
      );
    }

    let parsedResult = {};
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      return Response.json({ error: "Invalid result format", details: e.message }, { status: 400 });
    }

  const prompt = `
    You are an expert athletic performance analyst and coach, specializing in evaluating tests for elite athletes, similar to a coach at the Sports Authority of India (SAI).

Your task is to analyze the provided performance data from a physical fitness test and provide a comprehensive, insightful, and constructive breakdown for the athlete.

You will be provided with three pieces of information:
1.  **Test Type**: The name of the test performed.
2.  **Performance Result (JSON)**: A JSON object containing the raw, machine-generated metrics from the test.
3.  **Annotated Video URL**: A link to a video of the performance. **You cannot watch this video.** However, its existence signifies that the data was captured via advanced pose estimation. Your analysis should reflect the detailed nature of this data (e.g., consistency, fatigue, and form breakdown over time).

---

## **Required Output Structure**

Your analysis **must** be structured in the following format, using markdown for formatting.

### 🏅 Performance Analysis: ${testType}

**📝 Overall Summary:**
(Provide a brief, 2-3 sentence summary of the athlete's overall performance, highlighting the main takeaways from the data.)

**🚀 Key Strengths:**
* (Based on the data, list the first positive aspect of the performance. Be specific.)
* (List the second positive aspect, tying it to a specific metric.)
* (Add a third point if the data clearly supports it.)

**🔍 Areas for Improvement:**
* (Based on the data, identify the primary area for improvement. For example, mention a drop-off in jump height or an increase in lap times.)
* (Identify a second area for improvement, linking it directly to the provided JSON data.)
* (Add a third point if applicable, focusing on nuances like pacing or consistency.)

**🎯 Actionable Recommendations:**
* (Provide a specific, practical drill or training adjustment to address the first area of improvement.)
* (Provide a second actionable tip related to the second area of improvement.)
* (Provide a final recommendation for overall performance enhancement.)

---

## **Test-Specific Interpretation Guide**

-   **If the Test is 'Vertical Jump'**:
    -   **Metrics to focus on**: max_jump_height_px, and the array of jump_heights_px.
    -   **Analyze**: Explosive power (max height) and, more importantly, **consistency and fatigue**. A significant drop-off in height in the jump_heights_px array indicates a breakdown in form or stamina.
    -   **Note on Pixels**: Frame your feedback in terms of relative performance (e.g., "The peak jump was significantly higher than the average," or "Performance declined by 15% in the second half of the test") rather than absolute measurements like inches or cm.

-   **If the Test is 'Sit-Ups'**:
    -   **Metrics to focus on**: total_reps and reps_per_second (if available).
    -   **Analyze**: Core muscular endurance (total_reps) and **pacing**. Did the repetition rate remain steady, or did it decrease significantly towards the end? A drop-off indicates fatigue.

-   **If the Test is 'Shuttle Run'**:
    -   **Metrics to focus on**: total_time_seconds and lap_times.
    -   **Analyze**: Overall agility and speed (total_time_seconds), but also **stamina and turning efficiency**. Are the lap_times consistent? Increasing lap times suggest fatigue or inefficient changes in direction.

-   **If the Test is 'Endurance Run'**:
    -   **Metrics to focus on**: run_percentage, walk_percentage, stop_percentage.
    -   **Analyze**: **Cardiovascular fitness and pacing strategy**. A high run_percentage is excellent. High walk_percentage or stop_percentag indicates a need to improve aerobic capacity and develop a better pacing strategy.

---

## **Begin Analysis Now**

* **Test Type:** ${testType}
* **Annotated Video URL:** ${annotatedVideoUrl || "Not provided"}
* **Performance Result (JSON):** ${JSON.stringify(parsedResult, null, 2)}
  `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const generationResult = await model.generateContent(prompt);
    const responseText = generationResult.response.text();
    
    // Return the markdown text response directly
    return Response.json({ 
      refinedAnalysis: responseText,
      status: "success"
    });
  } catch (error) {
    console.error("Error calling refineAnalysis API:", error);
    return Response.json({ 
      error: "Failed to generate AI analysis", 
      details: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}