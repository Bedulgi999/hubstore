// header.js
import { getUser, isAdmin, isSeller, signOut } from "./supabase.js";

/**
 * ✅ 헤더 렌더링 (index/profile/admin/seller 어디서든 공통 사용)
 * - 로그인 상태에 따라 버튼 변경
 * - 프로필 변경 이벤트(profile:updated) & auth 이벤트(auth:changed) 때 자동 재렌더
 */
export async function renderHeader(mountId = "header") {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const user = await getUser();
  const admin = user ? await isAdmin() : false;
  const seller = user ? await isSeller() : false;

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "사용자";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "";

  const avatarLetter = (displayName?.trim()?.[0] || "U").toUpperCase();

  mount.innerHTML = `
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="./index.html">
          <span class="logo"></span>
          <div>
            <div class="brand-title">허브 스토어</div>
            <div class="brand-sub">마인크래프트 스토어</div>
          </div>
        </a>

        <nav class="nav">
          <a class="nav-pill ghost" href="./index.html">
            <span class="nav-ic">🏠</span><span class="nav-tx">홈</span>
          </a>

          ${seller ? `
            <a class="nav-pill ghost" href="./seller.html" title="판매자 전용">
              <span class="nav-ic">🛒</span><span class="nav-tx">판매자</span>
            </a>
          ` : ""}

          ${admin ? `
            <a class="nav-pill ghost" href="./admin.html">
              <span class="nav-ic">🛠</span><span class="nav-tx">관리자</span>
            </a>
          ` : ""}

          ${
            user
              ? `
                <a class="nav-profile" href="./profile.html" title="프로필">
                  ${
                    avatarUrl
                      ? `<img class="avatar-img" src="${avatarUrl}" alt="avatar" referrerpolicy="no-referrer">`
                      : `<span class="avatar">${avatarLetter}</span>`
                  }
                  <span class="profile-tx">
                    <span class="profile-name">${escapeHtml(displayName)}</span>
                    <span class="profile-sub">
                      ${admin ? `<span class="badge admin">ADMIN</span>` : ""}
                      ${seller ? `<span class="badge seller">SELLER</span>` : ""}
                    </span>
                  </span>
                </a>
                <button class="nav-pill" id="btnLogout" type="button">
                  <span class="nav-ic">🚪</span><span class="nav-tx">로그아웃</span>
                </button>
              `
              : `
                <a class="nav-pill primary" href="./login.html">
                  <span class="nav-ic">🔐</span><span class="nav-tx">로그인</span>
                </a>
              `
          }
        </nav>
      </div>
    </header>
  `;

  // 로그아웃
  const btnLogout = mount.querySelector("#btnLogout");
  if (btnLogout) btnLogout.onclick = () => signOut();
}

/** ✅ 외부에서 profile 업데이트 시 header 실시간 반영용 이벤트 */
export function notifyHeaderRefresh() {
  window.dispatchEvent(new CustomEvent("profile:updated"));
}

/** ✅ XSS 방지용 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ✅ 페이지 어디서든 한 번만 호출하면 자동 갱신되게 */
let mounted = false;
export function mountHeaderAutoRefresh() {
  if (mounted) return;
  mounted = true;

  // 프로필 저장 후 notifyHeaderRefresh() 호출하면 여기서 다시 그림
  window.addEventListener("profile:updated", () => renderHeader());

  // 로그인/로그아웃 흐름에서 이벤트로 다시 그림 (페이지마다 마음대로 호출 가능)
  window.addEventListener("auth:changed", () => renderHeader());
}
