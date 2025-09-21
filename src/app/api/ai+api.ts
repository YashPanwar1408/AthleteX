import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../../../env.js";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(request: Request) {
  const { exerciseName } = await request.json();

  if (!exerciseName) {
    return Response.json(
      { error: "Exercise name is required" },
      { status: 400 }
    );
  }

  const prompt = `
  You are a **friendly fitness coach**.  
  Your goal is to explain the exercise in a **beginner-friendly, clear, and attractive way**.  
  Use **simple language, bullet points, emojis, and short sentences** so anyone can follow.  

  The exercise name is: **${exerciseName}**
  
  🎯 **Formatting rules (very important):**
  - Always use proper Markdown.
  - Add **bold** keywords.
  - Use emojis to make it fun and easy to read.
  - Keep instructions step-by-step and beginner-friendly.
  - Use ✅ and ⚠️ where needed for clarity.
  
  📝 **Final Output Structure:**
  The exercise name is: **${exerciseName}**

  ## 🏋️ Equipment Required  
  (List equipment or write "No equipment needed")

  ## 📖 Instructions  
  (Step-by-step guide in short, clear sentences)

  ## 💡 Tips  
  (Simple advice to improve performance)

  ## 🔄 Variations  
  (Easy and harder versions for different levels)

  ## ⚠️ Safety  
  (Precautions to avoid injuries)

  Make the output look visually appealing, structured, and easy to follow.
  `;

  console.log("Prompt:", prompt);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("Gemini response:", response);

    return Response.json({ message: response });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
