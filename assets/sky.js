/* Céu da ZENIT — leia BRAND.md antes de mudar.

   Abertura (~5 s, pulável):
   1. Céu de estrelas desenhado no navegador.
   2. As estrelas convergem e formam o centauro de Sagitário (assets/centauro.js: ~14 mil pontos
      tirados de uma imagem; mais brilho = mais estrelas, o que dá o sombreado), com halo suave e
      estrelas brilhantes nos pontos-chave. O centauro é posicionado para a linha da flecha apontar
      para a estrela do zênite do logo.
   3. A flecha dispara até o zênite; clarão; o centauro explode e parte das estrelas forma o lockup
      (forma tirada do próprio SVG oficial, nas cores dele). Entra o arquivo oficial, nítido.
   4. Depois o céu respira: o mouse afasta e acende estrelas; um clique/toque abre círculos. */
(() => {
  const root = document.documentElement;
  const done = () => root.classList.add("sky-done");
  const stage = document.querySelector(".hero__stage");
  const canvas = document.querySelector(".hero__sky-canvas");
  const svgEl = document.querySelector(".hero__svg");
  const DATA = window.ZENIT_CENTAURO;
  if (!stage || !canvas || !svgEl || !canvas.getContext) return done();

  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const INK = "241,241,241";
  const GOLD = "222,186,126";
  const LIGHT = "243,221,176";
  const ZV = 130 / 659.75; // a estrela do zênite no lockup
  const BLOOM = 4; // camada de halo em 1/4 da resolução

  let W = 0, H = 0, small = false;
  let stars = [], pulses = [], run = null;
  let raf = 0, onScreen = true;
  const pointer = { x: -1e4, y: -1e4, on: false };
  const bloom = document.createElement("canvas"), bctx = bloom.getContext("2d");

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const eOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const eOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Tamanho e céu de fundo ---------- */
  function size() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    small = W < 760;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bloom.width = Math.ceil(W / BLOOM);
    bloom.height = Math.ceil(H / BLOOM);
  }

  // Céu denso: muitas estrelas pequenas, algumas maiores e poucas cintilantes (só brilho)
  function makeStars() {
    const n = Math.max(500, Math.min(small ? 900 : 2400, Math.round((W * H) / 600)));
    const nShine = small ? 22 : 54;
    stars = Array.from({ length: n }, (_, i) => {
      const shine = i < nShine;
      const big = !shine && Math.random() < 0.12;
      return {
        nx: Math.random(),
        ny: Math.pow(Math.random(), 1.15),
        r: shine ? rand(1.1, 2.1) : big ? rand(1.3, 2) : rand(0.5, 1.1),
        a: shine ? rand(0.75, 1) : big ? rand(0.6, 0.95) : rand(0.2, 0.7),
        gold: shine ? Math.random() < 0.55 : Math.random() < 0.08,
        shine,
        sp: rand(0.5, 1.6),
        ph: rand(0, Math.PI * 2),
        ox: 0, oy: 0,
      };
    });
  }

  // Sprites desenhados uma vez: brilho dourado (estrelas cintilantes) e brilho branco (contas do centauro)
  const sprite = (stops, R) => {
    const c = document.createElement("canvas");
    c.width = c.height = R * 2;
    const g = c.getContext("2d"), grd = g.createRadialGradient(R, R, 0, R, R, R);
    stops.forEach(([o, col]) => grd.addColorStop(o, col));
    g.fillStyle = grd;
    g.fillRect(0, 0, R * 2, R * 2);
    return c;
  };
  const shineSprite = sprite([[0, `rgba(${LIGHT},1)`], [0.07, `rgba(${LIGHT},0.85)`], [0.2, `rgba(${GOLD},0.3)`], [0.5, `rgba(${GOLD},0.08)`], [1, `rgba(${GOLD},0)`]], 32);
  const softSprite = sprite([[0, `rgba(${INK},0.55)`], [0.35, `rgba(${INK},0.12)`], [1, `rgba(${INK},0)`]], 16);

  function drawSky(t) {
    // o mouse abre um vão no céu e acende as estrelas em volta
    const R = small ? 0 : 170, PUSH = 46;
    const shines = [];
    for (const pass of [INK, GOLD]) {
      ctx.fillStyle = `rgb(${pass})`;
      for (const s of stars) {
        if ((pass === GOLD) !== s.gold) continue;
        const bx = s.nx * W, by = s.ny * H;
        let tx = 0, ty = 0, near = 0;
        if (pointer.on) {
          const dx = bx - pointer.x, dy = by - pointer.y, dd = Math.hypot(dx, dy);
          if (dd < R && dd > 0.1) {
            near = 1 - dd / R;
            const push = near * near * PUSH;
            tx = (dx / dd) * push; ty = (dy / dd) * push;
          }
        }
        s.ox += (tx - s.ox) * 0.09;
        s.oy += (ty - s.oy) * 0.09;
        const a = Math.min(1, s.a * (0.62 + 0.38 * Math.sin(t * s.sp + s.ph)) + near * 0.55);
        if (s.shine) { shines.push([bx + s.ox, by + s.oy, s.r, a, near]); continue; }
        ctx.globalAlpha = a;
        const r = s.r * (1 + near * 0.6);
        ctx.fillRect(bx + s.ox - r / 2, by + s.oy - r / 2, r, r);
      }
    }
    for (const [x, y, r, a, near] of shines) {
      const sz = (10 + r * 9) * (1 + near * 0.35);
      ctx.globalAlpha = a * 0.9;
      ctx.drawImage(shineSprite, x - sz / 2, y - sz / 2, sz, sz);
    }
  }

  /* ---------- Alvos do logo: pontos tirados do próprio SVG oficial ---------- */
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
          resolve(pts);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
  }

  /* ---------- Onde o centauro fica: a linha da flecha aponta para a estrela do zênite ---------- */
  const TIP = DATA ? DATA.tip.map((v) => v / 1000) : [0, 0];
  const NOCK = DATA ? DATA.nock.map((v) => v / 1000) : [0, 0];
  const AL = Math.hypot(TIP[0] - NOCK[0], TIP[1] - NOCK[1]) || 1;
  const ADX = (TIP[0] - NOCK[0]) / AL, ADY = (TIP[1] - NOCK[1]) / AL;

  function placement() {
    const sr = stage.getBoundingClientRect(), lr = svgEl.getBoundingClientRect();
    const zx = lr.left - sr.left + 0.5 * lr.width, zy = lr.top - sr.top + ZV * lr.height;
    const FLY = 0.16, BOTTOM = 0.95, LEFT = 0.19;
    const sBottom = (H - 16 - zy) / (BOTTOM - TIP[1] + FLY * ADY);
    const sLeft = (zx - 8) / (FLY * ADX + TIP[0] - LEFT);
    let s = Math.min(sBottom, sLeft, 760), left, top;
    if (s < 0.8 * Math.min(W, sBottom)) {
      // tela estreita: centraliza o centauro; a flecha voa em linha reta até o zênite
      s = Math.min(W * 0.98, (H - 46 - zy) / (BOTTOM - TIP[1]), 760);
      left = W / 2 - 0.52 * s;
      top = zy + 30 - TIP[1] * s;
    } else {
      left = zx - FLY * s * ADX - TIP[0] * s;
      top = zy - FLY * s * ADY - TIP[1] * s;
    }
    return {
      zx, zy, X: (u) => left + u * s, Y: (v) => top + v * s, tip: [left + TIP[0] * s, top + TIP[1] * s],
      lx: lr.left - sr.left, ly: lr.top - sr.top, lw: lr.width, lh: lr.height,
    };
  }

  /* ---------- Montagem da cena ---------- */
  function setup(logo) {
    const step = small ? 2 : 1; // no celular, metade dos pontos
    const fig = [];
    const P = DATA.pts;
    for (let i = 0; i < P.length; i += 3 * step) {
      fig.push({
        u: P[i] / 1000, v: P[i + 1] / 1000, b: P[i + 2] / 255,
        ph: rand(0, Math.PI * 2), sp: rand(1.2, 2.6),
        // convergência: cada estrela parte de um ponto do céu
        t: rand(150, 900), dur: rand(1100, 1600), sx: rand(0, W), sy: Math.pow(Math.random(), 1.2) * H,
      });
    }
    const revealEnd = Math.max(...fig.map((p) => p.t + p.dur));
    const flares = DATA.flare.map(([x, y], i) => ({ u: x / 1000, v: y / 1000, t: revealEnd - 500 + i * 70, r: i === 1 ? 1.4 : rand(0.8, 1.2) }));
    const fire = revealEnd + 450, explode = fire + 380;
    // cada alvo do logo nasce de uma estrela do centauro; as demais se espalham e se apagam
    const order = fig.map((_, i) => i).sort(() => Math.random() - 0.5);
    let maxD = 1e-6;
    logo.forEach((q) => (maxD = Math.max(maxD, Math.hypot(q.u - 0.5, (q.v - ZV) / 1.22))));
    logo.forEach((q, j) => {
      const p = fig[order[j % fig.length]];
      p.target = q;
      p.d = (Math.hypot(q.u - 0.5, (q.v - ZV) / 1.22) / maxD) * 300 + rand(0, 120);
      p.tdur = rand(750, 1000);
      p.curve = rand(-40, 40);
    });
    let cx = 0, cy = 0;
    fig.forEach((p) => { cx += p.u; cy += p.v; });
    cx /= fig.length; cy /= fig.length;
    fig.forEach((p) => {
      const ex = p.u - cx, ey = p.v - cy, en = Math.hypot(ex, ey) || 1, pw = rand(30, small ? 90 : 150);
      p.bx = (ex / en) * pw + rand(-20, 20);
      p.by = (ey / en) * pw + rand(-20, 20);
    });
    const endAt = explode + 180 + Math.max(...fig.filter((p) => p.target).map((p) => p.d + p.tdur));
    return { fig, flares, fire, explode, endAt, phase: "intro", revealAt: 0, t0: 0 };
  }

  /* ---------- Fim da cena: entra o logo oficial ---------- */
  function reveal(now, quick) {
    if (!run || run.phase !== "intro") return;
    run.phase = "reveal";
    run.revealAt = now;
    if (quick) run.t0 = now - run.endAt; // pula direto para o fim
    done();
  }
  const skip = () => {
    if (run) reveal(performance.now(), true);
    else done();
  };

  /* ---------- Quadro ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    drawSky(t);

    if (run) {
      const el = now - run.t0, P = placement();
      const exploded = el >= run.explode, fired = el >= run.fire;
      const LX = (u) => P.lx + u * P.lw, LY = (v) => P.ly + v * P.lh;

      if (!exploded) {
        // o centauro: contas claras com halo; a sombra vem da densidade
        bctx.clearRect(0, 0, bloom.width, bloom.height);
        bctx.fillStyle = `rgb(${INK})`;
        for (const p of run.fig) {
          const k = clamp01((el - p.t) / p.dur);
          if (k <= 0) continue;
          const e = eOutExpo(k);
          const x = p.sx + (P.X(p.u) - p.sx) * e, y = p.sy + (P.Y(p.v) - p.sy) * e;
          const r = 0.7 + p.b;
          const alpha = (0.35 + 0.65 * e) * (0.3 + 0.7 * p.b) * (0.82 + 0.18 * Math.sin(t * p.sp + p.ph));
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${p.b > 0.82 ? LIGHT : INK})`;
          ctx.fillRect(x - r / 2, y - r / 2, r, r);
          bctx.globalAlpha = alpha * 0.5;
          bctx.fillRect(x / BLOOM - 0.5, y / BLOOM - 0.5, 1, 1);
          if (p.b > 0.72) {
            const sz = 4 + p.b * 6;
            ctx.globalAlpha = alpha * 0.7;
            ctx.drawImage(softSprite, x - sz / 2, y - sz / 2, sz, sz);
          }
        }
        // halo: a camada pequena, ampliada e somada à luz
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.4;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bloom, 0, 0, bloom.width * BLOOM, bloom.height * BLOOM);
        ctx.restore();
        // estrelas brilhantes do desenho
        for (const f of run.flares) {
          const k = eOutCubic(clamp01((el - f.t) / 500));
          if (k <= 0) continue;
          const sz = (22 + 22 * f.r) * (1 + 0.5 * (1 - k)) * (0.9 + 0.1 * Math.sin(t * 2.2 + f.u * 9));
          ctx.globalAlpha = k;
          ctx.drawImage(shineSprite, P.X(f.u) - sz / 2, P.Y(f.v) - sz / 2, sz, sz);
        }
      }

      // a flecha dispara: risco de luz da ponta até o zênite
      if (fired && !exploded) {
        const k = eOutCubic(clamp01((el - run.fire) / (run.explode - run.fire)));
        const [x0, y0] = P.tip, x1 = P.zx, y1 = P.zy;
        const hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k, tl = Math.max(0, k - 0.5);
        const grd = ctx.createLinearGradient(x0 + (x1 - x0) * tl, y0 + (y1 - y0) * tl, hx, hy);
        grd.addColorStop(0, `rgba(${LIGHT},0)`);
        grd.addColorStop(1, `rgba(${LIGHT},0.95)`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grd;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * tl, y0 + (y1 - y0) * tl); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.drawImage(shineSprite, hx - 10, hy - 10, 20, 20);
      }

      // clarão no zênite, explosão e o logo
      if (exploded) {
        const k = clamp01((el - run.explode) / 650);
        if (k < 1) {
          const sz = 20 + 60 * eOutCubic(k);
          ctx.globalAlpha = 1 - k;
          ctx.drawImage(shineSprite, P.zx - sz / 2, P.zy - sz / 2, sz, sz);
          ctx.globalAlpha = (1 - k) * 0.5;
          ctx.strokeStyle = `rgb(${GOLD})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(P.zx, P.zy, 8 + eOutExpo(k) * P.lh * 0.45, 0, Math.PI * 2); ctx.stroke();
        }
        const fade = run.phase === "reveal" ? 1 - clamp01((now - run.revealAt) / 520) : 1;
        const ke = el - run.explode, bk = eOutCubic(clamp01(ke / 320));
        for (const p of run.fig) {
          const sx = P.X(p.u) + p.bx * bk, sy = P.Y(p.v) + p.by * bk;
          if (!p.target) {
            const fa = (1 - clamp01(ke / 700)) * fade;
            if (fa <= 0) continue;
            ctx.globalAlpha = fa * (0.3 + 0.6 * p.b);
            ctx.fillStyle = `rgb(${INK})`;
            ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
            continue;
          }
          const kk = clamp01((ke - 180 - p.d) / p.tdur), e = eOutExpo(kk), q = p.target;
          const x = sx + (LX(q.u) - sx) * e + Math.sin(kk * Math.PI) * p.curve, y = sy + (LY(q.v) - sy) * e;
          ctx.globalAlpha = (e > 0.5 ? q.a : 0.4 + 0.6 * p.b) * (0.55 + 0.45 * e) * fade;
          ctx.fillStyle = `rgb(${e > 0.5 ? q.c : INK})`;
          ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
        }
        if (run.phase === "intro" && el > run.endAt) reveal(now, false);
        if (run.phase === "reveal" && fade <= 0) run = null;
      }
    }

    // cliques/toques: círculos completos, um sim um não pontilhado
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
          ctx.arc(p.x, p.y, 8 + eOutExpo(age) * 130, 0, Math.PI * 2);
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
      const x = s.nx * W, y = s.ny * H;
      if (s.shine) { const sz = 10 + s.r * 9; ctx.globalAlpha = s.a * 0.8; ctx.drawImage(shineSprite, x - sz / 2, y - sz / 2, sz, sz); continue; }
      ctx.fillStyle = `rgb(${s.gold ? GOLD : INK})`;
      ctx.globalAlpha = s.a * 0.8;
      ctx.fillRect(x - s.r / 2, y - s.r / 2, s.r, s.r);
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
    if (run && run.phase === "intro") return skip(); // durante a abertura, tocar pula para o logo
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
    play();
    if (!DATA) return done();
    const logo = await sampleLockup();
    if (!logo || !logo.length || root.classList.contains("sky-done")) return done();
    run = setup(logo);
    run.t0 = performance.now();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start));
  // Rede de segurança: o logo nunca fica escondido
  setTimeout(() => { if (run && run.phase === "intro") skip(); else if (!run) done(); }, 7000);
})();
