import { renderHeader } from "./header.js";
import { requireLogin, requireSeller, supabase } from "./supabase.js";
import { ensureMySeller, fetchMySeller, updateMySeller, fetchMyProductsBySellerId } from "./api.js";
import { uploadImageForUser } from "./uploader.js";

await renderHeader();
const user = await requireLogin();
const ok = await requireSeller();
if (!ok) throw new Error("not seller");

// UI
const sellerName = document.getElementById("sellerName");
const sellerBio = document.getElementById("sellerBio");
const sellerMsg = document.getElementById("sellerMsg");
const sellerAvatarFile = document.getElementById("sellerAvatarFile");
const sellerCoverFile = document.getElementById("sellerCoverFile");

const pTitle = document.getElementById("pTitle");
const pPrice = document.getElementById("pPrice");
const pCategory = document.getElementById("pCategory");
const pDesc = document.getElementById("pDesc");
const pFile = document.getElementById("pFile");
const pMsg = document.getElementById("pMsg");
const myProducts = document.getElementById("myProducts");

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

// ✅ sellers row를 먼저 “반드시” 생성 (user_id 넣어서)
let mySeller = await ensureMySeller(user.id); // {id(판매자ID), user_id(유저ID), ...}

async function loadSeller() {
  mySeller = await fetchMySeller(user.id);
  if (mySeller) {
    sellerName.value = mySeller.name || "";
    sellerBio.value = mySeller.bio || "";
  }
}

async function loadMyProducts() {
  // ✅ products.seller_id = sellers.id 사용
  const list = await fetchMyProductsBySellerId(mySeller.id);
  myProducts.innerHTML = `
    <tr><th>ID</th><th>제목</th><th>카테고리</th><th>가격</th><th>게시</th><th></th></tr>
    ${list.map(p=>`
      <tr>
        <td>${p.id}</td>
        <td style="font-weight:900;">${escapeHtml(p.title)}</td>
        <td class="muted" style="font-weight:800;">${escapeHtml(p.category||"")}</td>
        <td>${Number(p.price||0).toLocaleString()}원</td>
        <td>${p.is_published ? "ON" : "OFF"}</td>
        <td class="row">
          <button class="btn small" data-toggle="${p.id}">게시 토글</button>
          <button class="btn small" data-del="${p.id}">삭제</button>
        </td>
      </tr>
    `).join("")}
  `;
}

async function saveSeller(payload) {
  sellerMsg.textContent = "저장중...";
  mySeller = await updateMySeller(user.id, payload);
  sellerMsg.textContent = "저장 완료";
}

document.getElementById("btnUploadSellerAvatar").onclick = async () => {
  const f = sellerAvatarFile.files?.[0];
  if (!f) return alert("파일 선택");
  try {
    sellerMsg.textContent = "업로드중...";
    const url = await uploadImageForUser(f, user.id, "seller_avatars");
    await saveSeller({ avatar_url: url });
  } catch (e) {
    console.error(e);
    alert(e?.message ?? e);
  }
};

document.getElementById("btnUploadSellerCover").onclick = async () => {
  const f = sellerCoverFile.files?.[0];
  if (!f) return alert("파일 선택");
  try {
    sellerMsg.textContent = "업로드중...";
    const url = await uploadImageForUser(f, user.id, "seller_covers");
    await saveSeller({ cover_url: url });
  } catch (e) {
    console.error(e);
    alert(e?.message ?? e);
  }
};

document.getElementById("btnSaveSeller").onclick = async () => {
  try {
    await saveSeller({
      name: sellerName.value.trim() || "판매자",
      bio: sellerBio.value.trim() || "",
    });
  } catch (e) {
    console.error(e);
    alert(e?.message ?? e);
  }
};

// ===== Products =====
document.getElementById("btnAddProduct").onclick = async () => {
  const title = pTitle.value.trim();
  if (!title) return alert("제목 입력");

  const price = Number(pPrice.value || 0);
  const category = pCategory.value.trim() || null;
  const description = pDesc.value.trim() || "";

  try {
    pMsg.textContent = "이미지 업로드...";
    let image_url = null;
    const f = pFile.files?.[0];
    if (f) image_url = await uploadImageForUser(f, user.id, "products");

    pMsg.textContent = "저장중...";
    // ✅ products.seller_id = mySeller.id
    const { error } = await supabase.from("products").insert({
      seller_id: mySeller.id,
      title,
      price,
      category,
      description,
      image_url,
      is_published: true,
    });
    if (error) throw error;

    pMsg.textContent = "등록 완료";
    pTitle.value = "";
    pPrice.value = "0";
    pCategory.value = "";
    pDesc.value = "";
    pFile.value = "";
    await loadMyProducts();
  } catch (e) {
    console.error(e);
    pMsg.textContent = "실패";
    alert(e?.message ?? e);
  }
};

myProducts.addEventListener("click", async (e) => {
  const toggleId = e.target.closest("[data-toggle]")?.dataset.toggle;
  const delId = e.target.closest("[data-del]")?.dataset.del;

  try {
    if (toggleId) {
      const { data, error } = await supabase
        .from("products")
        .select("id,is_published")
        .eq("id", toggleId)
        .single();
      if (error) throw error;

      const { error: upErr } = await supabase
        .from("products")
        .update({ is_published: !data.is_published })
        .eq("id", toggleId);
      if (upErr) throw upErr;

      await loadMyProducts();
    }

    if (delId) {
      if (!confirm("삭제할까?")) return;
      const { error } = await supabase.from("products").delete().eq("id", delId);
      if (error) throw error;
      await loadMyProducts();
    }
  } catch (err) {
    console.error(err);
    alert(err?.message ?? err);
  }
});

(async () => {
  await loadSeller();
  await loadMyProducts();
})().catch((e) => {
  console.error(e);
  alert(e?.message ?? e);
});
