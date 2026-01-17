// split-anim.js — move split-on-scroll logic out of inline script (avoids CSP inline script blocking)
(function(){
  function prepareAndObserve(){
    try{
      console.log('[split-anim] Starting...');
      const elems = Array.from(document.querySelectorAll('.split-animate'));
      console.log('[split-anim] Found', elems.length, 'elements');
      if(!elems.length) return;

      elems.forEach((el, idx) => {
        const txt = el.textContent.trim();
        console.log('[split-anim] Element', idx, ':', txt);
        if(!txt) return;
        const words = txt.split(/\s+/);
        const frag = document.createDocumentFragment();
        words.forEach((w, wi) => {
          const ws = document.createElement('span');
          ws.className = 'split-word';
          Array.from(w).forEach((ch, ci) => {
            const cs = document.createElement('span');
            cs.className = 'split-char';
            cs.textContent = ch;
            const delay = (wi * 6 + ci) * 30; // ms
            cs.style.setProperty('--d', delay + 'ms');
            ws.appendChild(cs);
          });
          // small spacer between words
          const sp = document.createElement('span');
          sp.className = 'split-char';
          sp.textContent = ' ';
          sp.style.setProperty('--d', ((wi+1)*6) * 30 + 'ms');
          ws.appendChild(sp);
          frag.appendChild(ws);
        });
        el.innerHTML = '';
        el.appendChild(frag);
      });

      console.log('[split-anim] Fragments created. Total .split-char elements:', document.querySelectorAll('.split-char').length);

      if (!('IntersectionObserver' in window)){
        console.log('[split-anim] IntersectionObserver not supported, revealing all');
        elems.forEach(el => el.classList.add('in'));
        return;
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          console.log('[split-anim] Observed:', e.target.textContent.slice(0,20), 'isIntersecting:', e.isIntersecting);
          if(e.isIntersecting) e.target.classList.add('in');
          else e.target.classList.remove('in');
        });
      }, { threshold: 0.15 });

      // Observe all elements and trigger for those already in view
      document.querySelectorAll('.split-animate').forEach(el => {
        io.observe(el);
        // Check if element is already in viewport and trigger animation
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('in');
        }
      });
      console.log('[split-anim] Observer set up');
    } catch (err){
      console.error('[split-anim] error', err);
    }
  }

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAndObserve);
  } else {
    prepareAndObserve();
  }

  // Also expose manual trigger for debugging
  window.__splitAnimDebug = () => {
    console.log('[split-anim DEBUG] Total .split-char:', document.querySelectorAll('.split-char').length);
    console.log('[split-anim DEBUG] Revealing all split-animate...');
    document.querySelectorAll('.split-animate').forEach(el => el.classList.add('in'));
  };
})();