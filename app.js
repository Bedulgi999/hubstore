// app.js
import { renderHeader } from "./header.js";
import { fetchBanners, fetchCategories, fetchTopSellers, fetchPopularProducts } from "./api.js";

await renderHeader("home");

const els = {
  label: document.getElementById("bannerLabel"),
  title: document.getElementById("bannerTitle"),
  sub: document.getElementById("bannerSub"),
  cta: document.getElementById("bannerCta"),
  img: document.getElementById("bannerImg"),
  skel: document.getElementById("bannerSkeleton"),
  dots: document.getElementById("bannerDots"),
  prev: document.getElementById("btnPrev"),
  next: document.getElementById("btnNext"),
  chips: document.getElementById("chips"),
  q: document.getElementById("q"),
  sellerGrid: document.getElementById("sellerGrid"),
  productGrid: document.getElementById("productGrid"),
};

let banners = [];
let bannerIndex = 0;
let bannerTimer = null;

function setBanner(i) {
  if (!banners.length) return;
  bannerIndex = (i + banners.length) % banners.length;
  const b = banners[bannerIndex];

  els.label.textContent = b.label || "EVENT";
  els.title.textContent = b.title || "배너";
  els.sub.textContent = b.subtitle || "";
  els.cta.textContent = b.cta_text || "바로가기 →";
  els.cta.href = b.cta_url || "#";

  if (b.image_url) {
    els.img.src = b.image_url;
    els.img.style.display = "block";
    els.skel.style.display = "none";
  } else {
    els.img.style.display = "none";
    els.skel.style.display = "block";
  }

  // dots
  els.dots.innerHTML = "";
  banners.forEach((_, idx) => {
    const d = document.createElement("button");
    d.className = "dot" + (idx === bannerIndex ? " active" : "");
    d.type = "button";
    d.onclick = () => { setBanner(idx); restartAuto(); };
    els.dots.appendChild(d);
  });
}

function restartAuto() {
  if (bannerTimer) clearInterval(bannerTimer);
  bannerTimer = setInterval(() => setBanner(bannerIndex + 1), 4500);
}

els.prev.onclick = () => { setBanner(bannerIndex - 1); restartAuto(); };
els.next.onclick = () => { setBanner(bannerIndex + 1); restartAuto(); };

async function loadBanners() {
  try {
    banners = await fetchBanners();
    if (!banners.length) {
      banners = [{
        label: "EVENT",
        title: "배너가 아직 없어요",
        subtitle: "관리자에서 배너를 추가해줘",
        cta_text: "관리자 →",
        cta_url: "/admin.html",
        image_url: null
      }];
    }
    setBanner(0);
    restartAuto();
  } catch (e) {
    console.error("banners load error:", e);
    els.title.textContent = "배너 로딩 실패";
    els.sub.textContent = "Supabase 연결/정책을 확인해줘";
  }
}

function sellerCard(s) {
  const p = s.profiles || {};
  const name = p.display_name || "Seller";
  const bio = s.bio || "";
  const cover = s.cover_image_url;

  const badges = [];
  if (s.badge_verified) badges.push(`<span class="badge ok">✅ 인증</span>`);
  if (s.badge_recommended) badges.push(`<span class="badge star">⭐ 추천</span>`);

  return `
    <div class="card item">
      <div class="thumb">
        ${cover ? `<img src="${cover}" alt="cover" />` : ``}
      </div>
      <div class="title">${escapeHtml(name)}</div>
      <div class="sub">${escapeHtml(bio)}</div>
      <div class="badges">${badges.join("")}</div>
    </div>
  `;
}

function productCard(p) {
  const img = p.image_url;
  const price = (p.price ?? null);
  const priceText = price === null ? "가격 미정" : `${Number(price).toLocaleString()}원`;

  return `
    <div class="card item">
      <div class="thumb">
        ${img ? `<img src="${img}" alt="product" />` : ``}
      </div>
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="sub">${escapeHtml(p.subtitle || p.category || "")}</div>
      <div class="badges">
        <span class="badge">${escapeHtml(p.category || "전체")}</span>
        <span class="badge ok">${priceText}</span>
      </div>
    </div>
  `;
}

async function loadSellers() {
  try {
    const sellers = await fetchTopSellers(6);
    if (!sellers.length) {
      els.sellerGrid.innerHTML = `<div class="empty muted">셀러가 아직 없어요. (관리자에서 셀러 지정/설정)</div>`;
      return;
    }
    els.sellerGrid.innerHTML = sellers.map(sellerCard).join("");
  } catch (e) {
    console.error("sellers load error:", e);
    els.sellerGrid.innerHTML = `<div class="empty muted">셀러 로딩 실패</div>`;
  }
}

let allProducts = [];
async function loadProducts() {
  try {
    allProducts = await fetchPopularProducts(12);
    renderProducts(allProducts);
  } catch (e) {
    console.error("products load error:", e);
    els.productGrid.innerHTML = `<div class="empty muted">상품 로딩 실패</div>`;
  }
}

function renderProducts(list) {
  if (!list.length) {
    els.productGrid.innerHTML = `<div class="empty muted">상품이 아직 없어요. (관리자에서 published 상품 등록)</div>`;
    return;
  }
  els.productGrid.innerHTML = list.map(productCard).join("");
}

function applyFilter() {
  const q = (els.q.value || "").trim().toLowerCase();
  const activeChip = els.chips.querySelector(".chip.active");
  const cat = activeChip?.dataset?.cat || "전체";

  const filtered = allProducts.filter(p => {
    const text = `${p.title} ${p.subtitle || ""} ${p.category || ""}`.toLowerCase();
    const okQ = !q || text.includes(q);
    const okCat = (cat === "전체") || (p.category === cat);
    return okQ && okCat;
  });

  renderProducts(filtered);
}

async function loadCategories() {
  try {
    const cats = await fetchCategories();
    els.chips.innerHTML = "";
    const list = cats.length ? cats : [{ name: "전체" }];

    list.forEach((c, idx) => {
      const b = document.createElement("button");
      b.className = "chip" + (idx === 0 ? " active" : "");
      b.type = "button";
      b.textContent = c.name;
      b.dataset.cat = c.name;
      b.onclick = () => {
        els.chips.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        applyFilter();
      };
      els.chips.appendChild(b);
    });
  } catch (e) {
    console.error("categories load error:", e);
    els.chips.innerHTML = `<button class="chip active" type="button" data-cat="전체">전체</button>`;
  }
}

els.q.addEventListener("input", applyFilter);

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[m]));
}

await loadBanners();
await loadCategories();
await loadSellers();
await loadProducts();
