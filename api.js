import { supabase } from "./supabase.js";

// ✅ sellers는 "id(판매자ID)" + "user_id(유저ID)" 구조라고 가정

export async function fetchBanners(limit = 10) {
  const { data, error } = await supabase
    .from("banners")
    .select("id,title,description,image_url,seller_id,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRecommendedSellers(limit = 12) {
  const { data, error } = await supabase
    .from("sellers")
    .select("id,user_id,name,avatar_url,is_verified,is_recommended,is_visible,sort_order")
    .eq("is_visible", true)
    .order("is_recommended", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchSellerById(sellerId) {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", sellerId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ✅ 내 seller 레코드 가져오기 (유저ID → sellers row)
export async function fetchMySeller(userId) {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ✅ seller 레코드가 없으면 생성(반드시 user_id 넣기!)
export async function ensureMySeller(userId) {
  const existing = await fetchMySeller(userId);
  if (existing?.id) return existing;

  const { data, error } = await supabase
    .from("sellers")
    .insert({ user_id: userId, name: "판매자", bio: "" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProducts({ q = "", category = "전체", limit = 24 } = {}) {
  let query = supabase
    .from("products")
    .select("id,title,price,category,image_url,seller_id,is_published,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category && category !== "전체") query = query.eq("category", category);
  if (q && q.trim()) query = query.ilike("title", `%${q.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ✅ 내 상품: products.seller_id는 sellers.id (판매자ID)로 보는 게 맞음
export async function fetchMyProductsBySellerId(sellerId) {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price,category,image_url,is_published,created_at")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ✅ seller 업데이트도 user_id 기준으로
export async function updateMySeller(userId, payload) {
  // 존재 보장
  await ensureMySeller(userId);

  const { error } = await supabase
    .from("sellers")
    .update(payload)
    .eq("user_id", userId);
  if (error) throw error;

  return await fetchMySeller(userId);
}

export async function updateProfile(userId, payload) {
  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw error;
}
