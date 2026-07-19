const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");

year.textContent = new Date().getFullYear();

window.addEventListener(
  "scroll",
  () => header.classList.toggle("scrolled", window.scrollY > 40),
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
  { threshold: 0.08, rootMargin: "0px 0px -40px" },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const tilt = document.querySelector("[data-tilt]");
if (tilt && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 9;
    const y = (event.clientY / window.innerHeight - 0.5) * -9;
    tilt.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  });
}

const canvas = document.getElementById("spin-canvas");
const context = canvas.getContext("2d", { alpha: true });
let frame = 0;
let canvasSize = 0;
let deviceScale = 1;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  deviceScale = Math.min(window.devicePixelRatio || 1, 2);
  canvasSize = Math.max(rect.width, 1);
  canvas.width = Math.round(rect.width * deviceScale);
  canvas.height = Math.round(rect.height * deviceScale);
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
}

function drawSpinTexture(time = 0) {
  const size = canvasSize;
  if (!size) return;
  const cells = size < 400 ? 20 : 27;
  const gap = size / cells;
  const centerX = size * (0.5 + Math.sin(time * 0.00032) * 0.025);
  const centerY = size * (0.5 + Math.cos(time * 0.00027) * 0.025);

  context.clearRect(0, 0, size, size);
  context.lineCap = "round";

  for (let row = 1; row < cells; row += 1) {
    for (let column = 1; column < cells; column += 1) {
      const x = column * gap;
      const y = row * gap;
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = Math.hypot(dx, dy);
      const normalized = Math.min(radius / (size * 0.43), 1);
      const azimuth = Math.atan2(dy, dx);
      const twist = Math.PI * (1 - normalized) + time * 0.00018;
      const angle = azimuth + Math.PI / 2 + Math.sin(twist) * 0.62;
      const length = gap * (0.22 + 0.32 * Math.sin(normalized * Math.PI));
      const opacity = 0.22 + (1 - normalized) * 0.68;
      const hue = 175 + 100 * (1 - normalized);

      context.strokeStyle = `hsla(${hue}, 75%, 68%, ${opacity})`;
      context.lineWidth = normalized < 0.2 ? 1.8 : 1.15;
      context.beginPath();
      context.moveTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();

      const tipX = x + Math.cos(angle) * length;
      const tipY = y + Math.sin(angle) * length;
      context.fillStyle = `hsla(${hue}, 82%, 72%, ${opacity})`;
      context.beginPath();
      context.arc(tipX, tipY, normalized < 0.3 ? 1.6 : 1, 0, Math.PI * 2);
      context.fill();
    }
  }

  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.14);
  glow.addColorStop(0, "rgba(183, 255, 101, 0.28)");
  glow.addColorStop(1, "rgba(108, 229, 232, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, size * 0.14, 0, Math.PI * 2);
  context.fill();

  if (!reducedMotion) frame = requestAnimationFrame(drawSpinTexture);
}

resizeCanvas();
drawSpinTexture();
window.addEventListener("resize", resizeCanvas);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(frame);
  else if (!reducedMotion) frame = requestAnimationFrame(drawSpinTexture);
});
