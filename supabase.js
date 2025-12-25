// supabase.js (ESM)
export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

// ✅ CDN(@supabase/supabase-js)로 window.supabase가 생긴 뒤에 사용
export const sb = () => {
  if (!window.supabase) throw new Error("Supabase CDN not loaded. Check script order.");
  return window.supabase;
};

export const client = sb().createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- auth helpers ----------
export async function getUser() {
  const { data } = await client.auth.getSession();
  return data.session?.user ?? null;
}

export async function signOut() {
  await client.auth.signOut();
  location.href = "/index.html";
}

export async function isAdmin() {
  const user = await getUser();
  if (!user) return false;
  const { data, error } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error) return false;
  return !!data?.is_admin;
}

// ---------- UI helpers ----------
export function escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function renderTopbar() {
  const mount = document.getElementById("topbar");
  if (!mount) return;

  // ✅ 기본은 "로딩 중" 헤더 (스크립트 로드 확인용)
  mount.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/index.html">
          <span class="brand-badge"></span>
          <div>
            <div class="brand-title">허브 스토어</div>
            <div class="brand-sub">마인크래프트 스토어</div>
          </div>
        </a>
        <div class="actions">
          <a class="pill" href="/index.html">홈</a>
          <a class="pill primary" href="/login.html" id="loginBtn">로그인</a>
        </div>
      </div>
    </header>
  `;

  let user = null;
  try {
    user = await getUser();
  } catch (e) {
    console.error(e);
  }

  const admin = user ? await isAdmin() : false;

  // ✅ 로그인/관리자 상태에 따라 다시 렌더
  const right = user
    ? `
      <a class="pill" href="/profile.html">프로필</a>
      ${admin ? `<a class="pill" href="/admin.html" id="adminBtn">관리자</a>` : ``}
      <button class="pill danger" id="logoutBtn">로그아웃</button>
    `
    : `
      <a class="pill primary" href="/login.html">로그인</a>
    `;

  mount.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/index.html">
          <span class="brand-badge"></span>
          <div>
            <div class="brand-title">허브 스토어</div>
            <div class="brand-sub">마인크래프트 스토어</div>
          </div>
        </a>
        <div class="actions">
          <a class="pill" href="/index.html">홈</a>
          ${right}
        </div>
      </div>
    </header>
  `;

  document.getElementById("logoutBtn")?.addEventListener("click", signOut);
}

// ✅ 헤더는 DOM 로드 후 무조건 시도 + 로그인 상태 변화도 반영
window.addEventListener("DOMContentLoaded", () => {
  renderTopbar();
});

// ✅ 로그인/로그아웃/토큰 갱신 시에도 헤더 갱신
client.auth.onAuthStateChange(() => {
  renderTopbar();
});
