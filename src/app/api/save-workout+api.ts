import { adminClient } from "@/lib/sanity/client";

export interface workoutData {
    _type: string;
    userId: string;
    date: string;
    duration: number;
    name?: string; // Add the name field as optional
    exercises: {
        _type:string;
        _key:string;
        exercise: {
            _type: string;
            _ref: string;
        };
        sets: {
            _type:string;
            _key:string;
            reps: number;
            weight: number;
            weightUnit:"lbs"|"kg";
        }[];
    }[];
}

export async function POST(request:Request) {
    const {workoutData}:{workoutData:workoutData} = await request.json();
    try{
        const result = await adminClient.create(workoutData);
        console.log("Workout saved successfully:",result);
       return Response.json({
        success:true,
        workoutId:result._id,
        message:"Workout saved successfully"
       })
    }catch(error){
        console.error("Error saving workout:",error);
        return Response.json({error:"Failed to save workout"},{status:500})
    }
}