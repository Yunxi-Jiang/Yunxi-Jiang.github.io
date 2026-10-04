(() => {
  "use strict";
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector("[data-header]");
  const year = document.querySelector("[data-year]");
  const motionButton = document.querySelector("[data-motion]");
  if (year) year.textContent = new Date().getFullYear();

  const navLinks = Array.from(document.querySelectorAll(".site-header nav a"));
  let scrollPending = false;
  function updateNavigation() {
    header?.classList.toggle("scrolled", window.scrollY > 24);
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    header?.style.setProperty("--reading-progress", String(Math.min(1, Math.max(0, window.scrollY / scrollRange))));
    let current = null;
    for (const link of navLinks) {
      const section = document.querySelector(link.getAttribute("href"));
      if (section && section.getBoundingClientRect().top <= window.innerHeight * .4) current = link;
    }
    const contact = document.querySelector("#contact");
    if (contact && contact.getBoundingClientRect().top <= window.innerHeight * .4) current = null;
    for (const link of navLinks) {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    scrollPending = false;
  }
  function queueNavigation() {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation); }
  }
  window.addEventListener("scroll", queueNavigation, { passive: true });
  window.addEventListener("resize", queueNavigation);
  updateNavigation();

  const publicationFilters = document.querySelector("[data-publication-filters]");
  if (publicationFilters) {
    const groups = Array.from(document.querySelectorAll("[data-publication-group]"));
    const buttons = Array.from(publicationFilters.querySelectorAll("[data-publication-filter]"));
    const counts = Object.fromEntries(groups.map(group => [group.dataset.publicationGroup, group.querySelectorAll(".publication").length]));
    counts.all = Object.values(counts).reduce((sum, count) => sum + count, 0);
    document.querySelectorAll("[data-publication-count]").forEach(element => {
      element.textContent = counts[element.dataset.publicationCount];
    });
    publicationFilters.addEventListener("click", event => {
      const button = event.target.closest("[data-publication-filter]");
      if (!button || !publicationFilters.contains(button)) return;
      const filter = button.dataset.publicationFilter;
      groups.forEach(group => { group.hidden = filter !== "all" && group.dataset.publicationGroup !== filter; });
      buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      const status = document.querySelector("[data-publication-status]");
      const labels = { published: "published articles", review: "manuscripts under review", thesis: "doctoral thesis" };
      if (status) status.textContent = filter === "all" ? `Showing all ${counts.all} research entries.` : `Showing ${counts[filter]} ${labels[filter]}.`;
      queueNavigation();
    });
    publicationFilters.hidden = false;
  }

  if ("IntersectionObserver" in window) {
    const reveals = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!motionPreference.matches && entry.target.animate) {
          entry.target.animate([{ opacity: .45, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
        }
        reveals.unobserve(entry.target);
      }
    }, { threshold: .08 });
    document.querySelectorAll(".reveal").forEach(element => reveals.observe(element));
  }

  const tau = Math.PI * 2;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const canvases = Array.from(document.querySelectorAll("canvas[data-physics]")).map(canvas => ({
    canvas, context: canvas.getContext("2d"), type: canvas.dataset.physics,
    width: 1, height: 1, visible: false, pointer: 0, targetPointer: 0,
  })).filter(scene => scene.context);
  let paused = motionPreference.matches;
  let frame = null;
  let lastTime = 0;
  let elapsed = 0;

  function line(ctx, points, color, width = 1) {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function dot(ctx, x, y, radius, color) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, tau); ctx.fillStyle = color; ctx.fill();
  }
  function arrow(ctx, from, to, color, width = 1.3) {
    line(ctx, [from, to], color, width);
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const size = clamp(Math.hypot(to[0] - from[0], to[1] - from[1]) * .26, 1.4, 4.3);
    line(ctx, [[to[0] - size * Math.cos(angle - .5), to[1] - size * Math.sin(angle - .5)], to, [to[0] - size * Math.cos(angle + .5), to[1] - size * Math.sin(angle + .5)]], color, width);
  }
  function spinColor(z, alpha = 1) {
    const t = (z + 1) / 2;
    return `rgba(${165 - 25 * t},${156 + 65 * t},${229},${alpha})`;
  }
  // Analytic Néel texture: downward core, radial domain wall and upward background.
  // Radius breathes for illustration; this is not a time-resolved simulation.
  function spin(x, y, time) {
    const r = Math.hypot(x, y);
    const radius = .43 + .018 * Math.sin(time * .65);
    const theta = Math.PI * (1 - clamp(r / (radius * 1.8), 0, 1));
    const phi = Math.atan2(y, x);
    return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
  }
  function drawSkyrmion(scene, time) {
    const { context: ctx, width: w, height: h } = scene;
    const scale = Math.min(w * .42, h * .53);
    const rotation = -.32 + .045 * Math.sin(time * .22) + scene.pointer * .09;
    const project = (x, y, z = 0) => [w * .5 + (x * Math.cos(rotation) - y * Math.sin(rotation)) * scale, h * .50 + ((x * Math.sin(rotation) + y * Math.cos(rotation)) * .60 - z * .80) * scale];
    const glow = ctx.createRadialGradient(w * .5, h * .49, 0, w * .5, h * .49, scale * 1.15);
    glow.addColorStop(0, "#8d99dc13"); glow.addColorStop(1, "#8cdde500");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    for (const radius of [.35, .62, .91, 1.07]) {
      const points = Array.from({ length: 129 }, (_, i) => project(radius * Math.cos(i / 128 * tau), radius * Math.sin(i / 128 * tau), -.055));
      line(ctx, points, radius > 1 ? "#90adc32d" : "#90adc318", .8);
    }
    const sites = [];
    const divisions = w < 400 ? 10 : 13;
    const spinLength = w < 400 ? .14 : .115;
    for (let row = -divisions; row <= divisions; row++) {
      for (let column = -divisions; column <= divisions; column++) {
        const x = column / divisions, y = row / divisions;
        if (Math.hypot(x, y) > 1.02) continue;
        const m = spin(x, y, time);
        const alpha = .30 + .65 * (1 - Math.pow(Math.hypot(x, y), 3));
        sites.push({ from: project(x, y), to: project(x + m[0] * spinLength, y + m[1] * spinLength, m[2] * spinLength), z: m[2], alpha });
      }
    }
    sites.sort((a, b) => a.from[1] - b.from[1]);
    for (const site of sites) {
      dot(ctx, site.from[0], site.from[1], .7, "#8aa4bd35");
      arrow(ctx, site.from, site.to, spinColor(site.z, site.alpha), Math.max(.9, w / 550));
    }
  }
  function drawTexture(scene, time) {
    const { context: ctx, width: w, height: h } = scene;
    const scale = Math.min(w, h) * .36;
    for (let row = -9; row <= 9; row++) {
      for (let col = -9; col <= 9; col++) {
        const x = col / 9, y = row / 9;
        if (Math.hypot(x, y) > 1) continue;
        const m = spin(x, y, time);
        const px = w / 2 + x * scale, py = h * .57 + y * scale;
        dot(ctx, px, py, 1.4 + Math.abs(m[2]) * .6, spinColor(m[2], .8));
        if (Math.hypot(m[0], m[1]) > .15) arrow(ctx, [px, py], [px + m[0] * scale * .075, py + m[1] * scale * .075], spinColor(m[2], .9), .9);
      }
    }
  }
  function drawWaves(scene, time) {
    const { context: ctx, width: w, height: h } = scene;
    for (let row = 0; row < 7; row++) {
      const points = [];
      for (let step = 0; step <= 100; step++) {
        const x = step / 100;
        const envelope = Math.pow(Math.sin(Math.PI * x), .7);
        points.push([w * (.06 + .88 * x), h * (.31 + row * .078) + Math.sin(x * tau * 2 - time * .8 + row * .32) * h * .105 * envelope]);
      }
      line(ctx, points, row === 3 ? "#b3f0ef" : `rgba(140,200,229,${.18 + (3 - Math.abs(row - 3)) * .13})`, row === 3 ? 1.8 : 1);
    }
  }
  function drawQuantum(scene, time) {
    const { context: ctx, width: w, height: h } = scene;
    const radius = Math.min(w, h) * .31;
    const cx = w / 2, cy = h * .56;
    const project = (x, y, z) => [cx + (x * .9 + y * .35) * radius, cy + (y * .40 - z) * radius];
    for (let k = 0; k < 4; k++) {
      const points = Array.from({ length: 100 }, (_, i) => {
        const angle = i / 99 * tau;
        return k === 3 ? project(Math.cos(angle), Math.sin(angle), 0) : project(Math.cos(angle) * Math.cos(k * Math.PI / 3), Math.cos(angle) * Math.sin(k * Math.PI / 3), Math.sin(angle));
      });
      line(ctx, points, k === 3 ? "#8cdde570" : "#a59ce54a", 1);
    }
    line(ctx, [project(0, 0, -1.12), project(0, 0, 1.12)], "#9daec448", .8);
    const phi = time * .45 + .8;
    const end = project(.79 * Math.cos(phi), .79 * Math.sin(phi), .61);
    arrow(ctx, [cx, cy], end, "#b0edf0", 1.7);
    dot(ctx, end[0], end[1], 3, "#b0edf0");
    dot(ctx, cx, cy, 2, "#a59ce5");
    ctx.font = "12px Georgia"; ctx.fillStyle = "#a6b6c9";
    ctx.fillText("|0⟩", cx + 8, cy - radius * 1.04);
    ctx.fillText("|1⟩", cx + 8, cy + radius * 1.12);
  }
  const renderers = { skyrmion: drawSkyrmion, texture: drawTexture, waves: drawWaves, quantum: drawQuantum };
  function render(scene) {
    const { context: ctx, width: w, height: h } = scene;
    ctx.clearRect(0, 0, w, h); ctx.lineCap = "round"; ctx.lineJoin = "round";
    scene.pointer += (scene.targetPointer - scene.pointer) * .06;
    renderers[scene.type]?.(scene, elapsed);
  }
  function resize(scene) {
    const rect = scene.canvas.getBoundingClientRect();
    scene.width = Math.max(1, rect.width); scene.height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.canvas.width = Math.round(scene.width * dpr);
    scene.canvas.height = Math.round(scene.height * dpr);
    scene.context.setTransform(dpr, 0, 0, dpr, 0, 0); render(scene);
  }
  function tick(now) {
    frame = null;
    if (paused || document.hidden || !canvases.some(scene => scene.visible)) { lastTime = 0; return; }
    if (!lastTime) lastTime = now;
    const delta = now - lastTime;
    if (delta >= 1000 / 30) {
      elapsed += Math.min(delta, 100) / 1000; lastTime = now;
      canvases.filter(scene => scene.visible).forEach(render);
    }
    frame = requestAnimationFrame(tick);
  }
  function syncAnimation() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; lastTime = 0;
    if (!paused && !document.hidden && canvases.some(scene => scene.visible)) frame = requestAnimationFrame(tick);
    if (motionButton) {
      motionButton.hidden = canvases.length === 0;
      motionButton.setAttribute("aria-pressed", String(paused));
      motionButton.innerHTML = paused ? 'Resume animation <span aria-hidden="true">▷</span>' : 'Pause animation <span aria-hidden="true">Ⅱ</span>';
    }
  }
  const visibility = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const scene = canvases.find(item => item.canvas === entry.target);
      if (scene) { scene.visible = entry.isIntersecting; if (scene.visible) render(scene); }
    });
    syncAnimation();
  }, { threshold: 0 }) : null;
  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(entries => {
    for (const entry of entries) {
      const scene = canvases.find(item => item.canvas === entry.target);
      if (scene) resize(scene);
    }
  }) : null;
  canvases.forEach(scene => {
    resize(scene);
    if (visibility) visibility.observe(scene.canvas); else scene.visible = true;
    resizeObserver?.observe(scene.canvas);
    if (scene.type === "skyrmion") {
      scene.canvas.addEventListener("pointermove", event => {
        if (paused || event.pointerType === "touch") return;
        const rect = scene.canvas.getBoundingClientRect();
        scene.targetPointer = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
      }, { passive: true });
      scene.canvas.addEventListener("pointerleave", () => { scene.targetPointer = 0; });
    }
  });
  if (!resizeObserver) window.addEventListener("resize", () => canvases.forEach(resize));
  motionButton?.addEventListener("click", () => { paused = !paused; syncAnimation(); });
  motionPreference.addEventListener("change", () => { paused = motionPreference.matches; syncAnimation(); });
  document.addEventListener("visibilitychange", syncAnimation);
  syncAnimation();
})();
