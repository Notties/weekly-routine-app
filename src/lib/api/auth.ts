import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./http";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** verify Supabase access token จาก Authorization header → คืน userId */
export async function requireUser(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  if (!token) throw new ApiError(401, "unauthorized");
  if (!url || !anonKey) throw new ApiError(500, "supabase not configured");

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "unauthorized");
  return data.user.id;
}
