import { supabase } from "./supabase.js";
import { STORAGE_BUCKET } from "./config.js";

export async function uploadImageForUser(file, userId, folder = "uploads") {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "image/*" });

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
