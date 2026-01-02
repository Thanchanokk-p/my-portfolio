// ========================================
// 1) FOOTER YEAR AUTO-UPDATE
// ========================================
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ========================================
// 2) MOBILE MENU TOGGLE (accessible + UX)
//    - closes on link click, outside click, and ESC
// ========================================
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav-center");

function closeMenu() {
  if (!toggle || !nav) return;
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "☰";
}

function openMenu() {
  if (!toggle || !nav) return;
  nav.classList.add("open");
  toggle.setAttribute("aria-expanded", "true");
  toggle.textContent = "✕";
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.contains("open") ? closeMenu() : openMenu();
  });

  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  document.addEventListener("click", (e) => {
    const insideNav = nav.contains(e.target);
    const insideToggle = toggle.contains(e.target);
    if (!insideNav && !insideToggle) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

// ========================================
// 3) PARTICLE ANIMATION (kept)
//    - respects prefers-reduced-motion
//    - uses bounding rect for accurate sizing
// ========================================
window.addEventListener("load", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const canvas = document.createElement("canvas");
  canvas.id = "particle-canvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";

  const hero = document.querySelector(".hero");
  const tsparticlesDiv = document.getElementById("tsparticles");

  if (tsparticlesDiv) tsparticlesDiv.appendChild(canvas);
  else if (hero) hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext("2d");
  let particles = [];
  let mouse = { x: null, y: null, radius: 150 };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
    initParticles();
  }

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;

      const colors = [
        "rgba(59, 130, 246, 0.6)",
        "rgba(37, 99, 235, 0.6)",
        "rgba(96, 165, 250, 0.5)",
        "rgba(139, 92, 246, 0.6)",
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];

      this.opacity = 0.5;
      this.pulseSpeed = Math.random() * 0.015 + 0.005;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      this.pulsePhase += this.pulseSpeed;
      this.opacity = 0.4 + Math.sin(this.pulsePhase) * 0.15;

      if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
      if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 1.5;
          this.y -= Math.sin(angle) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity * 0.7;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 10000);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 180) {
          const opacity = (1 - distance / 180) * 0.55;
          ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animate);
  }

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener("resize", () => requestAnimationFrame(resizeCanvas));

  resizeCanvas();
  animate();
})

// ========================================
// CONTACT FORM (AJAX submit + UX states)
// ========================================
const form = document.getElementById("contact-form");
const submitBtn = document.getElementById("submit-btn");
const successMsg = document.getElementById("form-success");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        form.reset();
        successMsg.classList.add("show");
      } else {
        alert("Something went wrong. Please try again.");
        submitBtn.disabled = false;
      }
    } catch (error) {
      alert("Network error. Please try again.");
      submitBtn.disabled = false;
    } finally {
      submitBtn.classList.remove("loading");
    }
  });
}

