import { supabase } from "./supabase.js";

function esc(s=""){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function fallbackBanners(){
  return [
    { title:"배너1", subtitle:"인기 미니게임 팩 할인!", cta_text:"바로가기 →", image_url:"https://picsum.photos/1200/600?random=11" },
    { title:"배너2", subtitle:"신규 서버팩 출시", cta_text:"바로가기 →", image_url:"https://picsum.photos/1200/600?random=12" },
    { title:"배너3", subtitle:"이벤트 진행중", cta_text:"바로가기 →", image_url:"https://picsum.photos/1200/600?random=13" },
    { title:"배너4", subtitle:"추천 판매자 모음", cta_text:"바로가기 →", image_url:"https://picsum.photos/1200/600?random=14" },
    { title:"배너5", subtitle:"베스트 상품 확인", cta_text:"바로가기 →", image_url:"https://picsum.photos/1200/600?random=15" },
  ];
}

async function fetchBanners(){
  const { data, error } = await supabase
    .from("banners")
    .select("title,subtitle,image_url,cta_text,cta_url,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  if (error) return fallbackBanners();
  if (!data || data.length === 0) return fallbackBanners();
  return data;
}

export async function initBannerSlider(){
  const mount = document.getElementById("banner-slider");
  if (!mount) return;

  mount.innerHTML = `
    <div class="hs-skeleton">
      <div class="hs-skel-img"></div>
      <div class="hs-skel-text"></div>
    </div>
  `;

  const banners = await fetchBanners();
  const n = banners.length;

  mount.innerHTML = `
    <div class="hs-slider" id="hs">
      <div class="hs-track" id="hsTrack">
        ${banners.map(b=>`
          <a class="hs-slide" href="${esc(b.cta_url||"#")}" ${b.cta_url ? "" : 'onclick="return false"'}>
            <img class="hs-slide-img" src="${esc(b.image_url)}" alt="">
            <div class="hs-slide-overlay"></div>
            <div class="hs-slide-content">
              <div class="hs-chip">EVENT</div>
              <div class="hs-title">${esc(b.title||"배너")}</div>
              <div class="hs-sub">${esc(b.subtitle||"")}</div>
              <div class="hs-cta">${esc(b.cta_text||"바로가기 →")}</div>
            </div>
          </a>
        `).join("")}
      </div>

      <button class="hs-nav prev" id="hsPrev" type="button">‹</button>
      <button class="hs-nav next" id="hsNext" type="button">›</button>

      <div class="hs-dots" id="hsDots">
        ${banners.map((_,i)=>`<button class="hs-dot ${i===0?'active':''}" data-i="${i}" type="button"></button>`).join("")}
      </div>
    </div>
  `;

  const track = document.getElementById("hsTrack");
  const prevBtn = document.getElementById("hsPrev");
  const nextBtn = document.getElementById("hsNext");
  const dots = Array.from(document.querySelectorAll("#hsDots .hs-dot"));
  const hs = document.getElementById("hs");

  let idx = 0;
  let timer = null;

  function render(){
    track.style.transform = `translateX(${-idx*100}%)`;
    dots.forEach((d,i)=>d.classList.toggle("active", i===idx));
  }
  function go(i){ idx = (i + n) % n; render(); }
  function next(){ go(idx+1); }
  function prev(){ go(idx-1); }

  prevBtn.onclick = (e)=>{ e.preventDefault(); prev(); restart(); };
  nextBtn.onclick = (e)=>{ e.preventDefault(); next(); restart(); };
  dots.forEach(d=>d.onclick = ()=>{ go(Number(d.dataset.i||0)); restart(); });

  function start(){ stop(); timer = setInterval(next, 4500); }
  function stop(){ if (timer) clearInterval(timer); timer=null; }
  function restart(){ start(); }

  hs.addEventListener("mouseenter", stop);
  hs.addEventListener("mouseleave", start);

  // swipe
  let sx=0;
  hs.addEventListener("touchstart", (e)=>{ sx=e.touches[0].clientX; stop(); }, {passive:true});
  hs.addEventListener("touchend", (e)=>{
    const ex=e.changedTouches[0].clientX;
    const dx=ex-sx;
    if (Math.abs(dx)>40) dx<0?next():prev();
    start();
  }, {passive:true});

  render();
  start();
}
