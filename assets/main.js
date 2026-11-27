// ⚠️ Troque pelo número real da ZENIT (55 + DDD + número, só dígitos)
const WHATSAPP = "5500000000000";

/* ---------- Navegação ---------- */
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav__links a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);
// Esc fecha o menu e devolve o foco ao botão
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
});
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- Marca viva: marca os anéis do sonar e o brilho da estrela ---------- */
const svg = document.querySelector(".hero__svg");
svg.querySelectorAll("g[clip-path] > path").forEach((ring) => {
  ring.classList.add("ring");
  ring.style.setProperty("--o", ring.getAttribute("stroke-opacity") || "0.3");
});
svg.querySelectorAll('circle[fill^="url(#ldglow"], circle[fill^="url(#ldcore"]').forEach((c) => c.classList.add("glow"));
// Pausa o sonar quando o topo sai da tela (ninguém vê, não precisa redesenhar)
const heroEl = document.querySelector(".hero");
new IntersectionObserver(([en]) => heroEl.classList.toggle("is-offscreen", !en.isIntersecting)).observe(heroEl);

/* ---------- WhatsApp ---------- */
const waFloat = document.querySelector(".wa-float");
waFloat.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Vim pelo site da ZENIT e quero saber mais.")}`;
waFloat.target = "_blank";
waFloat.rel = "noopener";
// O botão flutuante some onde já existe um caminho de contato na tela (topo e contato/rodapé)
const waHideZones = new Set();
const waIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => (en.isIntersecting ? waHideZones.add(en.target) : waHideZones.delete(en.target)));
  waFloat.classList.toggle("is-hidden", waHideZones.size > 0);
}, { threshold: 0.15 });
document.querySelectorAll(".hero, .contact, .footer").forEach((el) => waIO.observe(el));

document.getElementById("form-contato").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const msg = [
    `Olá! Meu nome é ${d.nome}${d.empresa ? `, da ${d.empresa}` : ""}.`,
    `Tenho interesse em: ${d.servico}.`,
    d.mensagem ? `\n${d.mensagem}` : "",
  ].join("\n");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- Movimento (GSAP), só se permitido ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");

  const mm = gsap.matchMedia();

  // A entrada da marca é o céu se organizando (assets/sky.js)

  // Desktop: hero fixado. A marca aproxima até a estrela (cresce) e dá lugar ao título
  mm.add("(min-width: 981px)", () => {
    gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=120%", scrub: 0.7, pin: ".hero__stage" },
    })
      .fromTo(".hero__below", { opacity: 1, y: 0 }, { opacity: 0, y: 30, duration: 0.25, ease: "none", immediateRender: false }, 0)
      .fromTo(".hero__sky-canvas", { scale: 1 }, { scale: 1.25, duration: 1, ease: "none", immediateRender: false }, 0)
      .to(".hero__lockup", { scale: 2.6, y: "8vh", duration: 0.7, ease: "none" }, 0)
      .to(".hero__lockup", { opacity: 0, duration: 0.3, ease: "none" }, 0.4)
      .to(".hero__title .line > span", { y: 0, duration: 0.35, stagger: 0.1, ease: "power2.out" }, 0.45)
      .to(".hero__foot", { opacity: 1, duration: 0.25, ease: "none" }, 0.8);

    // Método: painéis horizontais fixados, linha pontilhada avança
    const track = document.querySelector(".method__track");
    const setLine = gsap.quickSetter(".method__line span", "scaleX");
    setLine(0);
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: ".method",
        start: "top top",
        end: () => "+=" + dist(),
        pin: ".method__pin",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => setLine(self.progress),
      },
    });
    return () => gsap.set(".method__line span", { clearProps: "transform" });
  });

  // Celular: título sobe linha por linha ao carregar
  mm.add("(max-width: 980px)", () => {
    gsap.from(".hero__title .line > span", { yPercent: 105, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.15 });
  });

  // Celular/tablet: linha do método desce conforme a rolagem
  mm.add("(max-width: 980px)", () => {
    const setLine = gsap.quickSetter(".method__line span", "scaleY");
    setLine(0);
    ScrollTrigger.create({
      trigger: ".method__track", start: "top 70%", end: "bottom 60%", scrub: true,
      onUpdate: (self) => setLine(self.progress),
    });
    return () => gsap.set(".method__line span", { clearProps: "transform" });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}
