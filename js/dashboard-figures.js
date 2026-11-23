/* Register of Deeds portal: dashboard-figures.js */
/* Public Dashboard figures: plain-language questions, trend lines, tables, and PDF (print) export.
   Reads window.ROD_DASHBOARD_DATA (market figures from Nashville Open Data). */
(() => {
  "use strict";
  const C = {
    navy: "#00306C",
    blue: "#075A96",
    sky: "#6FA3D2",
    gold: "#CC9C48",
    grey: "#767F85",
    light: "#D8E0E8",
    ink: "#111111",
    slate: "#4C575E"
  };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmt = n => Math.round(n).toLocaleString("en-US"),
    usd = n => "$" + Math.round(n).toLocaleString("en-US");
  const usdK = n => n === 0 ? "$0" : n >= 1e6 ? "$" + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : "$" + Math.round(n / 1000) + "K";
  const pct = (n, d = 0) => (n > 0 ? "+" : "") + n.toFixed(d) + "%",
    pctp = (n, d = 0) => n.toFixed(d) + "%";
  const cmp = (n, up, down, d = 0) => Math.abs(n) < 0.5 ? "about the same as" : Math.abs(n).toFixed(d) + "% " + (n > 0 ? up : down);
  const mlab = k => MON[+k.slice(5) - 1] + " " + k.slice(0, 4),
    mlong = k => MONL[+k.slice(5) - 1] + " " + k.slice(0, 4);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  } [c]));
  const W = 960,
    H = 330,
    L = 64,
    R = 20,
    T = 20,
    B = 44;
  const ticks = (lo, hi, n = 4) => {
    const s = (hi - lo) / n;
    return Array.from({
      length: n + 1
    }, (_, i) => lo + s * i);
  };
  const nice = hi => {
    const raw = hi / 4,
      p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(v => v >= raw);
    return step * 4;
  };

  function axes(lo, hi, yf) {
    if (lo === 0 && hi !== 100 && hi !== 160) hi = nice(hi);
    const y = v => T + (H - T - B) * (1 - (v - lo) / ((hi - lo) || 1));
    return {
      y,
      g: ticks(lo, hi).map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="${C.light}"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" font-size="12" fill="${C.slate}">${yf(t)}</text>`).join("")
    };
  }

  function line(labels, series, o = {}) {
    const all = series.flatMap(s => s.values).filter(v => v != null),
      lo = o.min != null ? o.min : 0,
      hi = o.max || Math.max(...all) * 1.08;
    const a = axes(lo, hi, o.yf || fmt),
      x = i => L + (W - L - R) * (labels.length > 1 ? i / (labels.length - 1) : .5);
    const every = Math.max(1, Math.ceil(labels.length / (o.xn || 10)));
    const xl = labels.map((l, i) => i % every === 0 ? `<text x="${x(i)}" y="${H - 16}" text-anchor="middle" font-size="12" fill="${C.slate}">${esc(l)}</text>` : "").join("");
    const paths = series.map(s => {
      let d = "",
        pen = false;
      s.values.forEach((v, i) => {
        if (v == null) {
          pen = false;
          return;
        }
        d += (pen ? "L" : "M") + x(i).toFixed(1) + "," + a.y(v).toFixed(1);
        pen = true;
      });
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.6}" ${s.dash ? 'stroke-dasharray="7 5"' : ""} stroke-linejoin="round"/>` + (s.dots ? s.values.map((v, i) => v == null ? "" : `<circle cx="${x(i)}" cy="${a.y(v)}" r="4" fill="${s.color}"/>`).join("") : "");
    }).join("");
    const goal = o.goal ? `<line x1="${L}" x2="${W - R}" y1="${a.y(o.goal.value)}" y2="${a.y(o.goal.value)}" stroke="${C.gold}" stroke-width="2.5" stroke-dasharray="9 6"/><rect x="${L + 4}" y="${a.y(o.goal.value) - 22}" width="${o.goal.label.length * 7.2 + 12}" height="18" fill="#fff" opacity=".9"/><text x="${L + 10}" y="${a.y(o.goal.value) - 8}" text-anchor="start" font-size="12.5" font-weight="700" fill="#7A5A12">${esc(o.goal.label)}</text>` : "";
    return svg(a.g + goal + paths + xl, o.aria);
  }

  function hbars(labels, values, o = {}) {
    const n = labels.length,
      rh = 34,
      HH = n * rh + 12,
      LL = 290,
      max = Math.max(...values) * 1.12 || 1,
      bw = v => (W - LL - 90) * v / max;
    const body = labels.map((l, i) => `<text x="${LL - 10}" y="${i * rh + 23}" text-anchor="end" font-size="13" fill="${C.ink}">${esc(l)}</text><rect x="${LL}" y="${i * rh + 8}" width="${Math.max(2, bw(values[i]))}" height="${rh - 14}" fill="${(o.colors && o.colors[i]) || C.blue}"/><text x="${LL + bw(values[i]) + 8}" y="${i * rh + 23}" font-size="12.5" font-weight="700" fill="${C.ink}">${esc(o.fmtv ? o.fmtv(values[i], i) : fmt(values[i]))}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${HH}" role="img" aria-label="${esc(o.aria || "")}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  }

  function bars(labels, values, o = {}) {
    const hi = (o.max || Math.max(...values)) * 1.15,
      a = axes(0, hi, o.yf || fmt),
      n = labels.length,
      bw = (W - L - R) / n * .62;
    const cx = i => L + (W - L - R) * ((i + .5) / n);
    const b = values.map((v, i) => `<rect x="${cx(i) - bw / 2}" y="${a.y(v)}" width="${bw}" height="${H - B - a.y(v)}" fill="${(o.colors && o.colors[i]) || C.blue}"/>` +
      `<text x="${cx(i)}" y="${a.y(v) - 8}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${C.ink}">${esc(o.top ? o.top(v, i) : fmt(v))}</text>` +
      (n <= 12 || i % Math.ceil(n / 10) === 0 ? `<text x="${cx(i)}" y="${H - 16}" text-anchor="middle" font-size="12" fill="${C.slate}">${esc(labels[i])}</text>` : "")).join("");
    const tr = o.trend ? (() => {
      const pts = o.trend.map((v, i) => v == null ? null : [cx(i), a.y(v)]).filter(Boolean);
      return `<path d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("")}" fill="none" stroke="${C.gold}" stroke-width="2.6" stroke-dasharray="7 5"/>`;
    })() : "";
    return svg(a.g + b + tr, o.aria);
  }

  function stack100(labels, series, o = {}) {
    const n = labels.length,
      bw = (W - L - R) / n * .62,
      cx = i => L + (W - L - R) * ((i + .5) / n),
      a = axes(0, 100, v => v + "%");
    let out = a.g;
    labels.forEach((l, i) => {
      const tot = series.reduce((s, se) => s + se.values[i], 0) || 1;
      let acc = 0;
      series.forEach(se => {
        const p = se.values[i] / tot * 100,
          y0 = a.y(acc + p),
          h = a.y(acc) - y0;
        acc += p;
        out += `<rect x="${cx(i) - bw / 2}" y="${y0}" width="${bw}" height="${h}" fill="${se.color}"/>` + (p >= 7 ? `<text x="${cx(i)}" y="${y0 + h / 2 + 4}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${se.text || "#fff"}">${Math.round(p)}%</text>` : "");
      });
      out += `<text x="${cx(i)}" y="${H - 16}" text-anchor="middle" font-size="12" fill="${C.slate}">${esc(l)}</text>`;
    });
    if (o.trend) {
      const pts = o.trend.map((v, i) => [cx(i), a.y(v)]);
      out += `<path d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("")}" fill="none" stroke="${C.gold}" stroke-width="2.6" stroke-dasharray="7 5"/>`;
    }
    return svg(out, o.aria);
  }
  const svg = (body, aria) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria || "")}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  const legend = items => `<ul class="dfLegend">${items.map(i => `<li><span style="background:${i.color};${i.dash ? "height:3px;border-top:3px dashed " + i.color + ";background:none" : ""}"></span>${esc(i.name)}</li>`).join("")}</ul>`;
  const mavg = (v, k) => v.map((_, i) => i < k - 1 ? null : v.slice(i - k + 1, i + 1).reduce((s, x) => s + x, 0) / k);
  const bizDays = key => {
    const [y, m] = key.split("-").map(Number);
    const H = new Set(["01-01", "07-04", "11-11", "12-25", "06-19"]);
    let n = 0;
    const d = new Date(y, m - 1, 1);
    const nth = (wd, k) => {
      const t = new Date(y, m - 1, 1);
      let c = 0;
      while (true) {
        if (t.getDay() === wd && ++c === k) return t.getDate();
        t.setDate(t.getDate() + 1);
      }
    };
    const last = wd => {
      const t = new Date(y, m, 0);
      while (t.getDay() !== wd) t.setDate(t.getDate() - 1);
      return t.getDate();
    };
    const extra = {
      1: [nth(1, 3)],
      2: [nth(1, 3)],
      5: [last(1)],
      9: [nth(1, 1)],
      10: [nth(1, 2)],
      11: [nth(4, 4)]
    } [m] || [];
    while (d.getMonth() === m - 1) {
      const dd = String(d.getDate()).padStart(2, "0"),
        mm = String(m).padStart(2, "0");
      const wd = d.getDay();
      if (wd > 0 && wd < 6 && !H.has(mm + "-" + dd) && !extra.includes(d.getDate())) n++;
      d.setDate(d.getDate() + 1);
    }
    return n;
  };
  /* Where each figure's data comes from, and how it is loaded (see the Data Management Plan) */
  const PV = {
    party_parcels: ["party", "Source: Nashville Open Data (Metro)", "Downloaded monthly from Nashville Open Data. The update kit (market_data.py) computes the figures, and publish_dashboard_data.py writes them to the Dashboard's data file."],
    party_census: ["party", "Source: U.S. Census Bureau", "Pulled once a year, free, from the Census Bureau's county population file by census_population.py (usually released each spring). Census revises earlier years with each release."]
  };
  const PROV = {
    homeSales: "party_parcels",
    homeMedian: "party_parcels",
    priceRanges: "party_parcels",
    propertyTypes: "party_parcels",
    zips: "party_parcels",
    marketTrends: "party_parcels",
    population: "party_census"
  };
  const STATUS = {
    open: ["dfPublic", ""],
    census: ["dfPublic", ""]
  };

  function figures(D) {
    const M = D.market,
      months = [...(D.months2025 || []), ...(D.months2026 || [])];
    const F = [];
    if (M && M.monthly && M.monthly.length) {
      const lab = M.monthly.map(r => mlab(r[0])),
        cnt = M.monthly.map(r => r[1]),
        avg = mavg(cnt, 12),
        last = M.monthly[M.monthly.length - 1];
      const prevY = M.monthly.find(r => r[0] === (+last[0].slice(0, 4) - 1) + last[0].slice(4));
      const t12 = cnt.slice(-12).reduce((s, x) => s + x, 0),
        p12 = cnt.slice(-24, -12).reduce((s, x) => s + x, 0);
      F.push({
        id: "homeSales",
        q: "How many homes sold each month?",
        status: "open",
        shows: "The number of homes sold in Davidson County each month, with the 12-month average as the trend line.",
        means: `${fmt(last[1])} homes sold in ${mlong(last[0])}${prevY ? `, ${cmp((last[1] / prevY[1] - 1) * 100, "more than", "fewer than")} in ${mlong(prevY[0])}` : ""}. Over the last 12 months, ${fmt(t12)} homes sold, ${cmp((t12 / p12 - 1) * 100, "more than", "fewer than")} the 12 months before.`,
        chart: line(lab, [{
          values: cnt,
          color: C.blue,
          width: 2
        }, {
          values: avg,
          color: C.gold,
          dash: true,
          width: 3
        }], {
          aria: "Homes sold each month since January 2020 with a 12-month average",
          xn: 8
        }) + legend([{
          name: "Homes sold",
          color: C.blue
        }, {
          name: "12-month average (trend)",
          color: C.gold,
          dash: true
        }]),
        head: ["Month", "Homes sold", "12-month average"],
        rows: M.monthly.map((r, i) => [mlab(r[0]), fmt(r[1]), avg[i] == null ? "" : fmt(avg[i])]),
        method: `Homes are residential properties. ${M.rules} The parcel file keeps only each property's latest sale, so earlier years count fewer sales than actually happened.`,
        source: M.source
      });
      const A = M.annual.filter(a => a.homeMedian),
        full = A.filter(a => a.months === 12),
        f0 = full[0],
        fl = full[full.length - 1];
      const growth = A.map((a, i) => i ? (a.homeMedian / A[i - 1].homeMedian - 1) * 100 : null),
        cagr = (Math.pow(fl.homeMedian / f0.homeMedian, 1 / (fl.year - f0.year)) - 1) * 100;
      F.push({
        id: "homeMedian",
        q: "What does a typical home cost, and how fast are prices growing?",
        status: "open",
        shows: "The median home sale price each year: half of homes sold for more, half for less. The gold line shows the trend.",
        means: `The typical home sold for ${usd(fl.homeMedian)} in ${fl.year}, ${cmp(growth[A.indexOf(fl)], "higher than", "lower than", 1)} in ${fl.year - 1}. Since ${f0.year}, the typical price rose ${pctp((fl.homeMedian / f0.homeMedian - 1) * 100)}, an average of ${pctp(cagr, 1)} a year.`,
        chart: bars(A.map(a => a.months < 12 ? a.year + " (to date)" : String(a.year)), A.map(a => a.homeMedian), {
          yf: usdK,
          top: (v, i) => usdK(v) + (growth[i] != null ? "  " + pct(growth[i], 1) : ""),
          colors: A.map(a => a.months < 12 ? C.sky : C.blue),
          trend: A.map(a => a.homeMedian),
          aria: "Median home sale price by year with growth rates"
        }) + legend([{
          name: "Median home price",
          color: C.blue
        }, {
          name: "Year to date",
          color: C.sky
        }, {
          name: "Trend",
          color: C.gold,
          dash: true
        }]),
        compare: {
          title: "Median value is increasing more rapidly than the number of properties transferred",
          text: "Wake County, 2014 to 2019: the median sales price rose from $223,000 to $303,000, a 6.3% compound annual growth rate. Over the same period, deed transfers grew 2.9% a year.",
          source: "Wake County Register of Deeds (Charles Gilliam), comparison slide. Wake County figures, not Davidson County."
        },
        head: ["Year", "Median home price", "Change from prior year", "Homes sold"],
        rows: A.map((a, i) => [a.year + (a.months < 12 ? " (to date)" : ""), usd(a.homeMedian), growth[i] == null ? "" : pct(growth[i], 1), fmt(a.homeSales)]),
        method: `Median of home sales of $10,000 or more. Annual growth = this year's median \u00f7 last year's median \u2212 1. Average yearly growth (${f0.year}\u2013${fl.year}) = (${fl.year} median \u00f7 ${f0.year} median)^(1 \u00f7 ${fl.year - f0.year}) \u2212 1.`,
        source: M.source
      });
      const bc = [C.navy, C.blue, C.sky, C.gold, C.grey];
      const bandPct = a => {
          const t = a.bands.reduce((s, x) => s + x, 0) || 1;
          return a.bands.map(x => Math.round(x / t * 100));
        },
        shareUnder = a => bandPct(a)[0] + bandPct(a)[1],
        shareOver = a => bandPct(a)[3] + bandPct(a)[4];
      F.push({
        id: "priceRanges",
        q: "What share of homes sell in each price range?",
        status: "open",
        shows: "Each bar is one year of home sales, divided by price range. The ranges add up to 100%.",
        means: `In ${f0.year}, ${pctp(shareUnder(f0))} of homes sold for under $400,000. In ${fl.year}, ${pctp(shareUnder(fl))} did. Homes at $600,000 and up grew from ${pctp(shareOver(f0))} to ${pctp(shareOver(fl))} of sales.`,
        chart: stack100(A.map(a => a.months < 12 ? a.year + "*" : String(a.year)), M.bandLabels.map((n, k) => ({
          name: n,
          color: bc[k],
          values: A.map(a => a.bands[k]),
          text: k === 3 ? C.ink : "#fff"
        })), {
          aria: "Share of home sales in each price range by year"
        }) + legend(M.bandLabels.map((n, k) => ({
          name: n,
          color: bc[k]
        }))) + `<p class="dfFoot">* Year to date.</p>`,
        head: ["Year", ...M.bandLabels],
        rows: A.map(a => [a.year + (a.months < 12 ? " (to date)" : ""), ...a.bands.map(b => pctp(b / a.homeSales * 100) + " (" + fmt(b) + ")")]),
        method: "Share in a range = home sales in that range \u00f7 all home sales that year. Shares let years be compared even when the number of sales changes.",
        source: M.source
      });
      if (M.byType && M.byType.length) {
        const TC = [C.navy, C.blue, C.sky, C.gold, C.slate, C.light],
          T = M.typeLabels,
          BT = M.byType,
          lt = BT.filter(b => (A.find(a => a.year === b.year) || {}).months === 12).pop() || BT[BT.length - 1];
        const tot = b => b.counts.reduce((x, y) => x + y, 0);
        const homeShare = BT.map(b => b.counts[0] / tot(b) * 100),
          n0 = homeShare.length,
          mx = (n0 - 1) / 2,
          my = homeShare.reduce((s, v) => s + v, 0) / n0,
          slope = homeShare.reduce((s, v, i) => s + (i - mx) * (v - my), 0) / (homeShare.reduce((s, v, i) => s + (i - mx) ** 2, 0) || 1),
          homeTrend = homeShare.map((v, i) => my + slope * (i - mx));
        F.push({
          id: "propertyTypes",
          q: "What kinds of property are selling?",
          status: "open",
          shows: "Each bar is one year of property sales, divided by type: homes, apartments, commercial, land, other, and parcels not yet classified. The types add up to 100%. The gold dashed line shows the trend in the home share.",
          means: `Homes were ${pctp(lt.counts[0] / tot(lt) * 100)} of the ${fmt(tot(lt))} property sales in ${lt.year}. Commercial property was ${pctp(lt.counts[2] / tot(lt) * 100, 1)}, and land was ${pctp(lt.counts[3] / tot(lt) * 100, 1)}.`,
          chart: stack100(BT.map(b => (A.find(a => a.year === b.year) || {}).months < 12 ? b.year + "*" : String(b.year)), T.map((n, k) => ({
            name: n,
            color: TC[k],
            values: BT.map(b => b.counts[k]),
            text: k >= 3 && k !== 4 ? C.ink : "#fff"
          })), {
            aria: "Share of property sales by type each year, with a trend line for the home share",
            trend: homeTrend
          }) + legend([...T.map((n, k) => ({
            name: n,
            color: TC[k]
          })), {
            name: "Trend (home share)",
            color: C.gold,
            dash: true
          }]) + `<p class="dfFoot">* Year to date.</p>`,
          head: ["Year", ...T.map(t => t + " (sales, median price)")],
          rows: BT.map(b => [b.year, ...b.counts.map((c, k) => fmt(c) + (b.medians[k] ? ", " + usd(b.medians[k]) : ""))]),
          method: `Type comes from the land-use description in Metro's parcel file. "Not yet classified" means the parcel had no land-use description yet, which is common for new construction. Apartment and commercial medians can swing widely because there are few sales. ${M.rules}`,
          source: M.source
        });
      }
      if (M.zips && M.zips.length) {
        const ZN = D.zipNames || {},
          top = M.zips.slice(0, 10),
          zl = z => z + (ZN[z] ? " " + ZN[z] : "");
        F.push({
          id: "zips",
          q: "Where are homes selling?",
          status: "open",
          shows: `The ten ZIP codes with the most home sales in the last 12 months (${mlong(M.zipPeriod[0])} to ${mlong(((m) => { const y = +m.slice(0, 4), mo = +m.slice(5); return mo === 1 ? (y - 1) + "-12" : y + "-" + String(mo - 1).padStart(2, "0"); })(M.zipPeriod[1]))}), with each ZIP's median home price.`,
          means: `${zl(top[0][0])} had the most home sales, ${fmt(top[0][1])}, at a median of ${usd(top[0][2])}. The GIS Map shows every ZIP code in the county. It counts the 12 months up to its download date${window.ROD_GIS_DATA && window.ROD_GIS_DATA.windowStart ? " (" + new Date(window.ROD_GIS_DATA.windowStart + "T12:00:00").toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"}) + " to " + new Date(window.ROD_GIS_DATA.asOf + "T12:00:00").toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"}) + ")" : ""} instead of whole months, so its ZIP counts can differ slightly from these.`,
          chart: hbars(top.map(r => zl(r[0])), top.map(r => r[1]), {
            fmtv: (v, i) => fmt(v) + " sales \u00b7 " + usdK(top[i][2]) + " median",
            aria: "Top ten ZIP codes by home sales in the last 12 months"
          }) + `<p class="dfFoot"><a href="#gis" data-tab-link="gis">Explore every ZIP code on the GIS Map \u2192</a></p>`,
          head: ["ZIP code", "Home sales (last 12 months)", "Median home price"],
          rows: M.zips.map(r => [zl(r[0]), fmt(r[1]), usd(r[2])]),
          method: `Home sales of $10,000 or more by the property's ZIP code. ZIP codes with fewer than 5 sales are not shown. ${M.rules}`,
          source: M.source
        });
      }
      const base = f0,
        idx = a => [a.homeMedian / base.homeMedian * 100, a.homeSales / base.homeSales * 100, shareUnder(a) / shareUnder(base) * 100];
      F.push({
        id: "marketTrends",
        q: "How has the housing market changed over six years?",
        status: "open",
        shows: `Three measures, each set to 100 in ${base.year}, so they can be compared on one chart. Above 100 means higher than ${base.year}.`,
        means: `Compared with ${base.year}, the typical home price in ${fl.year} was ${cmp(idx(fl)[0] - 100, "higher", "lower")}, and the share of homes selling for under $400,000 was ${cmp(idx(fl)[2] - 100, "higher", "lower")}. Recorded home sales were ${cmp(idx(fl)[1] - 100, "higher", "lower")} (earlier years undercount; see how we measure this).`,
        chart: line(full.map(a => String(a.year)), [{
          values: full.map(a => idx(a)[0]),
          color: C.navy,
          dots: true
        }, {
          values: full.map(a => idx(a)[1]),
          color: C.grey,
          dots: true
        }, {
          values: full.map(a => idx(a)[2]),
          color: C.gold,
          dots: true
        }], {
          min: 40,
          max: 160,
          yf: v => Math.round(v),
          aria: "Six-year index of home price, home sales, and share under $400,000"
        }) + legend([{
          name: "Typical home price",
          color: C.navy
        }, {
          name: "Homes sold",
          color: C.grey
        }, {
          name: "Share under $400,000",
          color: C.gold
        }]),
        head: ["Year", "Typical home price (index)", "Homes sold (index)", "Share under $400,000 (index)"],
        rows: full.map(a => [a.year, ...idx(a).map(v => v.toFixed(0))]),
        method: `Index = this year's value \u00f7 the ${base.year} value \u00d7 100. Full years only.`,
        source: M.source
      });
      if (M.population && M.population.years && M.population.years.length > 1) {
        const P = M.population,
          Y = P.years,
          l = Y[Y.length - 1],
          f = Y[0];
        const vals = Y.flatMap(y => [y.change, y.naturalIncrease, y.international, y.domestic]),
          lo = Math.min(0, ...vals),
          hi = Math.max(...vals);
        const step = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(lo), hi)))) * 5;
        F.push({
          id: "population",
          q: "What's behind the numbers?",
          status: "census",
          shows: "How Davidson County's population changed each year (July to July), and why: births minus deaths, people moving in from other countries, and people moving to or from other U.S. counties.",
          means: `From July ${l.year - 1} to July ${l.year}, Davidson County ${l.change >= 0 ? "grew" : "shrank"} by ${fmt(Math.abs(l.change))} people, to ${fmt(l.population)}: ${fmt(l.naturalIncrease)} more births than deaths, ${fmt(l.international)} from other countries, and ${l.domestic >= 0 ? "a gain of " + fmt(l.domestic) : "a loss of " + fmt(-l.domestic)} from moves between U.S. counties.${(() => { const r = l.change - (l.naturalIncrease + l.international + l.domestic); return r ? ` These parts add up to ${fmt(l.naturalIncrease + l.international + l.domestic)}; the Census Bureau total of ${fmt(l.change)} also includes a small residual (${r > 0 ? "+" : ""}${fmt(r)}) that it does not assign to births, deaths, or migration.` : ""; })()} Since ${f.year}, the population ${l.population >= f.population ? "grew" : "fell"} ${pctp(Math.abs(l.population / f.population - 1) * 100, 1)}. More residents means more demand for homes, one of several things that affect prices; this chart does not show that one causes the other.`,
          chart: line(Y.map(y => String(y.year)), [{
            values: Y.map(y => y.naturalIncrease),
            color: C.blue,
            dots: true
          }, {
            values: Y.map(y => y.international),
            color: C.navy,
            dots: true
          }, {
            values: Y.map(y => y.domestic),
            color: C.slate,
            dots: true
          }, {
            values: Y.map(y => y.change),
            color: C.gold,
            dots: true,
            dash: true,
            width: 3
          }], {
            min: Math.floor(lo / step) * step,
            max: Math.ceil(hi / step) * step,
            yf: v => (v > 0 ? "+" : "") + fmt(v),
            aria: "Components of population change by year"
          }) + legend([{
            name: "Births minus deaths",
            color: C.blue
          }, {
            name: "From other countries",
            color: C.navy
          }, {
            name: "To and from other U.S. counties",
            color: C.slate
          }, {
            name: "Total change",
            color: C.gold,
            dash: true
          }]),
          head: ["Year (July to July)", "Population", "Total change", "Births", "Deaths", "Births minus deaths", "International", "Domestic"],
          rows: Y.map(y => [`${y.year - 1}\u2013${y.year}`, fmt(y.population), (y.change > 0 ? "+" : "") + fmt(y.change), fmt(y.births), fmt(y.deaths), fmt(y.naturalIncrease), fmt(y.international), fmt(y.domestic)]),
          method: "Census Bureau county estimates of the components of population change. Total change also includes a small residual that Census cannot assign to one component. Census revises every earlier year with each new release, so the newest file is always loaded.",
          source: P.source
        });
      } else if (M.population) {
        const P = M.population;
        F.push({
          id: "population",
          q: "What's behind the numbers?",
          status: "census",
          shows: "How Davidson County's population changed in one year, and why: births minus deaths, people moving in from other countries, and people moving to other U.S. counties.",
          means: `Davidson County grew by about ${fmt(P.total)} people from ${P.period.replace(" to ", " to ")}: ${fmt(P.naturalIncrease)} more births than deaths, and ${fmt(P.international)} more people arriving from other countries, while about ${fmt(-P.domestic)} more people moved to other U.S. counties than came from them.${(() => { const s = P.naturalIncrease + P.international + P.domestic, r = P.total - s; return r ? ` These parts add up to ${fmt(s)}; the Census Bureau total of ${fmt(P.total)} also includes a small residual (${r > 0 ? "+" : ""}${fmt(r)}) that it does not assign to births, deaths, or migration.` : ""; })()} More residents means more demand for homes, one of several things that affect prices. This chart does not show that one causes the other.`,
          chart: bars(["Births minus deaths", "From other countries", "To and from other U.S. counties", "Total change"], [P.naturalIncrease, P.international, Math.abs(P.domestic), P.total], {
            colors: [C.blue, C.navy, C.grey, C.gold],
            top: (v, i) => (i === 2 ? "\u2212" : "+") + fmt(v),
            aria: "Components of population change, July 2024 to July 2025"
          }) + `<p class="dfFoot">The gray bar is a loss (more people moved out than in).</p>`,
          head: ["Component", "People"],
          rows: [
            ["Births minus deaths (natural increase)", "+" + fmt(P.naturalIncrease)],
            ["International migration", "+" + fmt(P.international)],
            ["Domestic migration", "\u2212" + fmt(-P.domestic) + " (about)"],
            ["Total change", "+" + fmt(P.total)]
          ],
          method: `${P.note} Census estimates run from July to July and are revised each year.`,
          source: P.source
        });
      }
    }
    return F;
  }

  function render() {
    const D = window.ROD_DASHBOARD_DATA,
      host = document.getElementById("dashFiguresBody");
    if (!D || !host) return;
    const F = figures(D);
    host.dataset.count = F.length;
    const ao = document.getElementById("asOf"),
      ad = D.market && D.market.asOf;
    if (ao && ad) ao.textContent = MONL[+ad.slice(5, 7) - 1] + " " + (+ad.slice(8, 10)) + ", " + ad.slice(0, 4);
    host.innerHTML = F.map((f, n) => `<article class="dfFig" id="fig-${f.id}" aria-labelledby="figq-${f.id}"><div class="dfHead"><span class="dfNum">Figure ${n + 1}</span>${(() => { const p = PV[PROV[f.id]]; return p ? `<span class="dfSource dfSrc-${p[0]}">${esc(p[1])}</span>` : ""; })()}</div>
      <h3 id="figq-${f.id}">${esc(f.q)}</h3><p class="dfShows"><strong>What this shows:</strong> ${esc(f.shows)}</p><div class="dfChart">${f.chart}</div>
      <p class="dfMeans"><strong>What it means:</strong> ${esc(f.means)}</p>
      ${f.compare ? `<aside class="dfCompare" aria-label="Wake County comparison"><h4>${esc(f.compare.title)}</h4><p>${esc(f.compare.text)}</p><p class="pNote">${esc(f.compare.source)}</p></aside>` : ""}
      <details class="dfMethod"><summary>How we measure this</summary><p>${esc(f.method)}</p><p><strong>Source:</strong> ${esc(f.source)}</p>${(() => { const p = PV[PROV[f.id]]; return p ? `<p><strong>How this data is loaded:</strong> ${esc(p[2])}</p>` : ""; })()}</details>
      <div class="dfActions"><button type="button" class="dfBtn" data-pdf="${f.id}">Download PDF report</button></div></article>`).join("");
    host._figs = F;
    const t = document.getElementById("dashGlance");
    if (t) t.innerHTML = glance(D, F);
    const ab = document.getElementById("dashAbout");
    if (ab) ab.innerHTML = about(D);
  }

  function glance(D, F) {
    const M = D.market,
      months = [...(D.months2025 || []), ...(D.months2026 || [])],
      out = [];
    if (M && M.monthly) {
      const l = M.monthly[M.monthly.length - 1],
        p = M.monthly.find(r => r[0] === (+l[0].slice(0, 4) - 1) + l[0].slice(4));
      const A = M.annual.filter(a => a.months === 12),
        a = A[A.length - 1],
        b = A[A.length - 2];
      out.push(["Homes sold", fmt(l[1]), mlong(l[0]) + (p ? ", " + cmp((l[1] / p[1] - 1) * 100, "more than", "fewer than") + " a year earlier" : ""), "dfPublic"], ["Typical home price", usd(a.homeMedian), a.year + ", " + cmp((a.homeMedian / b.homeMedian - 1) * 100, "higher than", "lower than", 1) + " " + b.year, "dfPublic"]);
    }
    return out.map(o => `<div class="dgTile ${o[3]}"><span class="dgLabel">${esc(o[0])}</span><span class="dgVal">${esc(o[1])}</span><span class="dgNote">${esc(o[2])}</span></div>`).join("");
  }

  function about(D) {
    const M = D.market || {},
      c = M.community,
      MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const longDate = x => x ? `${MON[+x.slice(5, 7) - 1]} ${+x.slice(8, 10)}, ${x.slice(0, 4)}` : "";
    const glue = t => String(t).replace(/\s+(\S+)$/, "\u00a0$1");
    const rows = [
      ["Dashboard title", esc("Recording Activity Dashboard")],
      ["Purpose", esc(glue("Home sales, home prices, and population change in Davidson County"))],
      ["Designed by", `<a href="https://victorialovefranklin.github.io/victoria-franklin-site/" target="_blank" rel="noopener">Victoria Love Franklin<span class="visually-hidden"> (opens in a new tab)</span></a>`],
      ["Data sources", esc(glue("Davidson County Register of Deeds (recorded deeds), Nashville Open Data (Metro parcel records), and the U.S. Census Bureau"))],
      ["Updated", esc(glue("Monthly, by the 10th"))],
      ["Data through", esc(glue(mlong(M.throughMonth || "")))],
      ["Source data downloaded", esc(glue(longDate(M.asOf)))]
    ];
    if (c) rows.push(["Community size", `${fmt(c.population)} residents (Census estimate, ${esc(glue(c.asOf))})`]);
    return `<h3 id="dFr-info">Dashboard information</h3>
      <dl class="daInfoList">${rows.map(r => `<div><dt>${esc(r[0])}</dt><dd>${r[1]}</dd></div>`).join("")}</dl>`;
  }

  function printSet(ids, title) {
    document.body.dataset.printTitle = title || "";
    document.querySelectorAll(".dfFig").forEach(f => f.classList.toggle("dfPrint", ids.includes(f.id.slice(4))));
    document.querySelectorAll(".dfFig.dfPrint details").forEach(d => {
      d.dataset.was = d.open;
      d.open = true;
    });
    document.body.classList.add("printFigures");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printFigures");
      document.querySelectorAll(".dfFig details").forEach(d => {
        if (d.dataset.was === "false") d.open = false;
      });
    }, 400);
  }
  document.addEventListener("click", e => {
    const host = document.getElementById("dashFiguresBody");
    if (!host) return;
    const p = e.target.closest("[data-pdf]"),
      r = e.target.closest("#dashReportBtn");
    if (p) printSet([p.dataset.pdf], "Davidson County Register of Deeds: Dashboard figure");
    if (r) printSet(["homeSales", "homeMedian", "priceRanges"], "Monthly Home Sales Report");
  });
  window.RodFigures = {
    render
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
