import { el, escapeHtml, q } from "./supabase.js";
import { getProductById } from "./api.js";

function moneyKRW(n){
  try { return new Intl.NumberFormat("ko-KR").format(Number(n||0)) + "원"; }
  catch { return (n||0) + "원"; }
}

async function main(){
  const id = q("id");
  if (!id) {
    el("wrap").innerHTML = `<div class="muted">잘못된 접근입니다.</div>`;
    return;
  }
  const { product, images } = await getProductById(id);

  const cover = product.thumbnail_url || product.cover_url || images?.[0]?.image_url || "";
  const gallery = images?.slice(0,6) ?? [];

  el("wrap").innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
      <div>
        <div class="thumb" style="height:260px; background-image:url('${escapeHtml(cover)}')"></div>
        <div style="margin-top:10px; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
          ${gallery.map(g=>`<div class="thumb" style="height:86px;background-image:url('${escapeHtml(g.image_url||"")}')"></div>`).join("")}
        </div>
      </div>

      <div>
        <div class="tag">PRODUCT</div>
        <h1 style="margin:10px 0 6px 0;">${escapeHtml(product.title || "")}</h1>
        <div class="sub">${escapeHtml(product.sellers?.name || "")} · ${escapeHtml(product.version || "")}</div>
        <div style="margin-top:10px; font-size:26px; font-weight:900;">${moneyKRW(product.price)}</div>

        <div class="hr"></div>

        <div class="badges">
          ${product.kind ? `<span class="badge">${escapeHtml(product.kind)}</span>` : ``}
          ${product.category_label ? `<span class="badge">${escapeHtml(product.category_label)}</span>` : ``}
        </div>

        <div style="margin-top:12px;color:rgba(234,240,255,.85); font-weight:650; line-height:1.6;">
          ${escapeHtml(product.description || "설명이 없습니다.")}
        </div>

        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn primary" onclick="alert('결제는 다음 단계에서 연결하면 돼요!')">구매하기</button>
          <a class="btn" href="./index.html">목록으로</a>
        </div>
      </div>
    </div>
  `;
}

main().catch(e=>{
  console.error(e);
  alert("오류: " + (e?.message || e));
});
