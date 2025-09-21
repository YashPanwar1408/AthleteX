import { client } from "../lib/sanity/client";
import { uploadVideo } from "../lib/supabase/uploadVideo";

interface CreateAttemptInput {
  userId: string;
  testType: string;
  videoUri: string;
}

export const createTestAttempt = async ({
  userId,
  testType,
  videoUri,
}: CreateAttemptInput) => {
  try {
 
    const videoUrl = await uploadVideo(videoUri, testType,userId);


    const attemptDoc = {
      _type: "testAttempt",
      userId,
      testType,
      videoUrl, 
      status: "in-progress",
      createdAt: new Date().toISOString(),
    };

    const res = await client.create(attemptDoc);
    return res;
  } catch (err) {
    console.error("Error creating test attempt:", err);
    throw err;
  }
};
