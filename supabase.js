import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://xfbeqkuaxirgubdvczmo.supabase.co";
export const SUPABASE_ANON_KEY = "너의 anon key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 헤더 렌더 (중복 선언 X)
export async function renderHeader() {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  document.getElementById("header").innerHTML = `
    <div class="header">
      <div class="brand">
        <span class="logo"></span>
        <div>
          <strong>허브 스토어</strong>
          <small>마인크래프트 스토어</small>
        </div>
      </div>
      <nav>
        <a href="./index.html">홈</a>
        ${
          user
            ? `<a href="#" id="logout">로그아웃</a>
               <span class="profile">👤 ${user.user_metadata?.name ?? "User"}</span>`
            : `<a href="./login.html" class="primary">로그인</a>`
        }
      </nav>
    </div>
  `;

  if (user) {
    document.getElementById("logout").onclick = async () => {
      await supabase.auth.signOut();
      location.reload();
    };
  }
}
