(() => {
  "use strict";

  function init() {
    const nav = document.getElementById("graphNav");
    const panel = document.getElementById("graphNavPanel");
    const toggle = document.getElementById("graphNavToggle");
    const list = document.getElementById("graphNavList");
    const tabs = document.getElementById("figureTabs");
    const tabsList = document.getElementById("figureTabsList");
    const figures = document.querySelectorAll("#dashFiguresBody .dfFig");
    if (!nav || !panel || !toggle || !list || !tabs || !tabsList || !figures.length) return;

    const tabLabels = {
      "fig-homeSales": "Home sales",
      "fig-homeMedian": "Home prices",
      "fig-priceRanges": "Price ranges",
      "fig-propertyTypes": "Property types",
      "fig-zips": "ZIP codes",
      "fig-marketTrends": "Market trends",
      "fig-population": "Population"
    };
    figures.forEach(figure => {
      const heading = figure.querySelector("h3");
      if (!figure.id || !heading) return;
      figure.tabIndex = -1;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + figure.id;
      link.textContent = heading.textContent;
      item.append(link);
      list.append(item);

      const tabItem = document.createElement("li");
      const tab = document.createElement("a");
      tab.href = link.href;
      tab.textContent = tabLabels[figure.id] || heading.textContent;
      tab.setAttribute("aria-label", heading.textContent);
      tabItem.append(tab);
      tabsList.append(tabItem);
    });
    if (!list.children.length) return;
    nav.hidden = false;
    tabs.hidden = false;

    const setOpen = open => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(panel.hidden));
    list.addEventListener("click", event => {
      if (event.target.closest("a")) setOpen(false);
    });
    nav.querySelector('a[href="#top"]').addEventListener("click", () => setOpen(false));
    document.addEventListener("click", event => {
      if (!nav.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
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
