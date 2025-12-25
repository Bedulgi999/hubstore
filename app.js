// app.js
let banners = [];
let current = 0;
let timer = null;

let categories = [];
let activeCategoryId = null;

function money(n){
  try { return (Number(n)||0).toLocaleString("ko-KR")+"원"; }
  catch { return n+"원"; }
}

function setActiveDot(){
  const dots = window.el("bannerDots");
  [...dots.querySelectorAll(".dotBtn")].forEach((d, i) => {
    d.classList.toggle("active", i === current);
  });
}

function renderBanners(){
  const slide = window.el("bannerSlide");
  const dots = window.el("bannerDots");

  if (!banners.length){
    slide.innerHTML = `
      <div class="bannerItem">
        <div class="bannerBg" style="background-image:linear-gradient(120deg, rgba(107,92,255,.35), rgba(0,0,0,.2));"></div>
        <div class="bannerOverlay"></div>
        <div class="bannerContent">
          <span class="badge">EVENT</span>
          <div class="bannerTitle">배너 없음</div>
          <div class="bannerSub">관리자 페이지에서 배너를 추가해줘</div>
          <a class="bannerBtn" href="/admin.html">관리자에서 추가 →</a>
        </div>
      </div>
    `;
    dots.innerHTML = ``;
    return;
  }

  slide.innerHTML = banners.map(b => `
    <div class="bannerItem">
      <div class="bannerBg" style="background-image:url('${window.escapeHtml(b.image_url || "")}');"></div>
      <div class="bannerOverlay"></div>
      <div class="bannerContent">
        <span class="badge">EVENT</span>
        <div class="bannerTitle">${window.escapeHtml(b.title || "배너")}</div>
        <div class="bannerSub">${window.escapeHtml(b.subtitle || "")}</div>
        ${b.link_url ? `<a class="bannerBtn" href="${window.escapeHtml(b.link_url)}" target="_blank">바로가기 →</a>` : ``}
      </div>
    </div>
  `).join("");

  dots.innerHTML = banners.map((_, i)=>`
    <button class="dotBtn ${i===0?'active':''}" aria-label="배너 ${i+1}" data-i="${i}"></button>
  `).join("");

  dots.querySelectorAll(".dotBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      current = Number(btn.dataset.i);
      applyBannerTransform();
      restartAuto();
    });
  });

  applyBannerTransform();
}

function applyBannerTransform(){
  const slide = window.el("bannerSlide");
  slide.style.transform = `translateX(${-current * 100}%)`;
  setActiveDot();
}

function prev(){
  if (!banners.length) return;
  current = (current - 1 + banners.length) % banners.length;
  applyBannerTransform();
}

function next(){
  if (!banners.length) return;
  current = (current + 1) % banners.length;
  applyBannerTransform();
}

function restartAuto(){
  if (timer) clearInterval(timer);
  timer = setInterval(()=>{
    next();
  }, 4000); // 4초마다
}

// ---- categories UI ----
function renderCategoryButtons(){
  const row = window.el("categoryRow");
  const allBtn = `<button class="filterBtn ${activeCategoryId===null?'active':''}" data-id="">전체</button>`;
  const btns = categories.map(c => `
    <button class="filterBtn ${String(activeCategoryId)===String(c.id)?'active':''}" data-id="${c.id}">
      ${window.escapeHtml(c.name)}
    </button>
  `).join("");

  row.innerHTML = allBtn + btns;

  row.querySelectorAll(".filterBtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.dataset.id;
      activeCategoryId = id ? id : null;
      renderCategoryButtons();
      await loadProducts();
    });
  });
}

// ---- sellers/products ----
function renderSellers(list){
  const grid = window.el("sellerGrid");
  if (!list.length){
    window.el("sellerHint").textContent = "판매자가 아직 없어요. (admin에서 sellers 데이터 넣어줘)";
    grid.innerHTML = "";
    return;
  }
  window.el("sellerHint").textContent = "";

  grid.innerHTML = list.map(s => `
    <div class="pcard">
      <div class="pimg" style="background-image:linear-gradient(120deg, rgba(107,92,255,.25), rgba(0,0,0,.25));"></div>
      <div class="pbody">
        <div class="ptitle">${window.escapeHtml(s.display_name || s.name || "판매자")}</div>
        <div class="pmeta">
          <span>${window.escapeHtml(s.tagline || "공식 상품/이벤트")}</span>
          <span>✓ 인증</span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderProducts(list){
  const grid = window.el("productGrid");
  if (!list.length){
    window.el("productHint").textContent = "상품이 아직 없어요. (admin에서 products 등록해줘)";
    grid.innerHTML = "";
    return;
  }
  window.el("productHint").textContent = "published 상품만 표시";

  grid.innerHTML = list.map(p => `
    <div class="pcard">
      <div class="pimg" style="background-image:url('${window.escapeHtml(p.thumbnail_url || "")}');"></div>
      <div class="pbody">
        <div class="ptitle">${window.escapeHtml(p.title || "상품")}</div>
        <div class="pmeta">
          <span class="price">${money(p.price)}</span>
          <span>${p.category_id ? "카테고리" : ""}</span>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadBanners(){
  try{
    banners = await window.api.getBanners();
    current = 0;
    renderBanners();
    restartAuto();
  }catch(e){
    console.error(e);
    banners = [];
    renderBanners();
  }
}

async function loadCategories(){
  try{
    categories = await window.api.getCategories();
    renderCategoryButtons();
  }catch(e){
    console.error(e);
    categories = [];
    renderCategoryButtons();
  }
}

async function loadSellers(){
  try{
    const list = await window.api.getRecommendedSellers(6);
    renderSellers(list);
  }catch(e){
    console.error(e);
    renderSellers([]);
  }
}

async function loadProducts(){
  try{
    const q = window.el("searchInput").value || "";
    const list = await window.api.getPopularProducts({
      limit: 8,
      categoryId: activeCategoryId,
      q
    });
    renderProducts(list);
  }catch(e){
    console.error(e);
    renderProducts([]);
  }
}

window.addEventListener("DOMContentLoaded", async ()=>{
  // auth UI
  window.initAuthUI();
  await window.renderTopbar();

  // banner controls
  window.el("prevBtn").addEventListener("click", ()=>{ prev(); restartAuto(); });
  window.el("nextBtn").addEventListener("click", ()=>{ next(); restartAuto(); });

  // search
  window.el("searchInput").addEventListener("input", ()=>{
    loadProducts();
  });

  await loadBanners();
  await loadCategories();
  await loadSellers();
  await loadProducts();
});
