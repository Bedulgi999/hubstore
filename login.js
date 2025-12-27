import { renderHeader } from "./header.js";
import { supabase, getUser } from "./supabase.js";

await renderHeader();

// 이미 로그인 상태면 홈으로
const u = await getUser();
if (u) location.href = "./index.html";

// OAuth redirect 처리(세션 URL 처리)
supabase.auth.onAuthStateChange(async (event) => {
  if (event === "SIGNED_IN") location.href = "./index.html";
});

const redirectTo = location.origin + "/index.html";

document.getElementById("btnGoogle").onclick = () =>
  supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });

document.getElementById("btnDiscord").onclick = () =>
  supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });

document.getElementById("btnKakao").onclick = () =>
  supabase.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo } });
