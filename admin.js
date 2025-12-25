// admin.js
function card(title, sub){
  return `
    <div class="pcard">
      <div class="pimg" style="background-image:linear-gradient(120deg, rgba(107,92,255,.25), rgba(0,0,0,.25));"></div>
      <div class="pbody">
        <div class="ptitle">${window.escapeHtml(title)}</div>
        <div class="pmeta"><span>${window.escapeHtml(sub)}</span><span>관리</span></div>
      </div>
    </div>
  `;
}

async function guardAdmin(){
  const user = await window.getUser();
  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "/login.html";
    return false;
  }
  const ok = await window.isAdmin();
  if (!ok) {
    alert("관리자만 접근 가능 (profiles.is_admin=true)");
    window.location.href = "/index.html";
    return false;
  }
  return true;
}

async function loadAdminLists(){
  // categories
  try{
    const cats = await window.api.getCategories();
    const grid = window.el("catGrid");
    grid.innerHTML = cats.map(c=>card(c.name, `sort_order=${c.sort_order ?? ""}`)).join("");
  }catch(e){
    console.error(e);
    window.el("catGrid").innerHTML = "";
  }

  // banners (활성/비활성 포함 보기)
  try{
    const { data, error } = await window.sb()
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;

    const grid = window.el("bannerGrid");
    grid.innerHTML = (data ?? []).map(b=>{
      const t = `${b.title ?? "배너"} ${b.is_active ? "(ON)" : "(OFF)"}`;
      const s = `order=${b.sort_order ?? ""}`;
      return `
        <div class="pcard">
          <div class="pimg" style="background-image:url('${window.escapeHtml(b.image_url || "")}');"></div>
          <div class="pbody">
            <div class="ptitle">${window.escapeHtml(t)}</div>
            <div class="pmeta">
              <span>${window.escapeHtml(s)}</span>
              <span>${b.link_url ? "링크" : ""}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }catch(e){
    console.error(e);
    window.el("bannerGrid").innerHTML = "";
  }
}

window.addEventListener("DOMContentLoaded", async ()=>{
  window.initAuthUI();
  await window.renderTopbar();

  const ok = await guardAdmin();
  if (!ok) return;

  await loadAdminLists();

  // add category
  window.el("addCatBtn").addEventListener("click", async ()=>{
    try{
      const name = window.el("catName").value.trim();
      const sort_order = Number(window.el("catOrder").value || 0);
      if (!name) return alert("카테고리 이름을 입력해줘");

      await window.api.adminAddCategory({ name, sort_order });
      window.el("catMsg").textContent = "카테고리 추가 완료!";
      window.el("catName").value = "";
      window.el("catOrder").value = "";
      await loadAdminLists();
    }catch(e){
      console.error(e);
      window.el("catMsg").textContent = "오류: " + (e?.message || e);
    }
  });

  // add banner
  window.el("addBannerBtn").addEventListener("click", async ()=>{
    try{
      const title = window.el("bTitle").value.trim();
      const subtitle = window.el("bSub").value.trim();
      const image_url = window.el("bImg").value.trim();
      const link_url = window.el("bLink").value.trim();
      const sort_order = Number(window.el("bOrder").value || 0);
      const is_active = !!window.el("bActive").checked;

      if (!title) return alert("배너 제목을 입력해줘");
      if (!image_url) return alert("image_url을 입력해줘");

      await window.api.adminAddBanner({ title, subtitle, image_url, link_url, sort_order, is_active });
      window.el("bannerMsg").textContent = "배너 추가 완료!";
      window.el("bTitle").value = "";
      window.el("bSub").value = "";
      window.el("bImg").value = "";
      window.el("bLink").value = "";
      window.el("bOrder").value = "";
      window.el("bActive").checked = true;
      await loadAdminLists();
    }catch(e){
      console.error(e);
      window.el("bannerMsg").textContent = "오류: " + (e?.message || e);
    }
  });
});
