// Packs the game folder into one START-HERE.html. Used by build.html (in the browser).
// files = { "app/shell.html": "...text...", "content/scenarios-en.json": "...", ... }
(function (root) {
  "use strict";
  // The shareable file name. GitHub Pages still publishes the same HTML as index.html.
  var PLAYABLE = "principled-tech-the-dilemma-game.html";

  function buildGame(files) {
    var need = ["app/shell.html", "app/styles.css", "app/game.js", "content/i18n-en.json", "content/scenarios-en.json"];
    need.forEach(function (n) { if (files[n] == null) throw new Error("Missing file: " + n + " — choose the whole game folder."); });

    var data = { i18n: {}, scenarios: {}, settings: {}, humanityReasons: {}, costNotes: {}, storyboards: {}, stepArt: {} };
    Object.keys(files).forEach(function (path) {
      var name = path.split("/").pop();
      var m = name.match(/^(i18n|scenarios)-([a-z]{2,3})\.json$/);
      if (!m && name !== "settings.json" && name !== "humanity-reasons.json" && name !== "cost-notes.json") return;
      var json;
      try { json = JSON.parse(files[path]); }
      catch (e) { throw new Error(name + " is not valid JSON: " + e.message); }
      if (m) data[m[1]][m[2]] = json;
      else if (name === "humanity-reasons.json") data.humanityReasons = json;
      else if (name === "cost-notes.json") data.costNotes = json;
      else data.settings = json;
    });

    // Optional asset manifest: keep JSON editable and embed images for offline use.
    if (files["content/assets.json"]) {
      var assets = JSON.parse(files["content/assets.json"]);
      ["storyboards", "stepArt"].forEach(function (group) {
        Object.keys(assets[group] || {}).forEach(function (id) {
          var path = assets[group][id], image = files[path];
          if (typeof image !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)) {
            throw new Error("Missing or invalid illustration: " + path + " — choose the whole game folder.");
          }
          data[group][id] = image;
        });
      });
    }

    var safe = function (s) { return s.replace(/<\/script/gi, "<\\/script"); };
    var html = files["app/shell.html"]
      .replace("<!--STYLES-->", function () { return "<style>\n" + files["app/styles.css"] + "\n</style>"; })
      .replace("<!--SCRIPTS-->", function () {
        return "<script>window.GAME_DATA = " + safe(JSON.stringify(data)) + ";</script>\n  <script>\n" + safe(files["app/game.js"]) + "\n</script>";
      });
    return { html: html, filename: PLAYABLE, languages: Object.keys(data.i18n), scenarioCount: (data.scenarios.en || []).length };
  }

  root.buildGame = buildGame;
  if (typeof module !== "undefined") module.exports = { buildGame: buildGame, playableName: PLAYABLE };
})(typeof window !== "undefined" ? window : globalThis);
