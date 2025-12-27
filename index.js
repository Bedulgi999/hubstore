import { renderHeader } from "./header.js";
import { fetchBanners, fetchRecommendedSellers, fetchCategories, fetchProducts } from "./api.js";

await renderHeader();

const bannerCard = document.getElementById("bannerCard");
const bannerBg = document.getElementById("bannerBg");
const bannerTitle = document.getElementById("bannerTitle");
const bannerDesc = document.getElementById("bannerDesc");
const bannerDots = document.getElementById("bannerDots");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const chipsEl = document.getElementById("chips");
const searchInput = document.getElementById("searchInput");
const productsEl = document.getElementById("products");

const esc = (s="") => String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

let banners = [];
let bIdx = 0;
let timer = null;

function paintBanner(i){
  if (!banners.length) return;
  bIdx = (i + banners.length) % banners.length;
  const b = banners[bIdx];

  bannerTitle.textContent = b.title || `배너 ${bIdx+1}`;
  bannerDesc.textContent = b.description || "";
  bannerBg.style.backgroundImage = `url("${b.image_url}")`;

  bannerDots.innerHTML = banners.map((_,k)=>`
    <div class="dot ${k===bIdx?'active':''}" data-i="${k}"></div>
  `).join("");

  bannerCard.onclick = () => {
    if (b.seller_id) location.href = `./seller.html?id=${encodeURIComponent(b.seller_id)}`;
  };
}

function startAuto(){
  stopAuto();
  timer = setInterval(()=> paintBanner(bIdx+1), 4500);
}
function stopAuto(){
  if (timer) clearInterval(timer);
  timer = null;
}

prevBtn.onclick = (e)=>{ e.stopPropagation(); paintBanner(bIdx-1); startAuto(); };
nextBtn.onclick = (e)=>{ e.stopPropagation(); paintBanner(bIdx+1); startAuto(); };
bannerDots.addEventListener("click",(e)=>{
  const d = e.target.closest(".dot");
  if(!d) return;
  paintBanner(Number(d.dataset.i));
  startAuto();
  e.stopPropagation();
});

let currentCategory = "전체";
let categoryNames = ["전체"];

async function renderCategories(){
  chipsEl.innerHTML = categoryNames.map(name=>`
    <button class="chip ${name===currentCategory?'active':''}" data-name="${esc(name)}" type="button">${esc(name)}</button>
  `).join("");
}

chipsEl.addEventListener("click", async (e)=>{
  const btn = e.target.closest(".chip");
  if(!btn) return;
  currentCategory = btn.dataset.name;
  await renderCategories();
  await renderProducts();
});

async function renderProducts(){
  const q = searchInput.value || "";
  const list = await fetchProducts({ q, category: currentCategory, limit: 24 });
  if(!list.length){
    productsEl.innerHTML = `<div class="notice">조건에 맞는 상품이 없어</div>`;
    return;
  }
  productsEl.innerHTML = list.map(p=>`
    <div class="card product">
      <div class="thumb"><img src="${p.image_url || "https://placehold.co/800x500?text=Product"}" alt="${esc(p.title)}"></div>
      <div class="title">${esc(p.title)}</div>
      <div class="meta">
        <span>${esc(p.category || "기타")}</span>
        <span>${Number(p.price||0).toLocaleString()}원</span>
      </div>
    </div>
  `).join("");
}

searchInput.addEventListener("input", async ()=>{ await renderProducts(); });

async function boot(){
  // banners
  banners = await fetchBanners(10);
  if(!banners.length){
    bannerTitle.textContent = "배너가 없어";
    bannerDesc.textContent = "관리자 페이지에서 배너를 추가해줘";
    bannerBg.style.backgroundImage = "";
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
  }else{
    paintBanner(0);
    startAuto();
  }

  // sellers
  const sellerList = document.getElementById("sellerList");
  const sellers = await fetchRecommendedSellers(12);
  sellerList.innerHTML = sellers.map(s=>`
    <div class="seller-avatar" data-id="${s.id}">
      <div class="pic"><img src="${s.avatar_url || "https://placehold.co/200x200?text=%F0%9F%91%A4"}" alt="${esc(s.name||"판매자")}"></div>
      <div class="nm">${esc(s.name||"판매자")}</div>
    </div>
  `).join("");
  sellerList.addEventListener("click",(e)=>{
    const item = e.target.closest(".seller-avatar");
    if(!item) return;
    location.href = `./seller.html?id=${encodeURIComponent(item.dataset.id)}`;
  });

  // categories
  const cats = await fetchCategories();
  categoryNames = ["전체", ...cats.map(c=>c.name).filter(n=>n && n!=="전체")];
  await renderCategories();

  // products
  await renderProducts();
}

boot().catch(err=>{
  console.error(err);
  alert("로딩 오류: " + (err?.message ?? err));
});
