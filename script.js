const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");

if (year) year.textContent = new Date().getFullYear();

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("scrolled", window.scrollY > 40),
  { passive: true },
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: "0px 0px -36px" },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
  revealObserver.observe(element);
});

const field = document.querySelector("[data-field]");
const canvas = document.getElementById("spin-canvas");
const fieldTime = document.querySelector("[data-field-time]");
const context = canvas?.getContext("2d", { alpha: true });

let frame = 0;
let width = 0;
let height = 0;
let deviceScale = 1;
let isRunning = false;
let lastLabelFrame = 0;

const pointer = {
  active: false,
  x: 0.56,
  y: 0.48,
  smoothX: 0.56,
  smoothY: 0.48,
};

function resizeCanvas() {
  if (!canvas || !context) return;
  const rect = canvas.getBoundingClientRect();
  deviceScale = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(rect.width, 1);
  height = Math.max(rect.height, 1);
  canvas.width = Math.round(width * deviceScale);
  canvas.height = Math.round(height * deviceScale);
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
}

function smoothStep(edge0, edge1, value) {
  const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

function drawContour(centerX, centerY, radius, phase, opacity) {
  context.beginPath();
  for (let step = 0; step <= 160; step += 1) {
    const angle = (step / 160) * Math.PI * 2;
    const anisotropy = 1 + 0.105 * Math.cos(4 * angle + phase);
    const localRadius = radius * anisotropy;
    const x = centerX + Math.cos(angle) * localRadius;
    const y = centerY + Math.sin(angle) * localRadius;
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.strokeStyle = `rgba(155, 140, 255, ${opacity})`;
  context.lineWidth = 0.8;
  context.setLineDash([3, 8]);
  context.stroke();
  context.setLineDash([]);
}

function drawVector(x, y, angle, length, hue, opacity, lineWidth) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = length * 0.5;
  const startX = x - cos * half;
  const startY = y - sin * half;
  const endX = x + cos * half;
  const endY = y + sin * half;

  context.strokeStyle = `hsla(${hue}, 72%, 70%, ${opacity})`;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();

  context.fillStyle = `hsla(${hue}, 86%, 76%, ${opacity})`;
  context.beginPath();
  context.arc(endX, endY, lineWidth > 1.2 ? 1.45 : 0.9, 0, Math.PI * 2);
  context.fill();
}

function drawSpinField(time = 0) {
  if (!context || !width || !height) return;

  const scale = Math.min(width, height);
  const gap = Math.max(20, Math.min(28, scale / 23));
  const phase = time * 0.00015;
  const driftX = Math.sin(time * 0.00023) * 0.018;
  const driftY = Math.cos(time * 0.00019) * 0.018;

  pointer.smoothX += ((pointer.active ? pointer.x : 0.56) - pointer.smoothX) * 0.035;
  pointer.smoothY += ((pointer.active ? pointer.y : 0.48) - pointer.smoothY) * 0.035;

  const centerX = width * (0.56 + driftX + (pointer.smoothX - 0.56) * 0.16);
  const centerY = height * (0.48 + driftY + (pointer.smoothY - 0.48) * 0.16);
  const textureRadius = scale * 0.51;

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, textureRadius * 1.12);
  halo.addColorStop(0, "rgba(155, 140, 255, 0.105)");
  halo.addColorStop(0.38, "rgba(119, 228, 237, 0.055)");
  halo.addColorStop(1, "rgba(7, 9, 13, 0)");
  context.fillStyle = halo;
  context.fillRect(0, 0, width, height);

  for (let y = gap * 1.4; y < height - gap; y += gap) {
    for (let x = gap * 1.4; x < width - gap; x += gap) {
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = Math.hypot(dx, dy);
      const normalized = Math.min(radius / textureRadius, 1.28);
      const azimuth = Math.atan2(dy, dx);
      const polar = Math.PI * smoothStep(0.04, 1, Math.min(normalized, 1));
      const inPlane = Math.sin(polar);
      const magnetizationZ = Math.cos(polar);
      const fourFold = Math.sin(4 * azimuth - phase) * 0.13 * (1 - Math.min(normalized, 1));
      const angle = azimuth + Math.PI / 2 + phase * 0.65 + fourFold;
      const edgeFade = 1 - smoothStep(0.78, 1.2, normalized);
      const panelFade = Math.min(1, Math.min(x, width - x, y, height - y) / (gap * 2.2));
      const opacity = (0.12 + 0.64 * Math.abs(inPlane)) * edgeFade * panelFade;

      if (opacity < 0.025) continue;

      const length = gap * (0.17 + 0.48 * Math.abs(inPlane));
      const hue = 184 + (magnetizationZ + 1) * 34 + 8 * Math.sin(azimuth * 2);
      drawVector(x, y, angle, length, hue, opacity, normalized < 0.24 ? 1.45 : 1.05);
    }
  }

  drawContour(centerX, centerY, scale * 0.17, phase, 0.28);
  drawContour(centerX, centerY, scale * 0.29, -phase * 0.7, 0.2);
  drawContour(centerX, centerY, scale * 0.41, phase * 0.45, 0.13);

  const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 0.09);
  core.addColorStop(0, "rgba(197, 245, 106, 0.34)");
  core.addColorStop(0.28, "rgba(119, 228, 237, 0.12)");
  core.addColorStop(1, "rgba(119, 228, 237, 0)");
  context.fillStyle = core;
  context.beginPath();
  context.arc(centerX, centerY, scale * 0.09, 0, Math.PI * 2);
  context.fill();

  if (fieldTime && time - lastLabelFrame > 80) {
    fieldTime.textContent = `t = ${(time * 0.00042).toFixed(2)} ps`;
    lastLabelFrame = time;
  }

  if (!reducedMotion && isRunning) frame = requestAnimationFrame(drawSpinField);
}

function startField() {
  if (reducedMotion || isRunning) return;
  isRunning = true;
  frame = requestAnimationFrame(drawSpinField);
}

function stopField() {
  isRunning = false;
  cancelAnimationFrame(frame);
}

if (field && canvas && context) {
  field.addEventListener("pointermove", (event) => {
    const rect = field.getBoundingClientRect();
    pointer.active = true;
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
  });

  field.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    if (reducedMotion) drawSpinField(0);
  });

  resizeObserver.observe(field);
  resizeCanvas();
  drawSpinField(0);
  startField();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopField();
  else startField();
});
