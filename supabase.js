// supabase.js
export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // OAuth 콜백 URL에서 세션 자동 감지
    flowType: "pkce",
  },
});

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function isAdmin() {
  const user = await getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (error) return false;
  return !!data?.is_admin;
}

export async function signOut() {
  await supabase.auth.signOut();
  location.href = "/index.html";
}
