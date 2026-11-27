/* Céu da ZENIT — leia BRAND.md antes de mudar.
   O topo é um céu de estrelas desenhado no navegador. Ao abrir, parte das estrelas
   converge e forma o lockup (a forma vem do próprio SVG oficial da página, nas cores
   dele) e então dá lugar ao arquivo oficial, nítido. Depois o céu só respira:
   o mouse afasta as estrelas próximas e um toque solta um pulso de sonar. */
(() => {
  const root = document.documentElement;
  const done = () => root.classList.add("sky-done");
  const stage = document.querySelector(".hero__stage");
  const canvas = document.querySelector(".hero__sky-canvas");
  const svgEl = document.querySelector(".hero__svg");
  if (!stage || !canvas || !svgEl || !canvas.getContext) return done();

  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const INK = "241,241,241";
  const GOLD = "222,186,126";

  let W = 0, H = 0, small = false;
  let stars = [], form = [], pulses = [];
  let phase = "assembling"; // assembling → reveal → done
  let t0 = 0, revealAt = 0, endAt = 0;
  let raf = 0, onScreen = true;
  const pointer = { x: -1e4, y: -1e4, on: false };

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Tamanho e estrelas de fundo ---------- */
  function size() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    small = W < 760;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function makeStars() {
    const n = Math.max(260, Math.min(small ? 420 : 1000, Math.round((W * H) / 1500)));
    stars = Array.from({ length: n }, () => {
      const big = Math.random() < 0.07;
      return {
        nx: Math.random(),
        ny: Math.pow(Math.random(), 1.25), // mais estrelas no alto do céu
        r: big ? rand(1.3, 1.9) : rand(0.5, 1.1),
        a: big ? rand(0.6, 0.95) : rand(0.18, 0.7),
        gold: Math.random() < 0.08,
        sp: rand(0.5, 1.6),
        ph: rand(0, Math.PI * 2),
        ox: 0, oy: 0,
      };
    });
  }

  /* ---------- Alvos: pontos tirados do próprio SVG oficial ---------- */
  function sampleLockup() {
    return new Promise((resolve) => {
      const s = stage.getBoundingClientRect();
      const r = svgEl.getBoundingClientRect();
      if (!r.width) return resolve(null);
      const clone = svgEl.cloneNode(true);
      clone.querySelectorAll(".glow").forEach((n) => n.remove()); // o brilho fica com o arquivo, não vira partícula
      clone.removeAttribute("class");
      clone.setAttribute("width", r.width);
      clone.setAttribute("height", r.height);
      const img = new Image();
      img.onload = () => {
        try {
          const k = 2; // amostra em 2x para não perder os anéis finos
          const c = document.createElement("canvas");
          c.width = Math.round(r.width * k);
          c.height = Math.round(r.height * k);
          const g = c.getContext("2d");
          g.drawImage(img, 0, 0, c.width, c.height);
          const d = g.getImageData(0, 0, c.width, c.height).data;
          const cand = [];
          let sum = 0;
          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const i = (y * c.width + x) * 4;
              const a = d[i + 3];
              if (a < 22) continue;
              const w = Math.pow(a / 255, 0.55); // anéis finos e apagados também ganham pontos
              sum += w;
              cand.push(x, y, a, d[i], d[i + 1], d[i + 2], w);
            }
          }
          const want = small ? 1100 : 2600;
          const pts = [];
          for (let j = 0; j < cand.length; j += 7) {
            if (Math.random() < (want * cand[j + 6]) / sum) {
              pts.push({
                // posição relativa ao próprio logo (0–1), relida a cada quadro: o layout pode mudar depois
                u: cand[j] / c.width,
                v: cand[j + 1] / c.height,
                x: r.left - s.left + cand[j] / k,
                y: r.top - s.top + cand[j + 1] / k,
                a: Math.max(0.35, cand[j + 2] / 255),
                c: `${cand[j + 3]},${cand[j + 4]},${cand[j + 5]}`,
              });
            }
          }
          // Ponto da estrela do zênite: a montagem se espalha a partir dela, como um sonar
          const vb = svgEl.viewBox.baseVal;
          resolve({ pts, zx: r.left - s.left + (404 / vb.width) * r.width, zy: r.top - s.top + (130 / vb.height) * r.height });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }

  function makeForm({ pts, zx, zy }) {
    let maxD = 1;
    pts.forEach((p) => (maxD = Math.max(maxD, Math.hypot(p.x - zx, p.y - zy))));
    form = pts.map((p) => {
      // começam como estrelas espalhadas pelo céu visível e se organizam a partir da estrela do zênite
      const delay = (Math.hypot(p.x - zx, p.y - zy) / maxD) * 450 + rand(0, 200);
      return {
        sx: rand(0.03, 0.97) * W,
        sy: Math.pow(Math.random(), 1.2) * H * 0.92,
        u: p.u, v: p.v, a: p.a, c: p.c,
        d: delay, dur: rand(900, 1250),
        curve: rand(-60, 60),
      };
    });
    endAt = Math.max(...form.map((p) => p.d + p.dur));
  }

  /* ---------- Fim da montagem: entra o logo oficial ---------- */
  function reveal(now, quick) {
    if (phase !== "assembling") return;
    phase = "reveal";
    revealAt = now;
    if (quick) form.forEach((p) => (p.d = 0, p.dur = 1));
    done(); // o CSS mostra o SVG oficial, os serviços e o botão
  }
  const skip = () => reveal(performance.now(), true);

  /* ---------- Quadro ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    // estrelas de fundo (duas passadas de cor, poucas trocas de estilo)
    for (const pass of [INK, GOLD]) {
      ctx.fillStyle = `rgb(${pass})`;
      for (const s of stars) {
        if ((pass === GOLD) !== s.gold) continue;
        const bx = s.nx * W, by = s.ny * H;
        let tx = 0, ty = 0;
        if (pointer.on) {
          const dx = bx - pointer.x, dy = by - pointer.y, dd = Math.hypot(dx, dy);
          if (dd < 120 && dd > 0.1) {
            const push = Math.pow(1 - dd / 120, 2) * 26;
            tx = (dx / dd) * push; ty = (dy / dd) * push;
          }
        }
        s.ox += (tx - s.ox) * 0.08;
        s.oy += (ty - s.oy) * 0.08;
        ctx.globalAlpha = s.a * (0.62 + 0.38 * Math.sin(t * s.sp + s.ph));
        ctx.fillRect(bx + s.ox - s.r / 2, by + s.oy - s.r / 2, s.r, s.r);
      }
    }

    // partículas da montagem
    if (form.length) {
      const el = now - t0;
      const sr = stage.getBoundingClientRect(), lr = svgEl.getBoundingClientRect();
      const ox = lr.left - sr.left, oy = lr.top - sr.top, lw = lr.width, lh = lr.height;
      const fade = phase === "reveal" ? 1 - clamp01((now - revealAt) / 520) : 1;
      for (const p of form) {
        const k = clamp01((el - p.d) / p.dur);
        const e = easeOutExpo(k);
        const bend = Math.sin(k * Math.PI) * p.curve;
        const tx = ox + p.u * lw, ty = oy + p.v * lh;
        const x = p.sx + (tx - p.sx) * e + bend;
        const y = p.sy + (ty - p.sy) * e;
        ctx.globalAlpha = p.a * (0.45 + 0.55 * e) * fade;
        ctx.fillStyle = `rgb(${p.c})`;
        ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }
      if (phase === "assembling" && el > endAt) reveal(now, false);
      if (phase === "reveal" && fade <= 0) { form = []; phase = "done"; }
    }

    // pulsos de sonar: meios-círculos, como os do logo, um sim um não pontilhado
    if (pulses.length) {
      ctx.strokeStyle = `rgb(${GOLD})`;
      ctx.lineWidth = 1;
      pulses = pulses.filter((p) => now - p.t < 1600);
      for (const p of pulses) {
        for (let i = 0; i < 3; i++) {
          const age = (now - p.t - i * 150) / 1150;
          if (age <= 0 || age >= 1) continue;
          ctx.globalAlpha = (1 - age) * 0.6;
          ctx.setLineDash(i % 2 ? [1.2, 5] : []);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10 + easeOutExpo(age) * 150, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }

  function play() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  /* ---------- Reduzir movimento: céu parado, logo direto ---------- */
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = `rgb(${s.gold ? GOLD : INK})`;
      ctx.globalAlpha = s.a * 0.8;
      ctx.fillRect(s.nx * W - s.r / 2, s.ny * H - s.r / 2, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  size();
  makeStars();

  if (reduce) {
    done();
    drawStatic();
    new ResizeObserver(() => { size(); drawStatic(); }).observe(stage);
    return;
  }

  // Interação
  const local = (e) => { const b = stage.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  if (finePointer) {
    stage.addEventListener("pointermove", (e) => { const p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.on = true; });
    stage.addEventListener("pointerleave", () => (pointer.on = false));
  }
  stage.addEventListener("pointerdown", (e) => {
    const p = local(e);
    pulses.push({ x: p.x, y: p.y, t: performance.now() });
    if (pulses.length > 4) pulses.shift();
  });

  // Quem rola, clica ou usa o teclado durante a montagem não espera por ela
  ["wheel", "touchmove", "keydown"].forEach((ev) => addEventListener(ev, skip, { once: true, passive: true }));

  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; onScreen ? play() : stop(); }).observe(stage);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
  // O canvas acompanha o tamanho real do topo (ele muda quando a rolagem fixada se instala)
  new ResizeObserver(() => {
    if (stage.clientWidth !== W || stage.clientHeight !== H) size();
  }).observe(stage);

  // Espera as fontes e o layout assentarem, mede o logo e começa
  const start = async () => {
    const data = await sampleLockup();
    if (!data || !data.pts.length) { done(); phase = "done"; play(); return; }
    makeForm(data);
    t0 = performance.now();
    play();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start));
  // Rede de segurança: o logo nunca fica escondido
  setTimeout(() => { if (phase === "assembling") skip(); }, 4500);
})();
