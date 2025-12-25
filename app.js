// app.js
import { getUser, isAdmin, signOut, supabase } from "./supabase.js";
import { fetchBanners, fetchSellers, fetchProducts, fetchCategories } from "./api.js";

const el = (id) => document.getElementById(id);
const esc = (s) =>
  (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function renderHeader({ user, admin }) {
  const header = el("header");
  if (!header) return;

  header.innerHTML = `
    <header class="header">
      <div class="container">
        <div class="inner">
          <a class="brand" href="/index.html">
            <span class="logo"></span>
            <div>
              <div>허브 스토어</div>
              <small>마인크래프트 스토어</small>
            </div>
          </a>

          <nav class="nav">
            <a class="btn ghost" href="/index.html">홈</a>
            ${admin ? `<a class="btn" href="/admin.html">관리자</a>` : ""}
            ${
              user
                ? `<a class="btn primary" href="/profile.html">프로필</a>
                   <button class="btn" id="logoutBtn">로그아웃</button>`
                : `<a class="btn primary" href="/login.html">로그인</a>`
            }
          </nav>
        </div>
      </div>
    </header>
  `;

  if (user) {
    el("logoutBtn")?.addEventListener("click", signOut);
  }
}

/* ---------------- Banner Slider ---------------- */
let slideIndex = 0;
let slideTimer = null;
let slideData = [];

function bannerFallback() {
  // DB에 배너가 0개여도 "빈 배너"가 아니라 5개가 보이도록(처음 사진 느낌 유지)
  return [
    { title: "배너 1", subtitle: "인기 미니게임 팩 할인!", image_url: "", link_url: "#", tag: "EVENT" },
    { title: "배너 2", subtitle: "신규 서버팩 출시", image_url: "", link_url: "#", tag: "EVENT" },
    { title: "배너 3", subtitle: "RPG 콘텐츠 업데이트", image_url: "", link_url: "#", tag: "UPDATE" },
    { title: "배너 4", subtitle: "디스코드 공지 확인!", image_url: "", link_url: "#", tag: "NOTICE" },
    { title: "배너 5", subtitle: "베스트셀러 모음", image_url: "", link_url: "#", tag: "HOT" },
    { title: "배너 6", subtitle: "신규 판매자 모집", image_url: "", link_url: "#", tag: "SELLER" },
  ];
}

function renderBanner(banners) {
  const root = el("banner");
  if (!root) return;

  slideData = (banners?.length ? banners : bannerFallback()).map((b) => ({
    title: b.title ?? b.name ?? "배너",
    subtitle: b.subtitle ?? b.description ?? "",
    image_url: b.image_url ?? b.image ?? "",
    link_url: b.link_url ?? b.link ?? "#",
    tag: b.tag ?? "EVENT",
  }));

  root.className = "card banner";
  root.innerHTML = `
    ${slideData
      .map(
        (b, i) => `
      <div class="slide ${i === 0 ? "active" : ""}" data-i="${i}">
        ${
          b.image_url
            ? `<img src="${esc(b.image_url)}" alt="banner" />`
            : ``
        }
        <div class="overlay"></div>
        <div class="content">
          <span class="tag">${esc(b.tag)}</span>
          <h2>${esc(b.title)}</h2>
          <p>${esc(b.subtitle)}</p>
          <div class="cta">
            <a class="btn primary" href="${esc(b.link_url)}">바로가기 →</a>
            <span class="pill">자동 슬라이드</span>
          </div>
        </div>
      </div>
    `
      )
      .join("")}

    <button class="arrow left" id="banPrev" aria-label="prev">‹</button>
    <button class="arrow right" id="banNext" aria-label="next">›</button>

    <div class="dots" id="banDots">
      ${slideData.map((_, i) => `<div class="dot ${i === 0 ? "active" : ""}" data-i="${i}"></div>`).join("")}
    </div>
  `;

  el("banPrev")?.addEventListener("click", () => moveSlide(-1, true));
  el("banNext")?.addEventListener("click", () => moveSlide(1, true));
  el("banDots")?.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.classList?.contains("dot")) {
      const i = Number(t.dataset.i || 0);
      goSlide(i, true);
    }
  });

  startAutoSlide();
}

