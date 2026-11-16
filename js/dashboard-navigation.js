(() => {
  "use strict";

  function init() {
    const figures = [...document.querySelectorAll("#dashFiguresBody .dfFig")];
    const figureTabs = [...document.querySelectorAll(".figureTabs a")];
    const setActiveFigure = id => {
      figureTabs.forEach(tab => {
        if (tab.hash === "#" + id) tab.setAttribute("aria-current", "location");
        else tab.removeAttribute("aria-current");
      });
    };
    const initialFigure = figures.find(figure => "#" + figure.id === window.location.hash) || figures[0];
    if (initialFigure) setActiveFigure(initialFigure.id);

    figures.forEach(figure => {
      figure.tabIndex = -1;
    });
    figureTabs.forEach(tab => {
      tab.addEventListener("click", () => setActiveFigure(tab.hash.slice(1)));
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActiveFigure(visible[0].target.id);
      }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
      figures.forEach(figure => observer.observe(figure));
    }

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
