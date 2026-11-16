/* Register of Deeds portal: request-data.js */
/* Request data: a form on the Dashboard that builds an email request to the Register of Deeds */
(() => {
  "use strict";
  const TO = "rod.infodesk@nashville.gov";
  const btn = document.getElementById("dReqBtn"),
    panel = document.getElementById("dReqPanel"),
    form = document.getElementById("dReqForm");
  if (!btn || !panel || !form) return;
  const open = show => {
    panel.hidden = !show;
    btn.setAttribute("aria-expanded", String(show));
    if (show) {
      const h = document.getElementById("dReqH");
      if (h) {
        h.setAttribute("tabindex", "-1");
        h.focus();
      }
    }
  };
  btn.addEventListener("click", () => open(panel.hidden));
  const close = document.getElementById("dReqClose");
  if (close) close.addEventListener("click", () => {
    open(false);
    btn.focus();
  });
  const val = n => {
    const el = form.elements[n];
    return el ? String(el.value || "").trim() : "";
  };
  const radio = n => {
    const el = form.querySelector(`input[name="${n}"]:checked`);
    return el ? el.value : "";
  };
  form.querySelectorAll('input[name="zipScope"]').forEach(r => r.addEventListener("change", () => {
    const z = form.elements.zipList;
    if (z) z.disabled = radio("zipScope") !== "list";
  }));
  form.querySelectorAll('input[name="recipScope"]').forEach(r => r.addEventListener("change", () => {
    const z = form.elements.recipient;
    if (z) z.disabled = radio("recipScope") !== "other";
  }));
  form.querySelectorAll('input[name="period"]').forEach(r => r.addEventListener("change", () => {
    ["from", "to"].forEach(n => {
      const el = form.elements[n];
      if (el) el.disabled = radio("period") !== "range";
    });
  }));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const msg = document.getElementById("dReqMsg"),
      errs = [];
    const picked = [...form.querySelectorAll('input[name="data"]:checked')].map(c => c.value);
    const other = val("other");
    if (!picked.length && !other) errs.push("Choose at least one kind of data, or describe your request under Other data request.");
    [
      ["name", "Full name"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["address", "Mailing address"]
    ].forEach(([n, l]) => {
      if (!val(n)) errs.push(l + " is required.");
    });
    if (val("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email"))) errs.push("Enter a valid email address.");
    if (radio("period") === "range" && (!val("from") || !val("to"))) errs.push("Enter both months for the time period, or choose Latest available.");
    if (radio("zipScope") === "list" && !val("zipList")) errs.push("List the ZIP codes, or choose All ZIP codes.");
    if (!val("purpose")) errs.push("Tell us how you will use the data.");
    if (radio("recipScope") === "other" && !val("recipient")) errs.push("Enter who will receive the data, or choose Me.");
    if (!form.elements.fee.checked) errs.push("Check the box to confirm you understand a processing fee may apply.");
    if (errs.length) {
      msg.className = "dReqMsg is-error";
      msg.innerHTML = "<strong>Please fix the following:</strong><ul>" + errs.map(x => `<li>${x.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</li>`).join("") + "</ul>";
      msg.focus();
      return;
    }
    const period = radio("period") === "range" ? `${val("from")} to ${val("to")}` : "Latest available";
    const zips = radio("zipScope") === "list" ? val("zipList") : "All ZIP codes";
    const lines = ["Data requested:", ...(picked.length ? picked.map(p => "- " + p) : ["- (see Other data request)"]),
      "Time period: " + period, "ZIP codes: " + zips, "Format: " + (radio("format") || "CSV"), "Delivery: " + (radio("delivery") || "Secure download link (emailed to you)"), "How the data will be used: " + val("purpose"), "",
      "Other data request:", other || "(none)", "",
      "Contact: " + [val("name"), val("org"), val("email"), val("phone")].filter(Boolean).join(", "), "Mailing address: " + val("address"), "Recipient: " + (radio("recipScope") === "other" ? val("recipient") : "Same as requester"), "",
      "I understand a processing fee may apply and that I'll receive an itemized estimate before any work begins."
    ];
    const href = `mailto:${TO}?subject=${encodeURIComponent("Data request: " + val("name"))}&body=${encodeURIComponent(lines.join("\r\n"))}`;
    msg.className = "dReqMsg is-ok";
    msg.innerHTML = `Your email app should open with your request filled in. Press Send to submit it. If it didn't open, email your request to <a href="mailto:${TO}">${TO}</a>.`;
    msg.focus();
    form.dataset.lastRequest = href;
    window.location.href = href;
  });
})();
