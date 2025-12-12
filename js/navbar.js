// navbar.js — mobile menu + dropdown click handlers
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileClose = document.getElementById("mobileClose");

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      mobileMenu.setAttribute("aria-hidden", String(!open));
      document.documentElement.style.overflow = open ? "hidden" : "";
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      mobileMenu.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
    });
  }

  // Mobile nested toggles
  document.querySelectorAll(".mobile-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.parentElement.classList.toggle("open");
    });
  });

  // Desktop: allow keyboard open of dropdown via focus
  document.querySelectorAll(".dropdown > a").forEach(link => {
    link.addEventListener("click", (e) => {
      // on small screens, toggle parent so mobile fallback works
      if (window.innerWidth < 860) {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });
});
