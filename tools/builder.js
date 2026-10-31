// Packs the game folder into one START-HERE.html. Used by build.html (in the browser).
// files = { "app/shell.html": "...text...", "content/scenarios-en.json": "...", ... }
(function (root) {
  "use strict";

  function buildGame(files) {
    var need = ["app/shell.html", "app/styles.css", "app/game.js", "content/i18n-en.json", "content/scenarios-en.json"];
    need.forEach(function (n) { if (files[n] == null) throw new Error("Missing file: " + n + " — choose the whole game folder."); });

    var data = { i18n: {}, scenarios: {}, settings: {} };
    Object.keys(files).forEach(function (path) {
      var name = path.split("/").pop();
      var m = name.match(/^(i18n|scenarios)-([a-z]{2,3})\.json$/);
      if (!m && name !== "settings.json") return;
      var json;
      try { json = JSON.parse(files[path]); }
      catch (e) { throw new Error(name + " is not valid JSON: " + e.message); }
      if (m) data[m[1]][m[2]] = json; else data.settings = json;
    });

    var safe = function (s) { return s.replace(/<\/script/gi, "<\\/script"); };
    var html = files["app/shell.html"]
      .replace("<!--STYLES-->", function () { return "<style>\n" + files["app/styles.css"] + "\n</style>"; })
      .replace("<!--SCRIPTS-->", function () {
        return "<script>window.GAME_DATA = " + safe(JSON.stringify(data)) + ";</script>\n  <script>\n" + safe(files["app/game.js"]) + "\n</script>";
      });
    return { html: html, languages: Object.keys(data.i18n), scenarioCount: (data.scenarios.en || []).length };
  }

  root.buildGame = buildGame;
  if (typeof module !== "undefined") module.exports = { buildGame: buildGame };
})(typeof window !== "undefined" ? window : globalThis);
