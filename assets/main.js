// ⚠️ Troque pelo número real da Zenit (formato: 55 + DDD + número, só dígitos)
const WHATSAPP = "5500000000000";

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

// Botão flutuante abre o WhatsApp direto
const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá! Vim pelo site da Zenit e quero saber mais.")}`;
const waFloat = document.querySelector(".wa-float");
waFloat.href = waLink;
waFloat.target = "_blank";
waFloat.rel = "noopener";

// Formulário monta a mensagem e abre o WhatsApp
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

// Animação de entrada
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

document.getElementById("ano").textContent = new Date().getFullYear();
