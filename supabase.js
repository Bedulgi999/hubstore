// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let _authListenerBound = false;

/* ===== 사용자 ===== */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/* ===== 관리자 여부 (header.js에서 필요) ===== */
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

/* ===== 로그아웃 ===== */
export async function signOut() {
  await supabase.auth.signOut();
  location.href = "/index.html";
}

/* ===== auth 상태 변화 리스너 (딱 1번만) ===== */
export function bindAuthListenerOnce(callback) {
  if (_authListenerBound) return;
  _authListenerBound = true;

  supabase.auth.onAuthStateChange(() => {
    callback();
  });
}
