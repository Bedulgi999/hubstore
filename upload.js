import { supabase } from "./supabase.js";
import { requireAdmin } from "./auth.js";

const $ = (id) => document.getElementById(id);

async function uploadToPublicImages(file, folder) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("public-images")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "image/*",
    });

  if (error) throw error;

  const { data } = supabase.storage.from("public-images").getPublicUrl(path);
  return data.publicUrl;
}

async function createBanner({ title, subtitle, imageUrl, linkUrl, sortOrder }) {
  const { error } = await supabase.from("banners").insert({
    title,
    subtitle,
    image_url: imageUrl,
    link_url: linkUrl || "./index.html",
    sort_order: Number(sortOrder) || 1,
    is_active: true,
  });
  if (error) throw error;
}

async function createProduct({ sellerId, title, description, priceKrw, version, tags, thumbUrl }) {
  const { error } = await supabase.from("products").insert({
    seller_id: sellerId,
    title,
    description,
    price_krw: Number(priceKrw) || 0,
    version,
    tags: (tags || "").split(",").map(t => t.trim()).filter(Boolean),
    thumbnail_url: thumbUrl,
    is_published: true,
  });
  if (error) throw error;
}

async function loadSellersSelect() {
  const { data, error } = await supabase
    .from("sellers")
    .select("id,name")
    .limit(50);

  if (error) {
    console.warn(error);
    return;
  }

  const sel = $("sellerSelect");
  sel.innerHTML = data.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
}

function setMsg(text) {
  $("msg").textContent = text;
}

window.addEventListener("DOMContentLoaded", async () => {
  await requireAdmin();

  await loadSellersSelect();

  // 배너 업로드 + 등록
  $("bannerBtn").addEventListener("click", async () => {
    try {
      const file = $("bannerFile").files?.[0];
      if (!file) return alert("배너 이미지를 선택해줘.");

      setMsg("배너 업로드 중...");

      const imageUrl = await uploadToPublicImages(file, "banners");

      await createBanner({
        title: $("bannerTitle").value.trim(),
        subtitle: $("bannerSub").value.trim(),
        imageUrl,
        linkUrl: $("bannerLink").value.trim(),
        sortOrder: $("bannerOrder").value.trim(),
      });

      setMsg("✅ 배너 등록 완료!");
      $("bannerFile").value = "";
    } catch (e) {
      console.error(e);
      setMsg("❌ 실패: " + (e?.message || e));
    }
  });

  // 상품 썸네일 업로드 + 상품 등록
  $("productBtn").addEventListener("click", async () => {
    try {
      const file = $("productFile").files?.[0];
      if (!file) return alert("상품 썸네일 이미지를 선택해줘.");

      setMsg("상품 썸네일 업로드 중...");

      const thumbUrl = await uploadToPublicImages(file, "products");

      await createProduct({
        sellerId: $("sellerSelect").value,
        title: $("productTitle").value.trim(),
        description: $("productDesc").value.trim(),
        priceKrw: $("productPrice").value.trim(),
        version: $("productVersion").value.trim(),
        tags: $("productTags").value.trim(),
        thumbUrl,
      });

      setMsg("✅ 상품 등록 완료!");
      $("productFile").value = "";
    } catch (e) {
      console.error(e);
      setMsg("❌ 실패: " + (e?.message || e));
    }
  });
});
