// header.js
import { getUser, isAdmin, signOut, bindAuthListenerOnce } from "/supabase.js";

function shortName(user) {
  const raw =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  return String(raw).slice(0, 10);
}

export async function renderHeader() {
  const header = document.getElementById("header");
  if (!header) return;

  const user = await getUser();
  const admin = user ? await isAdmin() : false;
  const name = user ? shortName(user) : "";

  header.innerHTML = `
    <div class="header">
      <a class="brand" href="/index.html">
        <span class="logo"></span>
        <div class="brand-text">
          <div class="brand-title">허브 스토어</div>
          <div class="brand-sub">마인크래프트 스토어</div>
        </div>
      </a>

      <nav class="nav">
        <a class="nav-pill" href="/index.html">
          <span class="nav-ic">🏠</span>
          <span class="nav-tx">홈</span>
        </a>

        ${
          admin
            ? `<a class="nav-pill ghost" href="/admin.html">관리자</a>`
            : ""
        }

        ${
          user
            ? `
              <a class="nav-profile" href="/profile.html">
                <span class="avatar">${name[0] ?? "🙂"}</span>
                <span class="profile-tx">
                  <span class="profile-name">${name}</span>
                  <span class="profile-sub">프로필</span>
                </span>
              </a>
              <button class="nav-pill ghost" id="btnLogout">로그아웃</button>
            `
            : `
              <a class="nav-pill primary" href="/login.html">
                <span class="nav-ic">🔐</span>
                <span class="nav-tx">로그인</span>
              </a>
            `
        }
      </nav>
    </div>
  `;

  document.getElementById("btnLogout")?.addEventListener("click", signOut);
}

/* ===== 페이지 최초 1회만 바인딩 ===== */
export function initHeader() {
  renderHeader();
  bindAuthListenerOnce(renderHeader);
}
