import "./header.js";
import { supabase, getUser } from "./supabase.js";

/**
 * 이 profile.js는 "기능 유지" 전제:
 * - 표시 이름 저장 (profiles.display_name)
 * - 아바타 업로드 (Storage + profiles.avatar_url)
 * - 출석 보상 (claim_daily_checkin RPC)
 * - 포인트 지급/내역 (points_balance / points_ledger or view 등 너 프로젝트 구조에 맞춤)
 *
 * ⚠️ 테이블/뷰 이름이 다르면, 아래 "loadPoints" / "loadLedger" 부분만 네 DB에 맞춰 바꾸면 됨.
 */

const $ = (id) => document.getElementById(id);

const el = {
  heroAvatar: $("heroAvatar"),
  heroAvatarTxt: $("heroAvatarTxt"),
  heroAvatarImg: $("heroAvatarImg"),
  uuidText: $("uuidText"),

  displayName: $("displayName"),
  avatarFile: $("avatarFile"),
  saveHint: $("saveHint"),

  btnSaveName: $("btnSaveName"),
  btnUploadAvatar: $("btnUploadAvatar"),
  btnCheckin: $("btnCheckin"),
  btnRefreshPoints: $("btnRefreshPoints"),

  pointsValue: $("pointsValue"),
  pointsLog: $("pointsLog"),
};

let currentUser = null;

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}
function initials(name = "U") {
  const t = (name || "").trim();
  return t ? t[0].toUpperCase() : "U";
}

async function ensureLogin() {
  currentUser = await getUser();
  if (!currentUser) {
    location.href = "./login.html";
    return false;
  }
  return true;
}

/** profiles row 가져오기 */
async function getMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** profiles upsert */
async function upsertProfile(patch) {
  const payload = { id: currentUser.id, ...patch };
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

/** UI 반영 */
function applyHero(profile) {
  const name = profile?.display_name || currentUser?.email || "USER";
  const avatar = profile?.avatar_url || "";

  el.heroAvatarTxt.textContent = initials(name);
  el.uuidText.textContent = `UUID: ${currentUser.id}`;

  if (avatar) {
    el.heroAvatarImg.src = avatar;
    el.heroAvatarImg.style.display = "block";
    el.heroAvatarTxt.style.display = "none";
  } else {
    el.heroAvatarImg.removeAttribute("src");
    el.heroAvatarImg.style.display = "none";
    el.heroAvatarTxt.style.display = "grid";
  }
}

/** 표시 이름 저장 */
async function saveName() {
  const name = (el.displayName.value || "").trim();
  if (!name) return alert("표시 이름을 입력해줘.");

  el.saveHint.textContent = "저장 중...";
  try {
    await upsertProfile({ display_name: name });
    el.saveHint.textContent = "저장 완료!";
    // header.js는 profile 업데이트 이벤트를 듣도록 만들었으니,
    // profile 페이지에서도 즉시 헤더가 새로 렌더됨.
    window.dispatchEvent(new CustomEvent("hub_profile_updated"));
  } catch (e) {
    console.error(e);
    el.saveHint.textContent = "저장 실패";
    alert(e.message || "저장 실패");
  }
}

/** 아바타 업로드 */
async function uploadAvatar() {
  const file = el.avatarFile.files?.[0];
  if (!file) return alert("이미지 파일을 선택해줘.");

  // 파일명 충돌 방지
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `avatars/${currentUser.id}/${Date.now()}.${ext}`;

  el.btnUploadAvatar.disabled = true;
  el.btnUploadAvatar.textContent = "업로드 중...";
  try {
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/png",
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub?.publicUrl;
    if (!url) throw new Error("public url 생성 실패");

    await upsertProfile({ avatar_url: url });

    // 즉시 화면 반영
    const prof = await getMyProfile();
    applyHero(prof);

    window.dispatchEvent(new CustomEvent("hub_profile_updated"));
    alert("프로필 이미지가 변경됐어!");
  } catch (e) {
    console.error(e);
    alert(e.message || "업로드 실패");
  } finally {
    el.btnUploadAvatar.disabled = false;
    el.btnUploadAvatar.textContent = "이미지 업로드";
  }
}

/** 출석 보상 */
async function claimCheckin() {
  el.btnCheckin.disabled = true;
  try {
    const { data, error } = await supabase.rpc("claim_daily_checkin", { reward: 100 });
    if (error) throw error;

    if (data === "ALREADY_CLAIMED") alert("오늘은 이미 출석 보상을 받았어!");
    else alert("출석 완료! +100P");

    await refreshPoints();
  } catch (e) {
    console.error(e);
    alert(e.message || "출석 보상 실패");
  } finally {
    el.btnCheckin.disabled = false;
  }
}

/**
 * ✅ 포인트 로딩
 * 너 DB 구조가 다양해서 2단계로 안전하게 처리:
 * 1) profiles.points 있으면 그걸 사용
 * 2) 없으면 points_balance 뷰/테이블(id=user_id, points) 시도
 */
async function loadPointsBalance() {
  // 1) profiles.points 시도
  {
    const { data, error } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!error && data && typeof data.points === "number") return data.points;
  }

  // 2) points_balance 시도
  {
    const { data, error } = await supabase
      .from("points_balance")
      .select("points")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (!error && data && typeof data.points === "number") return data.points;
  }

  return 0;
}

