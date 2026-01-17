// portfolio.js — filters, preview overlay, keyboard & touch support
import './script.js';
import './navbar.js';

document.addEventListener("DOMContentLoaded", () => {
  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Hamburger menu toggle for sidebar
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

  if (hamburger && sidebar) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = sidebar.classList.toggle("open");
      sidebar.setAttribute("aria-hidden", String(!isOpen));
      console.log("Hamburger clicked, sidebar open:", isOpen);
    });

    // Close menu when clicking on a link
    const sidebarLinks = sidebar.querySelectorAll("a");
    sidebarLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        // Don't close if it's the close button or a dropdown toggle link
        if (!link.classList.contains("closebtn") && !link.parentElement.classList.contains("dropdown")) {
          sidebar.classList.remove("open");
          sidebar.setAttribute("aria-hidden", "true");
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const isClickInsideSidebar = sidebar.contains(e.target);
      const isClickOnHamburger = hamburger.contains(e.target);
      
      if (!isClickInsideSidebar && !isClickOnHamburger) {
        sidebar.classList.remove("open");
        sidebar.setAttribute("aria-hidden", "true");
      }
    });
  }

  // Contact form (demo)
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const status = document.getElementById("submission-status");
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      status.textContent = "Thanks — message received!";
      contactForm.reset();
      setTimeout(() => status.textContent = "", 4000);
    });
  }

  // Portfolio filtering (if on portfolio page)
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const cards = Array.from(document.querySelectorAll(".portfolio-card"));
  
  if (filterButtons.length > 0 && cards.length > 0) {
    function filter(cat) {
      cards.forEach(card => {
        const cardCategory = card.getAttribute("data-category");
        const shouldShow = cat === "all" || cardCategory === cat;
        
        if (shouldShow) {
          card.style.display = "block";
          setTimeout(() => {
            card.style.opacity = "1";
          }, 10);
        } else {
          card.style.opacity = "0";
          setTimeout(() => {
            card.style.display = "none";
          }, 220);
        }
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filterValue = btn.getAttribute("data-filter") || "all";
        filter(filterValue);
      });
    });

    // Initialize with all visible
    cards.forEach(card => {
      card.style.display = "block";
      card.style.opacity = "1";
    });
  }

  // Project preview overlay (portfolio page)
  const overlay = document.getElementById("projectPreviewOverlay");
  const bgVideo = document.getElementById("pc-bg-video");
  const pcTitle = document.getElementById("pcTitle");
  const pcDesc = document.getElementById("pcDesc");
  const pcThumb = document.getElementById("pcThumb");
  const pcClose = document.getElementById("pcClose");
  const pcPrev = document.getElementById("pcPrev");
  const pcNext = document.getElementById("pcNext");

  const portfolioCards = Array.from(document.querySelectorAll(".portfolio-card"));
  if (portfolioCards.length && overlay) {
    const projects = portfolioCards.map(card => ({
      el: card,
      title: card.querySelector("h3")?.textContent || 'Untitled',
      desc: card.querySelector("p")?.textContent || '',
      img: card.querySelector("img")?.src || '',
      video: card.dataset.video || ''
    }));

    let idx = 0;

    function open(i) {
      idx = (i + projects.length) % projects.length;
      const p = projects[idx];
      pcTitle.textContent = p.title;
      pcDesc.textContent = p.desc;
      pcThumb.src = p.img;
      if (p.video) {
        bgVideo.src = p.video;
        bgVideo.play().catch(()=>{});
      } else {
        bgVideo.pause();
        bgVideo.removeAttribute("src");
      }
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
    }

    function close() {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
      try { bgVideo.pause(); } catch(e){}
      bgVideo.removeAttribute("src");
      document.documentElement.style.overflow = "";
    }

    function next(){ open(idx + 1); }
    function prev(){ open(idx - 1); }

    portfolioCards.forEach((c,i) => {
      const anchor = c.querySelector('.portfolio-card-link');
      if (anchor) anchor.addEventListener('click', e => e.preventDefault());
      c.addEventListener('click', () => open(i));
    });

    pcClose && pcClose.addEventListener('click', close);
    pcPrev && pcPrev.addEventListener('click', (e)=>{ e.stopPropagation(); prev(); });
    pcNext && pcNext.addEventListener('click', (e)=>{ e.stopPropagation(); next(); });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('pc-dim')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // touch
    let startX = 0;
    overlay.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX, { passive:true });
    overlay.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 60) dx < 0 ? next() : prev();
    }, { passive:true });

    overlay.classList.add('hidden');
  }

});
