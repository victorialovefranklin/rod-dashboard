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
    const note = "Source: Davidson County Register of Deeds recorded deeds (via Nashville Open Data) and the U.S. Census Bureau";
    /* Dashboard: clearer export label, print, and a link to what's real */
    const ex = $("#fExport");
    if (ex) {
      ex.textContent = "Download this view (CSV)";
      ex.title = "Downloads the figures for the filters you've chosen";
      ex.after(btn("Print this view", () => window.print(), ""));
    }
    /* Dashboard tables, built from the Dashboard's public data so every value updates with each monthly load */
    const host = $("#rodDash");
    if (D && host && !$("#dFranklin")) {
      const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const longDate = s => s ? `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8, 10)}, ${s.slice(0, 4)}` : "";
      const monthYear = k => `${MON[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
      const usd = n => "$" + Math.round(n).toLocaleString("en-US");
      const esc = s => String(s).replace(/[&<>"]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      } [c]));
      const mk = D.market || {},
        mm = mk.monthly || [],
        mLast = mm[mm.length - 1];
      const mPrev = mLast ? mm.find(r => r[0] === (+mLast[0].slice(0, 4) - 1) + mLast[0].slice(4)) : null;
      const fullYears = (mk.annual || []).filter(a => a.months === 12),
        yA = fullYears[fullYears.length - 1],
        yB = fullYears[fullYears.length - 2];
      const chg = (a, b, d) => {
        const p = (a - b) / b * 100;
        return Math.abs(p) < 0.05 ? "about the same as" : Math.abs(p).toFixed(d) + "% " + (p > 0 ? "more than" : "fewer than");
      };
      const chgP = (a, b) => {
        const p = (a - b) / b * 100;
        return Math.abs(p).toFixed(1) + "% " + (p >= 0 ? "higher than" : "lower than");
      };
      /* At a glance */
      const glance = [];
      if (mLast) glance.push(["Homes sold", mLast[1], monthYear(mLast[0]) + (mPrev ? "; " + chg(mLast[1], mPrev[1], 0) + " " + monthYear(mPrev[0]) : ""), ""]);
      if (yA) glance.push(["Typical home price", usd(yA.homeMedian), yA.year + (yB ? "; " + chgP(yA.homeMedian, yB.homeMedian) + " " + yB.year : ""), ""]);
      const gHead = ["Measure", "Value", "Period / context", "Status"];
      /* Dashboard information */
      const info = [
        ["Dashboard title", "Recording Activity Dashboard"],
        ["Purpose", "Home sales, home prices, and population change in Davidson County"],
        ["Data through", mk.throughMonth ? monthYear(mk.throughMonth) : ""],
        ["Public data current through", longDate(mk.asOf)],
        ["Update frequency", "Monthly"],
        ["Data sources", "Nashville Open Data (Metro parcel records) and the U.S. Census Bureau"],
        ["Designed and managed by", "Victoria Love Franklin, Published Research Scholar, Data GIS Scientist, and Developer"]
      ];
      const note = "Source: Davidson County Register of Deeds recorded deeds (via Nashville Open Data, Metro parcel records) and the U.S. Census Bureau";
      /* ZIP-code sales (Metro public parcel records; matches the Open Data file transfers_by_zip_monthly) */
      const read = id => {
        try {
          return JSON.parse(document.getElementById(id).textContent);
        } catch (e) {
          return null;
        }
      };
      const S = read("rodSalesData"),
        SUP = (S && S.suppress) || 5;
      const sMonths = S ? Object.keys(S.monthly).sort() : [];
      const zNote = mo => !S ? "" : mo === sMonths[0] ? "partial month (from " + longDate(S.windowStart) + ")" : mo === sMonths[sMonths.length - 1] ? "partial month (through " + longDate(S.asOf) + "; recent sales are still being added)" : "";
      const zHead = ["Month", "ZIP code", "Area", "Sales", "Home sales", "Total sale value", "Median price"];
      const zRowsFor = mo => Object.entries(S.monthly[mo] || {}).sort(([a], [b]) => a.localeCompare(b)).map(([z, [n, homes, total, med]]) => {
        const ok = n >= SUP;
        return [mo, z, (D.zipNames || {})[z] || "", ok ? n : "<" + SUP, ok && homes >= SUP ? homes : (homes ? "<" + SUP : 0), ok ? usd(total) : "", ok ? usd(med) : ""];
      });
      const fullMonths = sMonths.filter(mo => !zNote(mo)),
        zDefault = fullMonths[fullMonths.length - 1] || sMonths[sMonths.length - 1];
      const fmt = v => typeof v === "number" ? v.toLocaleString("en-US") : esc(v);
      const table = (cap, head, rows, firstIsHead = true) => `<div class="pTableWrap"><table class="pTable dFrTable"><caption>${esc(cap)}</caption><thead><tr>${head.map(x => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i || !firstIsHead ? `<td>${fmt(c)}</td>` : `<th scope="row">${fmt(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      const sec = document.createElement("section");
      sec.id = "dFranklin";
      sec.className = "dFranklin";
      sec.setAttribute("aria-labelledby", "dFrH");
      sec.innerHTML = `<h2 id="dFrH">Dashboard tables</h2>
        <p class="dFrNote">Home sales and prices from Nashville Open Data (Metro parcel records); population from the U.S. Census Bureau.</p>
        <h3 id="dFr-index">Figure and chart index</h3><p class="useHint"><span class="useHintLbl">How to use:</span> Select a figure title to go to that&nbsp;figure.</p><div id="dFrIndex"><p class="pNote">Loading the figure index…</p></div>
        ${S ? `<h3 id="dFr-zips">ZIP-code sales</h3><p class="pNote">Sales of $${(S.minPrice || 10000).toLocaleString("en-US")} or more by ZIP code, from Metro's public parcel records. Counts under ${SUP} are shown as &lt;${SUP}.</p>
        <p class="useHint"><span class="useHintLbl">How to use:</span> Choose a month from the Month list to update the&nbsp;table.</p><p><label for="dFrZipMonth">Month </label><select id="dFrZipMonth">${sMonths.map(mo => `<option value="${mo}"${mo === zDefault ? " selected" : ""}>${monthYear(mo)}${zNote(mo) ? " (partial month)" : ""}</option>`).join("")}</select></p>
        <div id="dFrZipTable">${table("Property sales by ZIP code, " + monthYear(zDefault), zHead, zRowsFor(zDefault), false)}</div>` : ""}`;
      host.append(sec);
      const tables = [...sec.querySelectorAll(".pTableWrap")];
      if (S) {
        const sel = sec.querySelector("#dFrZipMonth"),
          box = sec.querySelector("#dFrZipTable");
        sel.addEventListener("change", () => {
          box.innerHTML = table("Property sales by ZIP code, " + monthYear(sel.value), zHead, zRowsFor(sel.value), false);
        });
        box.after(btn("Download ZIP-code sales, all months (CSV)", () => save(csvOf([zHead, ...sMonths.flatMap(zRowsFor)], ["Source: Davidson County Register of Deeds recorded deeds (via Nashville Open Data, Parcels; most recent sale per parcel)", `Data as of ${S.asOf}`]), "register-of-deeds-zip-code-sales.csv")));
      }
      /* Figure and chart index: read from the figures themselves once they have rendered */
      const fHead = ["Figure", "Question / title", "What it shows", "Key takeaway", "Source"];
      let fRows = [];
      const buildIndex = () => {
        const figs = [...document.querySelectorAll("#dashFigures .dfFig")];
        if (!figs.length) return false;
        const txt = (el, sel) => {
          const n = el.querySelector(sel);
          return n ? n.textContent.replace(/\s+/g, " ").trim() : "";
        };
        const strip = (s, lab) => s.replace(new RegExp("^" + lab + "\\s*"), "");
        fRows = figs.map(f => [txt(f, ".dfNum").replace(/^Figure\s*/, ""), txt(f, "h3"), strip(txt(f, ".dfShows"), "What this shows:"), strip(txt(f, ".dfMeans"), "What it means:"), txt(f, ".dfSource").replace(/^Source:\s*/, "")]);
        const box = sec.querySelector("#dFrIndex");
        box.innerHTML = table("Every figure on this dashboard: the question it answers, what it shows, and its key takeaway", fHead, fRows);
        box.querySelectorAll("tbody tr").forEach((tr, i) => {
          const id = figs[i].id,
            c = tr.cells[1];
          if (id && c) {
            const a = document.createElement("a");
            a.href = "#" + id;
            a.textContent = c.textContent;
            c.replaceChildren(a);
          }
        });
        const glue = el => {
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let n, last = null;
          while ((n = w.nextNode()))
            if (n.nodeValue.trim()) last = n;
          if (last) last.nodeValue = last.nodeValue.replace(/\s+(\S+)\s*$/, " $1");
        };
        box.querySelectorAll("th, td, caption").forEach(glue);
        box.after(btn("Download figure index (CSV)", () => save(csvOf([fHead, ...fRows], [note, `Data as of ${mk.asOf || ""}`]), "register-of-deeds-figure-index.csv")));
        return true;
      };
      if (!buildIndex()) {
        let tries = 0;
        const t = setInterval(() => {
          if (buildIndex() || ++tries > 40) clearInterval(t);
        }, 250);
      }
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
