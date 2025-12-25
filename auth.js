import { supabase } from "./supabase.js";

export async function getUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function requireLogin() {
  const u = await getUser();
  if (!u) {
    alert("로그인이 필요해요.");
    location.href = "./login.html";
  }
  return u;
}

export async function isAdmin() {
  const u = await getUser();
  if (!u) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", u.id)
    .single();

  if (error) return false;
  return !!data?.is_admin;
}

export async function requireAdmin() {
  const ok = await isAdmin();
  if (!ok) {
    alert("관리자만 접근 가능해요.");
    location.href = "./index.html";
  }
}
