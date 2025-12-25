// api.js
import { supabase } from "./supabase.js";

export async function fetchBanners() {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchSellers(limit = 8) {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .order("badge_recommended", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function fetchProducts({ q = "", category = "" } = {}) {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (q) query = query.ilike("title", `%${q}%`);
  if (category && category !== "전체") query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function fetchCategories() {
  // categories 테이블이 있으면 그걸 쓰는 게 정석이지만,
  // 없을 때를 위해 products.category에서 뽑는 방식으로 처리
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_published", true);

  if (error) return ["전체"];

  const set = new Set(["전체"]);
  (data ?? []).forEach((r) => r.category && set.add(r.category));
  return [...set];
}
