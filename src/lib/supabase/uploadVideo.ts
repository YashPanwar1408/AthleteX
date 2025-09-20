import { supabase } from "./supbaseClient";
import * as FileSystem from "expo-file-system";
import * as mime from "react-native-mime-types";

export const uploadVideo = async (uri: string, testType: string, user: any) => {
  try {
    if (!user) throw new Error("User not logged in");


    const ext = uri.split(".").pop() || "mp4";
    const fileName = `${user.id}_${Date.now()}.${ext}`;
    const mimeType = mime.lookup(ext) || "video/mp4";

   
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });


    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const fileBuffer = bytes.buffer;

    
    const { error } = await supabase.storage
      .from("videos")
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw error;

  
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    const videoUrl = publicUrlData.publicUrl;

   
    const { error: dbError } = await supabase.from("attempts").insert([
      {
        user_id: user.id,
        test_type: testType,
        video_url: videoUrl,
        status: "in-progress",
      },
    ]);

    if (dbError) throw dbError;

    return { success: true, videoUrl };
  } catch (err) {
    console.error("Video upload failed:", err);
    throw err;
  }
};
