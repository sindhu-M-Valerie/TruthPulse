(() => {
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!hasFinePointer) {
    return;
  }

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';

  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';

  document.body.appendChild(spotlight);
  document.body.appendChild(glow);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let glowX = targetX;
  let glowY = targetY;

  function updateSpotlight(x, y) {
    spotlight.style.setProperty('--spot-x', `${x}px`);
    spotlight.style.setProperty('--spot-y', `${y}px`);
  }

  function onPointerMove(event) {
    targetX = event.clientX;
    targetY = event.clientY;
    updateSpotlight(targetX, targetY);
  }

  function animateGlow() {
    glowX += (targetX - glowX) * 0.2;
    glowY += (targetY - glowY) * 0.2;
    glow.style.transform = `translate(${glowX - 8}px, ${glowY - 8}px)`;
    requestAnimationFrame(animateGlow);
  }

  function bindMagneticButtons() {
    const magneticTargets = document.querySelectorAll(
      'button, .theme-filter-btn, .stream-page-btn'
    );

    magneticTargets.forEach((element) => {
      if (element.dataset.magneticBound === 'true') {
        return;
      }

      element.dataset.magneticBound = 'true';
      element.style.willChange = 'transform';

      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        const deltaX = event.clientX - (rect.left + rect.width / 2);
        const deltaY = event.clientY - (rect.top + rect.height / 2);
        const moveX = Math.max(-8, Math.min(8, deltaX * 0.16));
        const moveY = Math.max(-6, Math.min(6, deltaY * 0.16));
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
      });
    });
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('resize', () => {
    targetX = Math.min(targetX, window.innerWidth);
    targetY = Math.min(targetY, window.innerHeight);
    updateSpotlight(targetX, targetY);
  });

  updateSpotlight(targetX, targetY);
  bindMagneticButtons();
  requestAnimationFrame(animateGlow);
})();
