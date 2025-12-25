import { renderTopbar } from "./supabase.js";

const $ = (id) => document.getElementById(id);

const slides = [
  {
    title: "배너1",
    desc: "인기 미니게임 팩 할인!",
    img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1600&q=80",
    link: "#",
  },
  {
    title: "배너2",
    desc: "신규 서버팩 출시",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
    link: "#",
  },
  {
    title: "배너3",
    desc: "RPG 월드/퀘스트 업데이트",
    img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80",
    link: "#",
  },
  {
    title: "배너4",
    desc: "디스코드에서 문의하기",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
    link: "#",
  },
  {
    title: "배너5",
    desc: "추천 판매자 확인!",
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
    link: "#",
  },
];

let idx = 0;
let timer = null;

function renderHero() {
  const hero = $("hero");
  if (!hero) return;

  const slideHtml = slides
    .map(
      (s, i) => `
      <div class="slide ${i === idx ? "active" : ""}" style="background-image:url('${s.img}')"></div>
    `
    )
    .join("");

  const dotsHtml = slides
    .map((_, i) => `<div class="dot ${i === idx ? "active" : ""}" data-i="${i}"></div>`)
    .join("");

  hero.innerHTML = `
    ${slideHtml}
    <button class="hero-nav prev" id="prevBtn" aria-label="prev">‹</button>
    <button class="hero-nav next" id="nextBtn" aria-label="next">›</button>

    <div class="hero-content">
      <span class="badge">EVENT</span>
      <h2>${slides[idx].title}</h2>
      <p>${slides[idx].desc}</p>
      <a class="cta" href="${slides[idx].link}">바로가기 →</a>
    </div>

    <div class="dots" id="dots">${dotsHtml}</div>
  `;

  $("prevBtn").onclick = () => move(-1);
  $("nextBtn").onclick = () => move(1);
  $("dots").querySelectorAll(".dot").forEach((d) => {
    d.onclick = () => {
      idx = Number(d.dataset.i);
      renderHero();
      restartAuto();
    };
  });
}

function move(dir) {
  idx = (idx + dir + slides.length) % slides.length;
  renderHero();
  restartAuto();
}

function startAuto() {
  timer = setInterval(() => move(1), 4500);
}
function restartAuto() {
  clearInterval(timer);
  startAuto();
}

function renderMockLists() {
  // DB 붙이기 전 임시 UI
  const sellers = $("sellers");
  const products = $("products");

  if (sellers) {
    sellers.innerHTML = `
      <div class="list">
        <div class="tile">
          <div class="thumb" style="background-image:url('https://images.unsplash.com/photo-1542751110-97427bbecf23?auto=format&fit=crop&w=900&q=80')"></div>
          <div class="info">
            <div class="title">GodDot Gaming</div>
            <div class="sub">미니게임/서버팩 전문</div>
          </div>
        </div>
        <div class="tile">
          <div class="thumb" style="background-image:url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80')"></div>
          <div class="info">
            <div class="title">MC 관리자</div>
            <div class="sub">공식 상품/이벤트</div>
          </div>
        </div>
      </div>
    `;
  }

  if (products) {
    products.innerHTML = `
      <div class="list">
        <div class="tile">
          <div class="thumb" style="background-image:url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80')"></div>
          <div class="info">
            <div class="title">TNT 러시안룰렛</div>
            <div class="sub">미니게임 · 30,000원</div>
          </div>
        </div>
        <div class="tile">
          <div class="thumb" style="background-image:url('https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=900&q=80')"></div>
          <div class="info">
            <div class="title">RPG 인생역할 서버팩</div>
            <div class="sub">서버팩 · 35,000원</div>
          </div>
        </div>
      </div>
    `;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  // 헤더는 supabase.js가 처리하지만, 혹시 몰라 한 번 더
  renderTopbar();

  renderHero();
  startAuto();
  renderMockLists();
});
