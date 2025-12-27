// admin_points.js
import { supabase, getUser, isAdmin } from "./supabase.js";

async function mustBeAdmin() {
  const user = await getUser();
  if (!user) {
    location.href = "./login.html";
    return null;
  }
  const ok = await isAdmin();
  if (!ok) {
    alert("관리자만 접근 가능해.");
    location.href = "./index.html";
    return null;
  }
  return user;
}

function byId(id) {
  return document.getElementById(id);
}

function setMsg(el, text) {
  if (!el) return;
  el.textContent = text || "";
}

async function bindGrantPoints() {
  const btn = byId("btnGrantPoints");
  const msg = byId("grantMsg");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    setMsg(msg, "처리중...");
    btn.disabled = true;

    const target_user = (byId("grantTargetUuid")?.value || "").trim();
    const amount = Number(byId("grantAmount")?.value || 0);
    const reason = (byId("grantReason")?.value || "").trim() || "admin_grant";

    if (!target_user) {
      setMsg(msg, "대상 UUID를 입력해줘.");
      btn.disabled = false;
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      setMsg(msg, "amount는 0이 아니어야 해.");
      btn.disabled = false;
      return;
    }

    // ✅ 관리자만 실행 가능: DB에서 profiles.is_admin 검증
    const { error } = await supabase.rpc("admin_grant_points", {
      target_user,
      amount,
      reason,
    });

    if (error) setMsg(msg, "실패: " + error.message);
    else setMsg(msg, "완료! 포인트가 반영됐어.");

    btn.disabled = false;
  });
}

(async function init() {
  const user = await mustBeAdmin();
  if (!user) return;

  await bindGrantPoints();
})();
