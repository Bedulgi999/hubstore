// supabase.js
export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ OAuth 리다이렉트/세션 유지에 필요한 옵션을 명시
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // OAuth 콜백 URL에서 세션 읽기
  },
});

// 세션/유저 캐시 (헤더 즉시 반영용)
let _cachedUser = null;
let _cachedAdmin = null;

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error(error);
  return data?.session ?? null;
}

export async function getUser({ force = false } = {}) {
  if (!force && _cachedUser) return _cachedUser;

  // getUser()는 네트워크를 탈 수 있어서, session 우선
  const session = await getSession();
  _cachedUser = session?.user ?? null;
  return _cachedUser;
}

export async function isAdmin({ force = false } = {}) {
  if (!force && _cachedAdmin !== null) return _cachedAdmin;

  const user = await getUser({ force });
  if (!user) {
    _cachedAdmin = false;
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn("[isAdmin] profiles read error:", error.message);
    _cachedAdmin = false;
    return false;
  }

  _cachedAdmin = !!data?.is_admin;
  return _cachedAdmin;
}

export async function signOut() {
  await supabase.auth.signOut();
  _cachedUser = null;
  _cachedAdmin = null;
  location.href = "/index.html";
}

// ✅ 헤더/화면이 로그인 상태 변화를 즉시 반영하도록 이벤트 제공
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(async (event) => {
    // 캐시 리셋
    _cachedUser = null;
    _cachedAdmin = null;

    try {
      await callback(event);
    } catch (e) {
      console.error("[onAuthChange callback error]", e);
    }
  });
}