function goSlide(i, resetTimer = false) {
  const slides = document.querySelectorAll(".banner .slide");
  const dots = document.querySelectorAll(".banner .dot");
  if (!slides.length) return;

  slideIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("active", idx === slideIndex));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === slideIndex));

  if (resetTimer) startAutoSlide();
}

function moveSlide(dir, resetTimer = false) {
  goSlide(slideIndex + dir, resetTimer);
}

function startAutoSlide() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => moveSlide(1, false), 4000);
}

/* ---------------- Cards ---------------- */
function sellerCard(s) {
  const name = s.name ?? "판매자";
  const desc = s.description ?? "미니게임/서버팩 전문";
  const avatar = s.avatar_url ?? "";
  const verified = !!s.badge_verified;
  const reco = !!s.badge_recommended;

  return `
    <div class="item">
      <div class="thumb">${avatar ? `<img src="${esc(avatar)}" alt="seller">` : ""}</div>
      <div class="body">
        <p class="title">${esc(name)}</p>
        <p class="meta">${esc(desc)}</p>
        <div class="row">
          ${verified ? `<span class="pill">✅ 인증</span>` : ""}
          ${reco ? `<span class="pill">⭐ 추천</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function productCard(p) {
  const title = p.title ?? "상품";
  const price = p.price ?? 0;
  const thumb = p.thumb_url ?? p.image_url ?? "";
  const cat = p.category ?? "기타";

  return `
    <div class="item">
      <div class="thumb">${thumb ? `<img src="${esc(thumb)}" alt="product">` : ""}</div>
      <div class="body">
        <p class="title">${esc(title)}</p>
        <p class="meta">${esc(cat)}</p>
        <div class="row" style="justify-content:space-between">
          <span class="pill">즉시지급</span>
          <span class="price">${Number(price).toLocaleString()}원</span>
        </div>
      </div>
    </div>
  `;
}

function skeletonGrid(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
    <div class="item">
      <div class="thumb"></div>
      <div class="body">
        <div class="notice">불러오는 중…</div>
      </div>
    </div>
  `
    )
    .join("");
}

/* ---------------- Home ---------------- */
export async function loadHome() {
  // 스켈레톤 먼저
  el("sellerGrid").innerHTML = skeletonGrid(8);
  el("productGrid").innerHTML = skeletonGrid(8);

  // 헤더 (로그인 상태 따라 버튼 바뀜)
  const user = await getUser();
  const admin = user ? await isAdmin() : false;
  renderHeader({ user, admin });

  // 로그인 상태 바뀌면 헤더 자동 갱신
  supabase.auth.onAuthStateChange(async () => {
    const u = await getUser();
    const a = u ? await isAdmin() : false;
    renderHeader({ user: u, admin: a });
  });

  // 배너/카테고리/리스트 로딩
  const [banners, categories] = await Promise.all([fetchBanners(), fetchCategories()]);
  renderBanner(banners);

  const filters = el("filters");
  if (filters) {
    filters.innerHTML = categories.map((c, i) => `<button class="btn ${i === 0 ? "primary" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
  }

  let currentCat = "전체";
  let currentQ = "";

  async function reloadProducts() {
    const products = await fetchProducts({ q: currentQ, category: currentCat });
    el("productGrid").innerHTML = products.length ? products.map(productCard).join("") : `<div class="notice">상품이 아직 없어요. (admin에서 products 등록)</div>`;
  }

  // sellers
  const sellers = await fetchSellers(8);
  el("sellerGrid").innerHTML = sellers.length ? sellers.map(sellerCard).join("") : `<div class="notice">판매자가 아직 없어요. (admin에서 sellers 데이터 먼저 넣어줘)</div>`;

  // products
  await reloadProducts();

  // 검색
  el("q")?.addEventListener("input", async (e) => {
    currentQ = e.target.value.trim();
    await reloadProducts();
  });

  // 카테고리 버튼
  filters?.addEventListener("click", async (e) => {
    const t = e.target;
    if (!t?.dataset?.cat) return;
    currentCat = t.dataset.cat;

    // 버튼 UI 업데이트
    [...filters.querySelectorAll("button")].forEach((b) => b.classList.remove("primary"));
    t.classList.add("primary");

    await reloadProducts();
  });
}
