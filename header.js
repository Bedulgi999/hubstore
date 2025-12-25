// header.js
import { getUser, isAdmin, signOut, onAuthChange } from "/supabase.js";

export async function renderHeader() {
  const host = document.getElementById("header");
  if (!host) return;

  const user = await getUser();
  const admin = user ? await isAdmin() : false;

  host.innerHTML = `
    <header class="header">
      <div class="container">
        <div class="header-inner">
          <a class="brand" href="/index.html">
            <span class="brand-dot"></span>
            <div class="brand-text">
              <div class="brand-title">허브 스토어</div>
              <div class="brand-sub">마인크래프트 스토어</div>
            </div>
          </a>

          <nav class="nav">
            <a class="btn ghost" href="/index.html">홈</a>
            ${admin ? `<a class="btn" href="/admin.html">관리자</a>` : ``}

            ${
              user
                ? `
                  <a class="btn primary" href="/profile.html">프로필</a>
                  <button class="btn" id="btnLogout" type="button">로그아웃</button>
                `
                : `<a class="btn primary" href="/login.html">로그인</a>`
            }
          </nav>
        </div>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) logoutBtn.addEventListener("click", signOut);
}

// ✅ 로그인/로그아웃/토큰 갱신 시 자동으로 헤더 재렌더
export function enableHeaderAutoRefresh() {
  onAuthChange(async () => {
    await renderHeader();
  });
}
