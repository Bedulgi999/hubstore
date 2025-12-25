import { supabase } from "./supabase.js";

const $ = (id) => document.getElementById(id);

function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
}
function money(n){ return Number(n||0).toLocaleString("ko-KR"); }

let allProducts = [];
let currentCategory = "전체";
let categoryNames = ["전체"];

async function fetchCategories(){
  const { data, error } = await supabase
    .from("categories")
    .select("name, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending:true });

  if (error || !data) return ["전체","미니게임","서버팩"];
  const names = data.map(x=>x.name);
  if (!names.includes("전체")) names.unshift("전체");
  return names;
}

function renderCategoryButtons(){
  const wrap = $("categoryButtons");
  if (!wrap) return;
  wrap.innerHTML = categoryNames.map(name=>{
    const active = (name===currentCategory) ? "primary" : "";
    return `<button class="btn ${active}" data-cat="${esc(name)}">${esc(name)}</button>`;
  }).join("");

  wrap.querySelectorAll("button[data-cat]").forEach(btn=>{
    btn.onclick = ()=>{
      currentCategory = btn.dataset.cat || "전체";
      renderCategoryButtons();
      applyFilter();
    };
  });
}

async function fetchSellers(){
  const { data, error } = await supabase
    .from("sellers")
    .select("id,name,bio,avatar_url,badge_recommended,is_verified")
    .order("badge_recommended", { ascending:false })
    .limit(6);
  if (error) return [];
  return data || [];
}

async function fetchProducts(){
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price_krw,version,tags,thumbnail_url,created_at,is_published")
    .eq("is_published", true)
    .order("created_at", { ascending:false })
    .limit(24);
  if (error) return [];
  return data || [];
}

function renderSellers(list){
  const el = $("sellerGrid");
  if (!el) return;

  if (!list.length){
    el.innerHTML = `<div class="muted">판매자가 아직 없어요. (admin에서 sellers 데이터 넣기)</div>`;
    return;
  }

  el.innerHTML = list.map(s=>`
    <div class="card seller-card">
      <div class="seller-avatar">
        <img src="${esc(s.avatar_url || "https://picsum.photos/200?blur=2")}" alt="">
      </div>
      <div class="seller-info">
        <div class="seller-name">${esc(s.name||"판매자")}</div>
        <div class="seller-bio">${esc(s.bio||"")}</div>
        <div class="seller-badges">
          ${s.is_verified ? `<span class="badge ok">인증</span>`:""}
          ${s.badge_recommended ? `<span class="badge star">추천</span>`:""}
        </div>
      </div>
    </div>
  `).join("");
}

function renderProducts(list){
  const el = $("productGrid");
  if (!el) return;

  if (!list.length){
    el.innerHTML = `<div class="muted">상품이 아직 없어요. (admin에서 products 등록)</div>`;
    return;
  }

  el.innerHTML = list.map(p=>`
    <a class="card product-card" href="./product.html?id=${encodeURIComponent(p.id)}">
      <div class="product-thumb">
        <img src="${esc(p.thumbnail_url || "https://picsum.photos/600/360?blur=2")}" alt="">
      </div>
      <div class="product-body">
        <div class="product-title">${esc(p.title||"상품")}</div>
        <div class="product-meta">
          ${p.version ? `<span class="pill">${esc(p.version)}</span>`:""}
          ${(p.tags||[]).slice(0,2).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}
        </div>
        <div class="product-price">${money(p.price_krw)}원</div>
      </div>
    </a>
  `).join("");
}

function applyFilter(){
  const q = ($("q")?.value || "").trim().toLowerCase();
  let list = allProducts.slice();

  if (currentCategory !== "전체"){
    list = list.filter(p => (p.tags||[]).includes(currentCategory));
  }
  if (q){
    list = list.filter(p => (p.title||"").toLowerCase().includes(q));
  }
  renderProducts(list);
}

export async function initHome(){
  categoryNames = await fetchCategories();
  currentCategory = categoryNames.includes("전체") ? "전체" : (categoryNames[0]||"전체");
  renderCategoryButtons();

  const sellers = await fetchSellers();
  renderSellers(sellers);

  allProducts = await fetchProducts();
  applyFilter();

  $("q")?.addEventListener("input", applyFilter);
}
