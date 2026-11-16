/* Register of Deeds portal: data-blocks.js
   Turns the data files in js/data/ into the JSON blocks the page scripts read.
   Load it after the data files and before the page scripts. */
(function () {
  var D = window.ROD_DATA || {};
  Object.keys(D).forEach(function (id) {
    if (document.getElementById(id)) return;
    var s = document.createElement("script");
    s.type = "application/json";
    s.id = id;
    s.textContent = JSON.stringify(D[id]);
    (document.body || document.head).appendChild(s);
  });
})();
