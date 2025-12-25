import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYmVxa3VheGlyZ3ViZHZjem1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxMjAsImV4cCI6MjA4MjI0MDEyMH0.KQpw28WJE1QWO6jfv_nzkNhVg1xCLuNv66xBRHefpA4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

function shortName(user) {
  const raw = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || "User";
  return String(raw).trim().slice(0, 10);
}

export async function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const user = await getUser();
  const name = user ? shortName(user) : "";

  header.innerHTML = `
    <div class="header">
      <a class="brand" href="./index.html">
        <span class="logo"></span>
        <div class="brand-text">
          <div class="brand-title">허브 스토어</div>
          <div class="brand-sub">마인크래프트 스토어</div>
        </div>
      </a>

      <nav class="nav">
        <a class="nav-pill" href="./index.html" aria-label="홈">
          <span class="nav-ic">🏠</span>
          <span class="nav-tx">홈</span>
        </a>

        ${
          user
            ? `
              <a class="nav-profile" href="./profile.html" id="btnProfile" aria-label="프로필">
                <span class="avatar">${name[0] ?? "🙂"}</span>
                <span class="profile-tx">
                  <span class="profile-name">${name}</span>
                  <span class="profile-sub">프로필</span>
                </span>
              </a>
              <button class="nav-pill ghost" id="btnLogout" type="button" aria-label="로그아웃">
                <span class="nav-ic">⎋</span>
                <span class="nav-tx">로그아웃</span>
              </button>
            `
            : `
              <a class="nav-pill primary" href="./login.html" id="btnLogin" aria-label="로그인">
                <span class="nav-ic">🔐</span>
                <span class="nav-tx">로그인</span>
              </a>
            `
        }
      </nav>
    </div>
  `;

  if (user) {
    document.getElementById("btnLogout")?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.href = "./index.html";
    });
  }

  // 로그인/로그아웃 이벤트가 오면 헤더 재렌더
  supabase.auth.onAuthStateChange(async () => {
    const header2 = document.getElementById("header");
    if (!header2) return;
    header2.querySelector(".nav")?.classList.add("pulse");
    await new Promise(r => setTimeout(r, 120));
    await renderHeader();
  });
}
