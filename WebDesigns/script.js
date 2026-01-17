// Quantum Split Reality Portal - Interactive Canvas Animation

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('quantumCanvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Particle system
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.color = `hsl(${Math.random() * 60 + 200}, 70%, 60%)`; // Blue to purple range
      this.life = Math.random() * 100 + 50;
      this.maxLife = this.life;
    }

    update(mouseX, mouseY) {
      // Move towards mouse with some randomness
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        this.speedX += dx * 0.0005;
        this.speedY += dy * 0.0005;
      }

      // Apply some damping
      this.speedX *= 0.98;
      this.speedY *= 0.98;

      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      this.life--;
    }

    draw() {
      const alpha = this.life / this.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Create particles
  let particles = [];
  const particleCount = 150;

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }
  }

  initParticles();

  // Mouse tracking
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;

  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // Animation loop
  function animate() {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.5, '#001122');
    gradient.addColorStop(1, '#000011');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles.forEach(particle => {
      particle.update(mouseX, mouseY);
      particle.draw();
    });

    // Draw connections between nearby particles
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Respawn dead particles
    particles = particles.filter(p => p.life > 0);
    while (particles.length < particleCount) {
      particles.push(new Particle(mouseX, mouseY));
    }

    requestAnimationFrame(animate);
  }

  animate();

  // Add some interactive buttons
  const exploreBtn = document.querySelector('.static-side button:first-child');
  const learnBtn = document.querySelector('.static-side button:last-child');

  exploreBtn.addEventListener('click', function() {
    // Create a burst of particles at mouse position
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(mouseX, mouseY));
    }
  });

  learnBtn.addEventListener('click', function() {
    alert('Welcome to the Quantum Realm! Move your cursor to influence the quantum field.');
  });
});
