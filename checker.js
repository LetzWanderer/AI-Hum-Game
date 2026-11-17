// Checks the content JSON for common mistakes. Used by check.html and build.html.
// Returns { errors: [...], warnings: [...] } in plain language.
(function (root) {
  "use strict";
  var KEYS = ["humanity", "impartiality", "neutrality", "independence", "doNoHarm"];
  var SCEN_FIELDS = ["id", "title", "tagline", "role", "context", "topics", "roles", "debrief", "steps"];
  var OPT_FIELDS = ["id", "label", "detail", "consequence", "reflection", "impacts"];

  function checkContent(files) {
    var errors = [], warnings = [], parsed = {};
    Object.keys(files).forEach(function (path) {
      if (!/^content\/[^/]+\.json$/.test(path)) return;
      var name = path.slice(8);
      try { parsed[name] = JSON.parse(files[path]); }
      catch (e) { errors.push(name + ": not valid JSON (" + e.message + "). Look for a missing comma, quote or bracket."); }
    });

    // settings
    var st = parsed["settings.json"];
    if (!st) warnings.push("settings.json not found — all principle weights default to 1.");
    else {
      var w = st.weights || {};
      Object.keys(w).forEach(function (k) {
        if (KEYS.indexOf(k) < 0) errors.push("settings.json: unknown principle \"" + k + "\". Use: " + KEYS.join(", "));
        else if (typeof w[k] !== "number" || w[k] < 0) errors.push("settings.json: weight for " + k + " must be a number 0 or higher.");
      });
      if (st.strongShare != null && !(st.strongShare > 0 && st.strongShare <= 1)) errors.push("settings.json: strongShare must be between 0 and 1 (e.g. 0.5).");
    }

    var en = parsed["scenarios-en.json"];
    if (!Array.isArray(en)) { errors.push("scenarios-en.json is missing or not a list [ ... ]. English is required."); return { errors: errors, warnings: warnings }; }
    var ids = {};

    function checkList(file, list, isEn) {
      if (!Array.isArray(list)) { errors.push(file + ": should be a list [ ... ] of scenarios."); return; }
      var covered = {};
      list.forEach(function (s, i) {
        if (!s || typeof s !== "object" || Array.isArray(s)) { errors.push(file + " → scenario " + (i + 1) + ": should be an object { ... }."); return; }
        var where = file + " → scenario " + (i + 1) + (s.id ? " (" + s.id + ")" : "");
        SCEN_FIELDS.forEach(function (f) { if (s[f] == null) errors.push(where + ": missing \"" + f + "\"."); });
        ["topics", "roles"].forEach(function (f) { if (s[f] != null && !Array.isArray(s[f])) errors.push(where + ": \"" + f + "\" should be a list."); });
        if (isEn) { if (s.id && ids[s.id]) errors.push(where + ": id \"" + s.id + "\" is used twice."); if (s.id) ids[s.id] = s; }
        else if (s.id && !ids[s.id]) warnings.push(where + ": no English scenario with this id, so it will not appear.");
        var ref = s.id && ids[s.id];
        if (s.discuss != null && (!Array.isArray(s.discuss) || !s.discuss.length || s.discuss.some(function (q) { return typeof q !== "string" || !String(q).trim(); }))) {
          errors.push(where + ": \"discuss\" must be a list of questions.");
        }
        if (!Array.isArray(s.steps)) { errors.push(where + ": \"steps\" should be a list."); return; }
        var stepIds = {}, optIds = {};
        s.steps.forEach(function (stp, j) {
          var w2 = where + " → step " + (j + 1);
          if (!stp || typeof stp !== "object" || Array.isArray(stp)) { errors.push(w2 + ": should be an object { ... }."); return; }
          if (!stp.id) errors.push(w2 + ": missing \"id\".");
          else if (stepIds[stp.id]) errors.push(w2 + ": step id \"" + stp.id + "\" is used twice in this scenario.");
          else stepIds[stp.id] = true;
          if (!stp.title) errors.push(w2 + ": missing \"title\".");
          if (!stp.narrative) errors.push(w2 + ": missing \"narrative\".");
          if (!Array.isArray(stp.options) || stp.options.length < 2) errors.push(w2 + ": needs at least 2 options.");
          (Array.isArray(stp.options) ? stp.options : []).forEach(function (o, k) {
            var w3 = w2 + " → option " + (k + 1);
            if (!o || typeof o !== "object" || Array.isArray(o)) { errors.push(w3 + ": should be an object { ... }."); return; }
            OPT_FIELDS.forEach(function (f) { if (o[f] == null) errors.push(w3 + ": missing \"" + f + "\"."); });
            if (o.id && optIds[o.id]) errors.push(w3 + ": option id \"" + o.id + "\" is used twice in this scenario.");
            if (o.id) optIds[o.id] = true;
            if (!o.impacts || typeof o.impacts !== "object" || Array.isArray(o.impacts)) errors.push(w3 + ": \"impacts\" should be an object of principle scores.");
            else Object.keys(o.impacts).forEach(function (p) {
              if (KEYS.indexOf(p) < 0) errors.push(w3 + ": unknown principle \"" + p + "\". Use: " + KEYS.join(", "));
              else if (typeof o.impacts[p] !== "number" || o.impacts[p] < -2 || o.impacts[p] > 2) errors.push(w3 + ": impact for " + p + " must be a number from -2 to 2.");
              else if (o.impacts[p]) covered[p] = true;
            });
            if (!isEn && ref && Array.isArray(ref.steps)) {
              var rs = ref.steps[j], ro = rs && Array.isArray(rs.options) && rs.options[k];
              if (!rs || rs.id !== stp.id) errors.push(w2 + ": step id should match English (\"" + (rs && rs.id) + "\").");
              else if (!ro || ro.id !== o.id) errors.push(w3 + ": option id should match English (\"" + (ro && ro.id) + "\").");
              else if (JSON.stringify(ro.impacts) !== JSON.stringify(o.impacts)) warnings.push(w3 + ": scores differ from English — usually they should be the same.");
            }
          });
        });
        if (!isEn && ref && Array.isArray(ref.steps) && s.steps.length !== ref.steps.length) errors.push(where + ": has " + s.steps.length + " steps; English has " + ref.steps.length + ".");
      });
      if (isEn) KEYS.forEach(function (k) { if (!covered[k]) warnings.push(file + ": no choice moves \"" + k + "\". Players will see it as not tested."); });
    }
    checkList("scenarios-en.json", en, true);

    var uiEn = parsed["i18n-en.json"] || {};
    if (!Array.isArray(uiEn.discussPrompts) || !uiEn.discussPrompts.length) errors.push("i18n-en.json: \"discussPrompts\" must be a list of questions.");
    Object.keys(parsed).forEach(function (name) {
      var m = name.match(/^scenarios-([a-z]{2,3})\.json$/);
      if (m && m[1] !== "en") {
        checkList(name, parsed[name], false);
        var rows = parsed[name];
        var have = Array.isArray(rows) ? rows.map(function (s) { return s && s.id; }) : [];
        en.forEach(function (s) { if (have.indexOf(s.id) < 0) warnings.push(name + ": \"" + s.title + "\" not translated yet — English will be shown."); });
      }
      var u = name.match(/^i18n-([a-z]{2,3})\.json$/);
      if (u && u[1] !== "en") {
        Object.keys(uiEn).forEach(function (k) { if (parsed[name][k] == null) warnings.push(name + ": missing \"" + k + "\" — English will be used."); });
        if (parsed[name].discussPrompts != null && !Array.isArray(parsed[name].discussPrompts)) errors.push(name + ": \"discussPrompts\" should be a list of questions.");
        if (!parsed["scenarios-" + u[1] + ".json"]) warnings.push("i18n-" + u[1] + ".json has no scenarios-" + u[1] + ".json — all scenarios will be in English.");
      }
    });
    return { errors: errors, warnings: warnings };
  }

  root.checkContent = checkContent;
  if (typeof module !== "undefined") module.exports = { checkContent: checkContent };
})(typeof window !== "undefined" ? window : globalThis);
