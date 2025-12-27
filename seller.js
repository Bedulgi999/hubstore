import { attachHeaderAutoRerender } from "./header.js";
import { supabase } from "./supabase.js";

await attachHeaderAutoRerender({ active: "" });

const qs = new URLSearchParams(location.search);
const sellerId = qs.get("seller");

const sellerAvatar = document.getElementById("sellerAvatar");
const sellerTitle = document.getElementById("sellerTitle");
const sellerBio = document.getElementById("sellerBio");
const sellerProducts = document.getElementById("sellerProducts");

function esc(s=""){ return String(s).replace(/[&<>"']/g,(m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }
function money(n){
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("ko-KR") + "원";
}

if (!sellerId) {
  alert("seller id가 없어");
  location.href = "./index.html";
}

const { data: seller, error: sErr } = await supabase
  .from("sellers")
  .select("*")
  .eq("user_id", sellerId)
  .single();

if (sErr) {
  sellerTitle.textContent = "판매자 로딩 실패";
  sellerBio.textContent = sErr.message;
} else {
  sellerTitle.textContent = seller.title || "SELLER";
  sellerBio.textContent = seller.bio || "";
  if (seller.avatar_url) sellerAvatar.src = seller.avatar_url;
}

const { data: products, error: pErr } = await supabase
  .from("products")
  .select("*")
  .eq("seller_id", sellerId)
  .order("created_at", { ascending: false })
  .limit(24);

if (pErr) {
  sellerProducts.innerHTML = `<div class="muted">상품 로딩 실패: ${esc(pErr.message)}</div>`;
} else {
  const list = (products || []).filter(p => p.published !== false);
  if (!list.length) sellerProducts.innerHTML = `<div class="muted">상품이 아직 없어</div>`;
  else sellerProducts.innerHTML = list.map(p => `
    <div class="pcard">
      <div class="pimg">${p.image_url ? `<img src="${esc(p.image_url)}" alt="product"/>` : ""}</div>
      <div class="ptitle">${esc(p.title || "상품")}</div>
      <div class="pmeta">
        <div class="small">${esc(p.category_name || p.category || "")}</div>
        <div class="price">${money(p.price)}</div>
      </div>
    </div>
  `).join("");
}
