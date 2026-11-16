(() => {
  "use strict";

  function init() {
    document.querySelectorAll("#dashFiguresBody .dfFig").forEach(figure => {
      figure.tabIndex = -1;
    });

    const header = document.querySelector("#dashboardView .dHead");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!header) return;
    let frame = null;
    const updateParallax = () => {
      frame = null;
      if (motion.matches) {
        header.style.removeProperty("--dash-parallax");
        return;
      }
      const rect = header.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = Math.max(-20, Math.min(20, (window.innerHeight / 2 - rect.top) * 0.06));
      header.style.setProperty("--dash-parallax", offset.toFixed(1) + "px");
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(updateParallax);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    schedule();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
