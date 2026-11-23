/* Register of Deeds portal: exports-and-tables.js */
/* V90 \u2014 exports and Franklin-style tables. Builds on the existing Dashboard and GIS Map without changing them. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const save = (blob, name) => {
    const u = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: u,
      download: name
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  };
  const csvOf = (rows, meta = []) => new Blob(["\ufeff" + [...meta.map(m => [m]), ...(meta.length ? [
    []
  ] : []), ...rows].map(r => r.map(esc).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8"
  });
  /* exactly what a table shows (header and visible rows) */
  function tableRows(t) {
    return [...t.querySelectorAll("tr")].filter(tr => tr.offsetParent !== null || !t.offsetParent).map(tr => [...tr.children].map(c => (c.innerText || c.textContent).replace(/\s+/g, " ").trim()));
  }
  const btn = (label, fn, cls = "odDlBtn") => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  };
  /* SVG chart -> PNG, with the page's styles copied inline so the picture matches the screen */
  function svgPng(svg, name) {
    const clone = svg.cloneNode(true),
      src = [svg, ...svg.querySelectorAll("*")],
      dst = [clone, ...clone.querySelectorAll("*")];
    const props = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline", "visibility", "display"];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      dst[i].setAttribute("style", props.map(p => `${p}:${cs.getPropertyValue(p)}`).join(";"));
    });
    const r = svg.getBoundingClientRect(),
      vb = svg.viewBox && svg.viewBox.baseVal;
    const w = Math.round((vb && vb.width) || r.width),
      h = Math.round((vb && vb.height) || r.height),
      k = 2;
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w * k;
      c.height = h * k;
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.scale(k, k);
      g.drawImage(img, 0, 0, w, h);
      c.toBlob(b => save(b, name), "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  }
  document.addEventListener("DOMContentLoaded", () => {
    const D = window.ROD_DASHBOARD_DATA,
      official = D && D.status === "Official";
    /* Dashboard: clearer export label, print, and a link to what's real */
    const ex = $("#fExport");
    if (ex) {
      ex.textContent = "Download this view (CSV)";
      ex.title = "Downloads the figures for the filters you've chosen";
      ex.after(btn("Print this view", () => window.print(), ""));
    }
    /* GIS Map: download exactly what the table shows */
    document.querySelectorAll("#gisView table:not(.gDefsTable)").forEach((t, i) => {
      if (t.dataset.dl) return;
      t.dataset.dl = "1";
      const wrap = t.closest("details") || t.closest(".pTableWrap, .gTableWrap") || t; /* stay visible even when the table section is collapsed */
      wrap.after(btn("Download this table (CSV)", () => save(csvOf(tableRows(t), ["Source: Davidson County Register of Deeds recorded deeds (via Nashville Open Data, Parcels)", `Downloaded ${new Date().toISOString().slice(0, 10)}`]), `gis-map-table${i ? "-" + (i + 1) : ""}.csv`)));
    });
    /* PNG downloads for every chart. Buttons sit beside each chart's container (which never changes) and capture
       whatever chart is showing at the moment of the click, so they work after filters redraw the charts. */
    const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    const addPng = (container, title) => {
      if (!container || container.dataset.png) return;
      container.dataset.png = "1";
      const b = btn("Download chart (PNG)", () => {
        const s = container.querySelector("svg");
        if (s) svgPng(s, (slug(title) || "chart") + ".png");
      }, "odDlBtn odPngBtn");
      b.setAttribute("aria-label", `Download the chart "${title}" as a PNG image`);
      const row = container.querySelector(".odChartDl"); /* Open Data: join the chart's existing download row */
      if (row) {
        b.className = "odDl odPngBtn";
        b.textContent = "Download image (PNG)";
        row.append(" ", b);
      } else container.after(b); /* Dashboard: below the chart */
    };
    document.querySelectorAll("#rodDash .dChart").forEach(c => addPng(c, ((c.closest("section, figure, .dPanel, .dCard") || c.parentElement).querySelector("h3, h4") || {}).textContent || c.id));
    document.querySelectorAll("#opendataView .odCharts figure, #opendataView .odCharts .odChart").forEach(f => addPng(f, (f.querySelector("h3") || f.querySelector("h4") || f.querySelector("figcaption") || {}).textContent || "chart"));
  });
  window.RegisterExports = {
    tableRows,
    csvOf,
    svgPng
  };
})();
