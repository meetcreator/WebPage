// theme.js — smooth theme toggle + SVG icon + persistence
document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-icon");
  const svg = document.getElementById("themeIconSVG");

  const sunIcon = `
    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2"/>
    <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2"/>
    <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"/>
    <line x1="5" y1="5" x2="7" y2="7" stroke="currentColor" stroke-width="2"/>
    <line x1="17" y1="17" x2="19" y2="19" stroke="currentColor" stroke-width="2"/>
    <line x1="5" y1="19" x2="7" y2="17" stroke="currentColor" stroke-width="2"/>
    <line x1="17" y1="7" x2="19" y2="5" stroke="currentColor" stroke-width="2"/>
  `;

  const moonIcon = `
    <path d="M21 12.79A9 9 0 0 1 11.21 3
             7 7 0 1 0 21 12.79z"
          stroke="currentColor" stroke-width="2" fill="none"/>
  `;

  if (!themeBtn || !svg) return;

  // Restore theme: system preference fallback
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    svg.innerHTML = sunIcon;
  } else if (saved === "light") {
    document.body.classList.remove("dark-mode");
    svg.innerHTML = moonIcon;
  } else {
    // no saved: check system
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.classList.add("dark-mode");
      svg.innerHTML = sunIcon;
    } else {
      svg.innerHTML = moonIcon;
    }
  }

  // Toggle handler
  themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    // animate icon swap
    svg.style.opacity = "0";
    setTimeout(() => {
      svg.innerHTML = isDark ? sunIcon : moonIcon;
      svg.style.opacity = "1";
    }, 180);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
