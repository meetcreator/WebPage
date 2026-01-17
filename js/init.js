// init.js — menu and theme initialisation (moved from inline to avoid CSP inline-blocking)
(function(){
  // expose openNav/closeNav for inline onclicks
  window.openNav = function(){
    const sidebar = document.getElementById('sidebar');
    if(!sidebar) return;
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden','false');
  };

  window.closeNav = function(){
    const sidebar = document.getElementById('sidebar');
    if(!sidebar) return;
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden','true');
  };

  function initTheme(){
    const themeBtn = document.getElementById('theme-icon');
    if(!themeBtn) return;
    const saved = localStorage.getItem('theme');
    if (saved === 'light'){
      document.body.classList.remove('dark-mode');
      themeBtn.textContent = '🌙';
    } else {
      document.body.classList.add('dark-mode');
      themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      themeBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // safe DOM ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
    });
  } else {
    initTheme();
    const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
  }
})();