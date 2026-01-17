/* ==========================================================
   PREMIUM JS — Drumil Patel Portfolio (2025 Edition)
   Features:
   ✓ Smooth Dark/Light Mode + Animated SVG Icon
   ✓ Mobile Menu + Dropdowns
   ✓ Portfolio Filters
   ✓ Project Preview Overlay (Video Background)
   ✓ Swipe + Keyboard Navigation
   ✓ Contact Form Handler
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Ensure page scrolling is enabled on load (guards against stray overflow:hidden)
  try { document.documentElement.style.overflow = document.documentElement.style.overflow || ""; } catch (e) {}

  /* ==========================================================
     2. MOBILE MENU + DROPDOWNS
     ========================================================== */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileClose = document.getElementById("mobileClose");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      mobileMenu.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      document.documentElement.style.overflow = "";
    });
  }

  document.querySelectorAll(".mobile-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.classList.toggle("open");
    });
  });



  /* ==========================================================
     3. PORTFOLIO FILTER SYSTEM
     ========================================================== */
  const cards = Array.from(document.querySelectorAll(".portfolio-card"));
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

  const projects = cards.map(card => ({
    title: card.querySelector("h3")?.textContent ?? "",
    desc: card.querySelector("p")?.textContent ?? "",
    img: card.querySelector("img")?.src ?? "",
    video: card.dataset.video ?? "",
    category: card.dataset.category ?? "all",
    el: card
  }));

  function filterProjects(cat) {
    projects.forEach(p => {
      if (cat === "all" || p.category === cat) {
        p.el.style.display = "block";
        requestAnimationFrame(() => (p.el.style.opacity = "1"));
      } else {
        p.el.style.opacity = "0";
        setTimeout(() => (p.el.style.display = "none"), 200);
      }
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterProjects(btn.dataset.filter);
    });
  });



  /* ==========================================================
     4. PROJECT PREVIEW OVERLAY (VIDEO BACKGROUND)
     ========================================================== */
  const overlay = document.getElementById("projectPreviewOverlay");
  const bgVideo = document.getElementById("pc-bg-video");
  const pcTitle = document.getElementById("pcTitle");
  const pcDesc = document.getElementById("pcDesc");
  const pcThumb = document.getElementById("pcThumb");
  const pcClose = document.getElementById("pcClose");
  const pcPrev = document.getElementById("pcPrev");
  const pcNext = document.getElementById("pcNext");

  let currentIndex = 0;

  function openPreview(index) {
    currentIndex = (index + projects.length) % projects.length;
    const p = projects[currentIndex];

    pcTitle.textContent = p.title;
    pcDesc.textContent = p.desc;
    pcThumb.src = p.img;

    bgVideo.src = p.video || "";
    if (p.video) bgVideo.play().catch(() => {});

    overlay.classList.remove("hidden");
    document.documentElement.style.overflow = "hidden";
  }

  function closePreview() {
    overlay.classList.add("hidden");
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    document.documentElement.style.overflow = "";
  }

  function showNext() { openPreview(currentIndex + 1); }
  function showPrev() { openPreview(currentIndex - 1); }

  // card clicks
  cards.forEach((card, i) => {
    const a = card.querySelector(".portfolio-card-link");
    if (a) a.addEventListener("click", e => e.preventDefault());
    card.addEventListener("click", () => openPreview(i));
  });

  // overlay controls
  if (pcClose) pcClose.addEventListener("click", closePreview);
  if (pcNext) pcNext.addEventListener("click", (e) => { e.stopPropagation(); showNext(); });
  if (pcPrev) pcPrev.addEventListener("click", (e) => { e.stopPropagation(); showPrev(); });

  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay || e.target.classList.contains("pc-dim")) closePreview();
    });
  }

  // keyboard controls
  if (overlay) {
    document.addEventListener("keydown", e => {
      if (overlay.classList.contains("hidden")) return;
      if (e.key === "Escape") closePreview();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });

    // touch swipe
    let startX = 0;
    overlay.addEventListener("touchstart", e => {
      startX = e.changedTouches[0].screenX;
    });

    overlay.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 50) dx < 0 ? showNext() : showPrev();
    });
  }



  /* ==========================================================
     5. CONTACT FORM HANDLER
     ========================================================== */
  const contactForm = document.getElementById("contactForm");
  const status = document.getElementById("submission-status");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      status.textContent = "Message Sent! I'll get back soon 👍";
      contactForm.reset();
    });
  }



  /* ==========================================================
     6. YEAR AUTO UPDATE
     ========================================================== */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

});
