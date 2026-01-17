// navbar.js — dropdown click handlers for mobile

document.addEventListener("DOMContentLoaded", () => {
  // Mobile dropdown toggles for sidebar navigation
  document.querySelectorAll(".sidebar .dropdown > a").forEach(link => {
    link.addEventListener("click", (e) => {
      // In sidebar, always toggle dropdown on click (don't navigate)
      e.preventDefault();
      const dropdown = link.parentElement;
      dropdown.classList.toggle("open");
    });
  });

  // Desktop: allow keyboard open of dropdown via focus
  document.querySelectorAll(".dropdown > a").forEach(link => {
    link.addEventListener("click", (e) => {
      // on small screens, toggle parent so mobile fallback works
      if (window.innerWidth < 860) {
        const href = link.getAttribute("href");
        if (href && href !== "#" && !href.startsWith("javascript:")) {
          return; // Let normal link navigation happen
        }
        
        e.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });
});
