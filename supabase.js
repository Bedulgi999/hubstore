// supabase.js (ESM)
export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

// ✅ CDN 로딩 대기 (가끔 여기서 타이밍 이슈로 헤더가 안 바뀜)
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabase?.createClient) return resolve();
    const t = setInterval(() => {
      if (window.supabase?.createClient) {
        clearInterval(t);
        resolve();
      }
    }, 30);
  });
}

await waitForSupabase();

export const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function getUser() {
  // ✅ 항상 최신 세션 기준으로
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

export async function renderTopbar() {
  const mount = document.getElementById("topbar");
  if (!mount) return;

  // 1) 기본 헤더 (로딩 상태)
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
          <a class="pill primary" href="/login.html">로그인</a>
        </div>
      </div>
    </header>
  `;

  // 2) 세션 반영해서 다시 그리기
  const user = await getUser();
  const admin = user ? await isAdmin() : false;

  const right = user
    ? `
      <a class="pill" href="/profile.html">프로필</a>
      ${admin ? `<a class="pill" href="/admin.html">관리자</a>` : ``}
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

// ✅ 1) 페이지 로드될 때 그리기
window.addEventListener("DOMContentLoaded", () => {
  renderTopbar();
});

// ✅ 2) 로그인/로그아웃/토큰 갱신 시 자동 반영 (여기가 핵심)
client.auth.onAuthStateChange((_event) => {
  renderTopbar();
});
