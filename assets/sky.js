/* Céu da ZENIT — leia BRAND.md antes de mudar.

   Abertura, em uma cena só (~4 s, pulável):
   1. Céu de estrelas desenhado no navegador.
   2. A constelação de Sagitário (estrelas reais, posições do céu) se desenha atrás do logo,
      com as linhas pontilhadas da marca, o arco e a flecha. A figura está girada para a
      flecha mirar o zênite.
   3. A flecha dispara até a estrela do zênite; a constelação explode e os mesmos pontos
      formam o lockup (forma tirada do próprio SVG oficial da página, nas cores dele).
   4. O arquivo oficial entra nítido. Depois o céu só respira: o mouse afasta estrelas
      e um toque solta um pulso de sonar. */
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
  const LIGHT = "243,221,176"; // dourado-luz da estrela da marca

  // Linha do tempo da abertura (ms desde o início)
  const T = { draw: 250, fire: 1950, explode: 2280, burst: 300 };

  let W = 0, H = 0, small = false;
  let stars = [], form = [], pulses = [], cons = null;
  let phase = "intro"; // intro → reveal → done
  let t0 = 0, revealAt = 0, endAt = 0;
  let raf = 0, onScreen = true;
  const pointer = { x: -1e4, y: -1e4, on: false };

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Sagitário ----------
     Estrelas principais (J2000): RA em horas, Dec em graus, magnitude. Projeção simples em
     torno de RA 18h45m / Dec -27°, norte para cima, leste à esquerda (como se vê no céu). */
  const SGR = {
    gam: [18.0967, -30.42, 3.0], del: [18.35, -29.83, 2.7], eps: [18.4028, -34.38, 1.8],
    lam: [18.4661, -25.42, 2.8], phi: [18.7608, -26.99, 3.2], sig: [18.9211, -26.3, 2.0],
    tau: [19.1156, -27.67, 3.3], zet: [19.0436, -29.88, 2.6], eta: [18.2939, -36.76, 3.1],
    mu: [18.2294, -21.06, 3.8], xi: [18.9622, -21.11, 3.5], omi: [19.0781, -21.74, 3.8],
    pi: [19.1628, -21.02, 2.9], rho: [19.3611, -17.85, 3.9],
  };
  // Linhas: a "chaleira" e as extensões do arqueiro
  const SGR_LINES = [
    ["gam", "del"], ["gam", "eps"], ["del", "eps"], ["eps", "zet"], ["zet", "phi"], ["phi", "del"],
    ["del", "lam"], ["lam", "phi"], ["phi", "sig"], ["sig", "tau"], ["tau", "zet"], ["zet", "sig"],
    ["lam", "mu"], ["sig", "xi"], ["xi", "omi"], ["omi", "pi"], ["pi", "rho"], ["eps", "eta"],
  ];

  // Monta a figura em coordenadas do logo (u,v = fração da largura/altura do SVG)
  function buildConstellation() {
    const aspect = 808 / 659.75;
    const proj = (k) => {
      const [ra, dec] = SGR[k];
      return [-(ra * 15 - 281.25) * 0.891, -(dec + 27)];
    };
    const P = {};
    Object.keys(SGR).forEach((k) => (P[k] = proj(k)));
    // flecha: do "nock" (φ) passando pelo arco (δ) até a ponta, além de γ (Alnasl, "a ponta da flecha")
    const tipRaw = [P.gam[0] + (P.gam[0] - P.del[0]) * 0.35, P.gam[1] + (P.gam[1] - P.del[1]) * 0.35];
    // gira a figura para a flecha apontar para cima (o zênite)
    const dir = Math.atan2(P.gam[1] - P.del[1], P.gam[0] - P.del[0]);
    const th = -Math.PI / 2 - dir, c = Math.cos(th), s = Math.sin(th);
    const rot = ([x, y]) => [x * c - y * s, x * s + y * c];
    const tip = rot(tipRaw);
    const S = 0.0425; // unidades do céu → fração da altura do logo
    const ZV = 130 / 659.75; // a estrela do zênite no lockup
    const toUV = (xy) => {
      const [x, y] = rot(xy);
      return [0.5 + ((x - tip[0]) * S) / aspect, ZV + 0.27 + (y - tip[1]) * S];
    };
    const star = {};
    Object.keys(SGR).forEach((k) => (star[k] = { uv: toUV(P[k]), mag: SGR[k][2] }));
    const uv = (k) => star[k].uv;

    // caminhos (cada um é uma lista de pontos uv), na ordem em que serão desenhados
    const paths = SGR_LINES.map(([a, b]) => [uv(a), uv(b)]);
    // o arco: curva de λ a ε, abaulada para o lado da ponta da flecha
    const bow = [];
    const bl = P.lam, be = P.eps;
    const mid = [(bl[0] + be[0]) / 2, (bl[1] + be[1]) / 2];
    const ax = P.gam[0] - P.del[0], ay = P.gam[1] - P.del[1], an = Math.hypot(ax, ay);
    const ctrl = [mid[0] + (ax / an) * 3.6, mid[1] + (ay / an) * 3.6];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, mt = 1 - t;
      bow.push(toUV([mt * mt * bl[0] + 2 * mt * t * ctrl[0] + t * t * be[0], mt * mt * bl[1] + 2 * mt * t * ctrl[1] + t * t * be[1]]));
    }
    paths.push(bow);
    // a flecha e a ponta
    const tipUV = toUV(tipRaw);
    const back = toUV([P.phi[0] - ax / an * 1.2, P.phi[1] - ay / an * 1.2]);
    paths.push([back, tipUV]);
    const hb = 0.6, hw = 0.55; // ponta: duas farpas
    const bx = tipRaw[0] - (ax / an) * hb, by = tipRaw[1] - (ay / an) * hb;
    paths.push([toUV([bx - (ay / an) * hw, by + (ax / an) * hw]), tipUV, toUV([bx + (ay / an) * hw, by - (ax / an) * hw])]);

    return { star, paths, tip: tipUV, zenith: [0.5, ZV] };
  }

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
        ny: Math.pow(Math.random(), 1.25),
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
      const r = svgEl.getBoundingClientRect();
      if (!r.width) return resolve(null);
      const clone = svgEl.cloneNode(true);
      clone.querySelectorAll(".glow").forEach((n) => n.remove());
      clone.removeAttribute("class");
      clone.setAttribute("width", r.width);
      clone.setAttribute("height", r.height);
      const img = new Image();
      img.onload = () => {
        try {
          const k = 2;
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
              const w = Math.pow(a / 255, 0.55);
              sum += w;
              cand.push(x, y, a, d[i], d[i + 1], d[i + 2], w);
            }
          }
          const want = small ? 1100 : 2600;
          const pts = [];
          for (let j = 0; j < cand.length; j += 7) {
            if (Math.random() < (want * cand[j + 6]) / sum) {
              pts.push({ u: cand[j] / c.width, v: cand[j + 1] / c.height, a: Math.max(0.35, cand[j + 2] / 255), c: `${cand[j + 3]},${cand[j + 4]},${cand[j + 5]}` });
            }
          }
          resolve({ pts, lw: r.width, lh: r.height });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }

  /* ---------- Partículas: nascem como contas nas linhas da constelação ---------- */
  function makeForm({ pts, lw, lh }) {
    cons = buildConstellation();
    // contas regulares ao longo de cada caminho (como colar de pontos), com o tempo em que cada uma aparece
    const beads = [];
    const nLines = SGR_LINES.length;
    const gapFor = (pi) => (pi < nLines ? (small ? 5 : 5.5) : (small ? 2.6 : 3)); // arco e flecha mais densos
    let tStart = T.draw;
    cons.paths.forEach((path, pi) => {
      let len = 0;
      const segs = [];
      for (let i = 1; i < path.length; i++) {
        const dx = (path[i][0] - path[i - 1][0]) * lw, dy = (path[i][1] - path[i - 1][1]) * lh;
        const l = Math.hypot(dx, dy);
        segs.push([path[i - 1], path[i], l]);
        len += l;
      }
      const dur = pi < nLines ? Math.max(140, len * 1.0) : Math.max(260, len * 1.6); // arco e flecha: traço mais lento
      let acc = 0;
      segs.forEach(([a, b, l]) => {
        for (let s = 0; s < l; s += gapFor(pi)) {
          const t = s / l;
          beads.push({ u: a[0] + (b[0] - a[0]) * t, v: a[1] + (b[1] - a[1]) * t, rev: tStart + ((acc + s) / len) * dur, arrow: pi >= cons.paths.length - 2, figure: pi >= nLines });
        }
        acc += l;
      });
      tStart += pi < nLines ? 48 : 150; // linhas em cascata; arco e flecha por último
    });
    // centro da figura, para a direção da explosão
    let cu = 0, cv = 0;
    beads.forEach((b) => { cu += b.u; cv += b.v; });
    cu /= beads.length; cv /= beads.length;
    const zu = cons.zenith[0], zv = cons.zenith[1];
    let maxD = 1e-6;
    pts.forEach((p) => (maxD = Math.max(maxD, Math.hypot(p.u - zu, (p.v - zv) / 1.22))));

    form = pts.map((p, i) => {
      const b = beads[i % beads.length];
      const du = (b.u - cu) * lw, dv = (b.v - cv) * lh, dn = Math.hypot(du, dv) || 1;
      const power = rand(40, small ? 110 : 160);
      return {
        su: b.u, sv: b.v, rev: b.rev, arrow: b.arrow, figure: b.figure,
        jx: rand(-0.7, 0.7), jy: rand(-0.7, 0.7), ph: rand(0, Math.PI * 2),
        bx: (du / dn) * power + rand(-25, 25), by: (dv / dn) * power + rand(-25, 25),
        u: p.u, v: p.v, a: p.a, c: p.c,
        d: (Math.hypot(p.u - zu, (p.v - zv) / 1.22) / maxD) * 300 + rand(0, 120),
        dur: rand(750, 1000), curve: rand(-40, 40),
        gold: Math.random() < 0.3,
      };
    });
    endAt = T.explode + 180 + Math.max(...form.map((p) => p.d + p.dur));
  }

  /* ---------- Desenho das estrelas da constelação (brilho + cruz, como a estrela da marca) ---------- */
  function sparkle(x, y, r, a) {
    if (a <= 0.01) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(${LIGHT},${0.55 * a})`);
    g.addColorStop(0.35, `rgba(${GOLD},${0.14 * a})`);
    g.addColorStop(1, `rgba(${GOLD},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a;
    ctx.fillStyle = `rgb(${LIGHT})`;
    ctx.fillRect(x - r * 2.6, y - 0.5, r * 5.2, 1);   // cruz: braço horizontal
    ctx.fillRect(x - 0.5, y - r * 3.2, 1, r * 6.4);   // braço vertical, mais longo (como no logo)
    ctx.beginPath(); ctx.arc(x, y, Math.max(1, r * 0.7), 0, Math.PI * 2); ctx.fill();
  }

  /* ---------- Fim da cena: entra o logo oficial ---------- */
  function reveal(now, quick) {
    if (phase !== "intro") return;
    phase = "reveal";
    revealAt = now;
    if (quick) t0 = now - endAt; // pula direto para o fim
    done();
  }
  const skip = () => reveal(performance.now(), true);

  /* ---------- Quadro ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);

    // estrelas de fundo
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

    if (form.length) {
      const el = now - t0;
      const sr = stage.getBoundingClientRect(), lr = svgEl.getBoundingClientRect();
      const ox = lr.left - sr.left, oy = lr.top - sr.top, lw = lr.width, lh = lr.height;
      const X = (u) => ox + u * lw, Y = (v) => oy + v * lh;
      const fade = phase === "reveal" ? 1 - clamp01((now - revealAt) / 520) : 1;
      const exploded = el >= T.explode;
      const fired = el >= T.fire;

      // partículas
      for (const p of form) {
        let x, y, alpha, col;
        if (!exploded) {
          if (el < p.rev || (fired && p.arrow)) continue; // a flecha some ao disparar
          const k = clamp01((el - p.rev) / 220);
          x = X(p.su) + p.jx; y = Y(p.sv) + p.jy;
          // o arqueiro (arco e flecha) em dourado-luz; as linhas da constelação, discretas
          alpha = p.figure ? k * (0.75 + 0.2 * Math.sin(t * 3 + p.ph)) : k * (0.32 + 0.2 * Math.sin(t * 3 + p.ph));
          col = p.figure ? LIGHT : p.gold ? GOLD : INK;
        } else {
          const ke = el - T.explode;
          const bk = easeOutCubic(clamp01(ke / T.burst));
          const sx = X(p.su) + p.bx * bk, sy = Y(p.sv) + p.by * bk;
          const k = clamp01((ke - 180 - p.d) / p.dur);
          const e = easeOutExpo(k);
          const tx = X(p.u), ty = Y(p.v);
          x = sx + (tx - sx) * e + Math.sin(k * Math.PI) * p.curve;
          y = sy + (ty - sy) * e;
          alpha = p.a * (0.55 + 0.45 * e) * fade;
          col = e > 0.5 ? p.c : p.gold ? GOLD : INK;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${col})`;
        ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }

      // estrelas da constelação: acendem com as linhas, brilham na explosão e somem
      const starA = exploded ? 1 - clamp01((el - T.explode) / 260) : 1;
      const flare = exploded ? 1 + 1.6 * (1 - clamp01((el - T.explode) / 260)) : 1;
      for (const k in cons.star) {
        const st = cons.star[k];
        const appear = clamp01((el - T.draw - 120) / 300);
        const r = (4.3 - st.mag) * (small ? 0.9 : 1.15) + 0.6;
        sparkle(X(st.uv[0]), Y(st.uv[1]), r * flare, appear * starA * (0.8 + 0.2 * Math.sin(t * 2.4 + st.mag * 3)));
      }

      // a flecha disparada: risco de luz da ponta até o zênite
      if (fired && !exploded) {
        const k = easeOutCubic(clamp01((el - T.fire) / (T.explode - T.fire)));
        const x0 = X(cons.tip[0]), y0 = Y(cons.tip[1]);
        const x1 = X(cons.zenith[0]), y1 = Y(cons.zenith[1]);
        const hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k;
        const tail = Math.max(0, k - 0.5);
        const g = ctx.createLinearGradient(x0 + (x1 - x0) * tail, y0 + (y1 - y0) * tail, hx, hy);
        g.addColorStop(0, `rgba(${LIGHT},0)`);
        g.addColorStop(1, `rgba(${LIGHT},0.95)`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * tail, y0 + (y1 - y0) * tail); ctx.lineTo(hx, hy); ctx.stroke();
        sparkle(hx, hy, 1.6, 1);
      }

      // clarão no zênite quando a flecha acerta
      if (exploded) {
        const k = clamp01((el - T.explode) / 650);
        if (k < 1) {
          const zx = X(cons.zenith[0]), zy = Y(cons.zenith[1]);
          sparkle(zx, zy, 3 + 10 * easeOutCubic(k), 1 - k);
          ctx.globalAlpha = (1 - k) * 0.5;
          ctx.strokeStyle = `rgb(${GOLD})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(zx, zy, 8 + easeOutExpo(k) * lh * 0.45, Math.PI, Math.PI * 2); ctx.stroke();
        }
      }

      if (phase === "intro" && el > endAt) reveal(now, false);
      if (phase === "reveal" && fade <= 0) { form = []; cons = null; phase = "done"; }
    }

    // pulsos de sonar do toque/clique
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

  const local = (e) => { const b = stage.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  if (finePointer) {
    stage.addEventListener("pointermove", (e) => { const p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.on = true; });
    stage.addEventListener("pointerleave", () => (pointer.on = false));
  }
  stage.addEventListener("pointerdown", (e) => {
    if (phase === "intro") return skip(); // durante a abertura, tocar pula para o logo
    const p = local(e);
    pulses.push({ x: p.x, y: p.y, t: performance.now() });
    if (pulses.length > 4) pulses.shift();
  });

  // Quem rola ou usa o teclado durante a abertura não espera por ela
  ["wheel", "touchmove", "keydown"].forEach((ev) => addEventListener(ev, skip, { once: true, passive: true }));

  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; onScreen ? play() : stop(); }).observe(stage);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
  new ResizeObserver(() => {
    if (stage.clientWidth !== W || stage.clientHeight !== H) size();
  }).observe(stage);

  const start = async () => {
    const data = await sampleLockup();
    if (!data || !data.pts.length) { done(); phase = "done"; play(); return; }
    makeForm(data);
    t0 = performance.now();
    play();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start));
  // Rede de segurança: o logo nunca fica escondido
  setTimeout(() => { if (phase === "intro") skip(); }, 7000);
})();
