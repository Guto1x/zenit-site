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
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- Serviços: abre um por vez ---------- */
document.querySelectorAll(".svc__head").forEach((head) => {
  head.addEventListener("click", () => {
    const item = head.parentElement;
    const willOpen = !item.classList.contains("is-open");
    document.querySelectorAll(".svc__item.is-open").forEach((el) => {
      el.classList.remove("is-open");
      el.querySelector(".svc__head").setAttribute("aria-expanded", "false");
    });
    if (willOpen) {
      item.classList.add("is-open");
      head.setAttribute("aria-expanded", "true");
    }
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 650);
  });
});

/* ---------- WhatsApp ---------- */
const waFloat = document.querySelector(".wa-float");
waFloat.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Vim pelo site da ZENIT e quero saber mais.")}`;
waFloat.target = "_blank";
waFloat.rel = "noopener";

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

/* ---------- Manifesto: separa em palavras ---------- */
const manifesto = document.querySelector("[data-words]");
manifesto.innerHTML = manifesto.textContent
  .trim()
  .split(/\s+/)
  .map((w) => `<span class="w">${w}</span>`)
  .join(" ");

/* ---------- Movimento (GSAP), só se permitido ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");
  const ease = "power3.inOut"; // equivalente à curva da marca (.65,0,.35,1)

  // Entrada do hero: lockup acende, título sobe linha por linha
  gsap.timeline({ defaults: { ease } })
    .to(".hero__lockup", { opacity: 1, duration: 0.9 })
    .to(".hero__title .line > span", { y: 0, duration: 0.7, stagger: 0.12 }, "-=0.5")
    .to([".hero__foot", ".hero__scroll"], { opacity: 1, duration: 0.6 }, "-=0.3");

  const mm = gsap.matchMedia();

  // Desktop: hero fixado, o lockup aproxima até a estrela e some; título sobe e escala
  mm.add("(min-width: 981px)", () => {
    gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=90%", scrub: 0.6, pin: ".hero__stage" },
    })
      .to(".hero__lockup", { scale: 3.2, opacity: 0, ease: "none" }, 0)
      .to(".hero__title", { scale: 0.86, y: -40, transformOrigin: "left bottom", ease: "none" }, 0)
      .to(".hero__scroll", { opacity: 0, ease: "none" }, 0);

    // Método: painéis horizontais fixados, linha pontilhada avança
    const track = document.querySelector(".method__track");
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
        onUpdate: (self) => track.style.setProperty("--p", self.progress.toFixed(3)),
      },
    });
    track.style.setProperty("--p", 0);
  });

  // Celular/tablet: linha do método desce conforme a rolagem
  mm.add("(max-width: 980px)", () => {
    const track = document.querySelector(".method__track");
    track.style.setProperty("--p", 0);
    ScrollTrigger.create({
      trigger: track, start: "top 70%", end: "bottom 60%", scrub: true,
      onUpdate: (self) => track.style.setProperty("--p", self.progress.toFixed(3)),
    });
  });

  // Manifesto: palavras acendem
  gsap.to(".manifesto__text .w", {
    color: "#F1F1F1",
    stagger: 0.08,
    ease: "none",
    scrollTrigger: { trigger: ".manifesto", start: "top 75%", end: "bottom 60%", scrub: true },
  });

  // Títulos de seção: escalam ao entrar
  gsap.utils.toArray(".section-title, .contact__title").forEach((t) => {
    gsap.fromTo(t, { scale: 0.88, opacity: 0.2, transformOrigin: "left bottom" }, {
      scale: 1, opacity: 1, ease: "none",
      scrollTrigger: { trigger: t, start: "top 95%", end: "top 55%", scrub: true },
    });
  });

  // Linhas de serviço e itens entram em sequência
  gsap.utils.toArray(".svc__item, .faq__list details, .report__points li, .field").forEach((el) => el.setAttribute("data-rise", ""));
  ScrollTrigger.batch("[data-rise]", {
    start: "top 90%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.6, ease, stagger: 0.07 }),
  });

  // Painel do relatório: barras crescem e números contam
  gsap.from(".panel__bars span", {
    scaleY: 0, duration: 0.7, ease, stagger: 0.06,
    scrollTrigger: { trigger: ".panel", start: "top 75%" },
  });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    el.textContent = "0";
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.4, ease: "power2.out",
      scrollTrigger: { trigger: ".panel", start: "top 75%" },
      onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("pt-BR")),
    });
  });
  gsap.from(".panel", {
    y: 60, rotate: -1.5, duration: 0.9, ease,
    scrollTrigger: { trigger: ".panel", start: "top 85%" },
  });

  // Palavra gigante do rodapé sobe
  gsap.from(".footer__giant img", {
    yPercent: 40, ease: "none",
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}
