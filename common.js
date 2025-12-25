const sb = () => window.supabase;

window.getSessionUser = async () => {
  const { data } = await sb().auth.getSession();
  return data.session?.user ?? null;
};

window.signOut = async () => {
  await sb().auth.signOut();
  location.href = "/index.html";
};

window.requireLogin = async () => {
  const user = await window.getSessionUser();
  if (!user) location.href = "/login.html";
  return user;
};

window.isAdmin = async () => {
  const user = await window.getSessionUser();
  if (!user) return false;
  const { data, error } = await sb()
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (error) return false;
  return !!data?.is_admin;
};

window.requireAdmin = async () => {
  const ok = await window.isAdmin();
  if (!ok) {
    alert("관리자만 접근 가능 (profiles.is_admin=true 필요)");
    location.href = "/login.html";
  }
};

window.q = (key) => new URL(location.href).searchParams.get(key);
window.el = (id) => document.getElementById(id);

window.escapeHtml = (s) =>
  (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

window.uploadImage = async (file, folder) => {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb().storage.from("public-images").upload(path, file, {
    upsert: false,
    contentType: file.type || "image/*",
  });
  if (error) throw error;

  const { data } = sb().storage.from("public-images").getPublicUrl(path);
  return data.publicUrl;
};

window.renderTopbar = async () => {
  const user = await window.getSessionUser();
  const top = document.getElementById("topbar");
  if (!top) return;

  top.innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="/index.html">허브 스토어</a>
      <div class="top-actions">
        <a class="btn" href="/admin.html">관리자</a>
        ${
          user
            ? `<span class="muted">${window.escapeHtml(user.email || "")}</span>
               <button class="btn" id="logoutBtn">로그아웃</button>`
            : `<a class="btn" href="/login.html">로그인</a>`
        }
      </div>
    </div>
  `;

  if (user) document.getElementById("logoutBtn")?.addEventListener("click", window.signOut);
};

window.addEventListener("DOMContentLoaded", window.renderTopbar);