/** 최근 20개 내역 */
async function loadLedger() {
  // 기본: points_ledger (user_id, amount, reason, created_at)
  const { data, error } = await supabase
    .from("points_ledger")
    .select("id, amount, reason, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // 없으면 그냥 빈 UI
    console.warn("[points_ledger] not available:", error.message);
    return [];
  }
  return data || [];
}

function renderLedger(list) {
  if (!list.length) {
    el.pointsLog.innerHTML = `<div class="muted">아직 포인트 내역이 없어</div>`;
    return;
  }

  el.pointsLog.innerHTML = list.map((row) => {
    const amt = Number(row.amount || 0);
    const sign = amt > 0 ? "+" : "";
    const when = row.created_at ? new Date(row.created_at) : null;
    const date = when ? when.toLocaleString() : "";
    const reason = row.reason || "";
    return `
      <div class="p-row">
        <div class="p-left">
          <div class="p-reason">${esc(reason)}</div>
          <div class="p-date">${esc(date)}</div>
        </div>
        <div class="p-amt ${amt >= 0 ? "plus" : "minus"}">${sign}${amt}</div>
      </div>
    `;
  }).join("");
}

async function refreshPoints() {
  el.pointsValue.textContent = "0";
  el.pointsLog.innerHTML = `<div class="muted">포인트 내역을 불러오는 중...</div>`;

  const balance = await loadPointsBalance();
  el.pointsValue.textContent = String(balance);

  const ledger = await loadLedger();
  renderLedger(ledger);
}

async function boot() {
  if (!(await ensureLogin())) return;

  // profile 로드
  const profile = await getMyProfile();
  const name = profile?.display_name || "";
  el.displayName.value = name;

  applyHero(profile);
  await refreshPoints();

  // 이벤트
  el.btnSaveName.addEventListener("click", saveName);
  el.btnUploadAvatar.addEventListener("click", uploadAvatar);
  el.btnCheckin.addEventListener("click", claimCheckin);
  el.btnRefreshPoints.addEventListener("click", refreshPoints);

  // 프로필 변경 이벤트(다른 탭/헤더에서도 반영)
  window.addEventListener("hub_profile_updated", async () => {
    try {
      const p = await getMyProfile();
      applyHero(p);
    } catch {}
  });

  // Supabase auth change
  supabase.auth.onAuthStateChange(async () => {
    currentUser = await getUser();
    if (!currentUser) location.href = "./login.html";
  });
}

boot().catch((e) => {
  console.error(e);
  alert(e.message || "프로필 로딩 실패");
});
