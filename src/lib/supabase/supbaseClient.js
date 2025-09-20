import { createClient } from "@supabase/supabase-js";
import { EXPO_PUBLIC_SUPABASE_ANON_KEY,EXPO_PUBLIC_SUPABASE_URL } from "../../../env.js";

const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
