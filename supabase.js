// supabase.js
export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Auth helpers =====
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

// ===== Profile helpers (profiles 테이블 기준) =====
// profiles: id(uuid, pk), display_name(text), avatar_url(text), is_admin(bool), is_seller(bool)
export async function getMyProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_admin, is_seller")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}

export async function isAdmin() {
  const p = await getMyProfile();
  return !!p?.is_admin;
}

export async function isSeller() {
  const p = await getMyProfile();
  return !!p?.is_seller;
}

export async function signOut() {
  await supabase.auth.signOut();
  location.href = "/index.html";
}
