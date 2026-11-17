// AI in Humanitarian Action — plain JavaScript, no libraries, no AI.
// Content comes from window.GAME_DATA = { i18n: {en: {...}}, scenarios: {en: [...]}, settings: {...} }
// which tools/build.html packs into START-HERE.html from the files in /content.
(function () {
  "use strict";

  var NAMES = { en: "English", sv: "Svenska", fr: "Français", es: "Español", ar: "العربية", de: "Deutsch", it: "Italiano", pt: "Português", nl: "Nederlands", pl: "Polski", uk: "Українська", ru: "Русский" };
  var RTL = ["ar", "fa", "he", "ur"];
  // Languages = every content/i18n-xx.json file (English first). Optional "languageName" in the file sets the menu label.
  var LANGS = Object.keys(window.GAME_DATA.i18n).sort(function (a, b) { return a === "en" ? -1 : b === "en" ? 1 : 0; })
    .map(function (c) { return [c, window.GAME_DATA.i18n[c].languageName || NAMES[c] || c]; });
  var KEYS = ["humanity", "impartiality", "neutrality", "independence"];
  // "Do No Harm" is part of Humanity, not a separate Fundamental Principle: scenario files may still
  // list doNoHarm impacts; they are added to humanity when the game loads (content files stay unchanged).
  (function foldDoNoHarm() {
    Object.keys(window.GAME_DATA.scenarios || {}).forEach(function (lang) {
      (window.GAME_DATA.scenarios[lang] || []).forEach(function (sc) {
        (sc.steps || []).forEach(function (st) {
          (st.options || []).forEach(function (o) {
            var im = o.impacts || {};
            if (im.doNoHarm) { im.humanity = (im.humanity || 0) + im.doNoHarm; }
            delete im.doNoHarm;
          });
        });
      });
    });
    Object.keys(window.GAME_DATA.i18n || {}).forEach(function (lang) {
      var tt = window.GAME_DATA.i18n[lang];
      if (tt.principles) tt.principles = tt.principles.filter(function (p) { return p.key !== "doNoHarm"; });
      (tt.takeaways || []).forEach(function (q) {
        if (q && q.principles) q.principles = q.principles.map(function (k) { return k === "doNoHarm" ? "humanity" : k; })
          .filter(function (k, i, a) { return a.indexOf(k) === i; });
      });
    });
  })();
  var ICONS = {
    humanity: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z",
    impartiality: "M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z",
    neutrality: "M4 12h16M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z",
    independence: "M12 3l3 6 6 .9-4.5 4.3 1 6.3L12 17.6 6.5 20.5l1-6.3L3 9.9 9 9z",
    doNoHarm: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z",
  };
  // One line-icon per scenario, same style everywhere (cards, briefing, status panel). Unknown ids get a generic icon.
  var SCENE = {
    "flood-line": "M3 15c2 0 2-1.5 4.5-1.5S9 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S9 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19M12 3l5 5v3H7V8z",
    "targeting-unseen": "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M2 12h4M18 12h4",
    "front-line": "M4 4l7 4 7-4v14l-7 4-7-4zM11 8v14",
    "cloud-question": "M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9zM12 11v3M12 16v.5",
    "edge-network": "M12 20v-6M8.5 10.5a5 5 0 0 1 7 0M5.5 7.5a9 9 0 0 1 13 0M12 14m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
    "signals-noise": "M4 6h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM20 9h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v2l-3-2",
    "outbreak-signal": "M3 12h4l2-5 4 10 2-5h6",
    "boardroom-test": "M4 20V10h16v10M2 20h20M8 10V6h8v4M8 14h2M14 14h2",
    "clinic-notes": "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4M12 6v0",
    "invoice-engine": "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h3",
    "volunteer-roster": "M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M12 13h2M8 16h2",
    "heat-wave": "M12 3v10a3 3 0 1 0 2 0V3a1 1 0 0 0-2 0zM17 5h3M17 9h3M5 8a3 3 0 0 0 0 6",
  };
  function sceneIcon(s, cls) { return '<span class="sicon' + (cls ? " " + cls : "") + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + (SCENE[s.id] || "M12 3l9 16H3z") + '"/></svg></span>'; }
  // Visual cues describe the action, never its score; shared by every translation.
  var CHOICE_CUES = {
    fl: ["speed safeguard people", "tools safeguard tools", "speed safeguard tools", "people tools people"],
    tu: ["speed people tools", "speed people people", "tools safeguard tools", "speed safeguard people"],
    fo: ["tools safeguard people", "safeguard safeguard tools", "tools safeguard people", "tools people people"],
    cq: ["speed tools tools", "tools safeguard safeguard", "speed people safeguard", "tools safeguard tools"],
    en: ["tools tools people", "tools people tools", "tools safeguard tools", "tools people people"],
    sn: ["tools safeguard people", "speed people safeguard", "tools people safeguard", "tools safeguard people"],
    os: ["speed safeguard people", "tools people safeguard", "tools safeguard safeguard", "speed people people"],
    bt: ["speed safeguard safeguard", "safeguard tools tools", "speed people safeguard", "tools people safeguard"],
    cn: ["tools safeguard people", "tools people safeguard", "tools safeguard people", "tools safeguard people"],
    ie: ["tools tools people", "speed safeguard people", "tools safeguard tools", "speed people people"],
    vr: ["tools people tools", "tools safeguard people", "tools people people", "tools safeguard people"],
    hw: ["tools tools safeguard", "tools people people", "tools tools tools", "speed people people"]
  };
  var ACTION_ICONS = {
    speed: "M13 2L4 14h7l-1 8 10-12h-7z",
    safeguard: ICONS.doNoHarm,
    people: "M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6M16 5a3 3 0 1 1 0 6M2 21v-5a5 5 0 0 1 10 0v5M15 14a5 5 0 0 1 7 2v5",
    tools: "M3 4h18v13H3zM8 21h8M12 17v4M7 9h3M14 9h3M7 13h10"
  };
  function choiceCue(o) {
    var parts = o.id.match(/^([a-z]+)-(\d+)([a-c])$/);
    var row = parts && (CHOICE_CUES[parts[1]] || [])[Number(parts[2]) - 1];
    return row ? row.split(" ")[parts[3].charCodeAt(0) - 97] : "tools";
  }
  function actionIcon(o) {
    return '<span class="action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="' + ACTION_ICONS[choiceCue(o)] + '"/></svg></span>';
  }
  // A qualitative three-way field brief, using only the scenario's existing choices.
  function snapshot(s) {
    return '<div class="snapshot" aria-hidden="true"><div class="snapshot-origin">' + sceneIcon(s) + '</div><div class="snapshot-paths">' + s.steps[0].options.map(function (o) {
      return '<div class="snapshot-node">' + actionIcon(o) + '<span>' + esc(o.label) + '</span></div>';
    }).join("") + '</div></div>';
  }
  function hook(s) { return s.hook || s.tagline; }
  function storyboard(s) {
    var src = D.storyboards && D.storyboards[s.id];
    return src ? '<img class="storyboard" src="' + esc(src) + '" alt="" width="1152" height="576" loading="lazy" decoding="async">' : '';
  }
  var STORE = "hai-game-v1";
  var D = window.GAME_DATA;
  var SET = D.settings || {};
  var W = {}; KEYS_W(); function KEYS_W() { KEYS.forEach(function (k) { var w = SET.weights && SET.weights[k]; W[k] = typeof w === "number" ? w : 1; }); }
  var SHARE = typeof SET.strongShare === "number" ? SET.strongShare : 0.5;

  // ---------- saved state (only on this device) ----------
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) {}
  var state = {
    lang: saved.lang || "en", mode: saved.mode === "workshop" ? "workshop" : "solo",
    progress: saved.progress || {}, drafts: saved.drafts || {},
    view: "home", entered: false, picked: false, id: null, phase: "briefing", play: null, selected: null, more: false, copied: false, topic: "", sort: "default",
  };
  var feedbackApi = window.GAME_FEEDBACK, ratings = {}, sentFeedback = {}, feedbackIds = {};
  var timer = { minutes: 3, left: 180, running: false, handle: null };
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ lang: state.lang, mode: state.mode, progress: state.progress, drafts: state.drafts })); } catch (e) {}
  }

  // ---------- content with English fallback ----------
  function ui() { return Object.assign({}, D.i18n.en, D.i18n[state.lang] || {}); }
  function scenarios() {
    var local = D.scenarios[state.lang] || [];
    return D.scenarios.en.map(function (s) { return local.find(function (l) { return l.id === s.id; }) || s; });
  }
  function current() { return scenarios().find(function (x) { return x.id === state.id; }); }

  // ---------- scoring ----------
  function empty() { var o = {}; KEYS.forEach(function (k) { o[k] = 0; }); return o; }
  function findOption(s, stepId, optId) {
    var st = s.steps.find(function (x) { return x.id === stepId; });
    return st && st.options.find(function (o) { return o.id === optId; });
  }
  function totalsFor(s, choices) {
    var t = empty();
    choices.forEach(function (c) { var o = findOption(s, c.stepId, c.optionId); if (o) KEYS.forEach(function (k) { t[k] += (o.impacts[k] || 0) * W[k]; }); });
    return t;
  }
  function boundsFor(s) {
    var max = empty(), min = empty();
    s.steps.forEach(function (st) {
      KEYS.forEach(function (k) {
        var v = st.options.map(function (o) { return (o.impacts[k] || 0) * W[k]; });
        max[k] += Math.max.apply(null, v.concat(0)); min[k] += Math.min.apply(null, v.concat(0));
      });
    });
    return { max: max, min: min };
  }
  function done(s) { return (state.progress[s.id] || []).length === s.steps.length; }
  function rating(t, v, max, min) {
    if (max === 0 && min === 0) return [t.ratingNotTested, "warning"];
    if (v > 0 && v >= max * SHARE) return [t.ratingStrong, "success"];
    if (v >= 0) return [t.ratingMixed, "warning"];
    return [t.ratingAtRisk, "danger"];
  }
  function verdict(t, totals, max) {
    var net = 0, best = 0; KEYS.forEach(function (k) { net += totals[k]; best += max[k]; });
    if (net < 0) return [t.verdictAtRisk, "danger"];
    if (best > 0 && net >= best * SHARE) return [t.verdictStrong, "success"];
    return [t.verdictMixed, "warning"];
  }
  function takeawayText(q) { return typeof q === "string" ? q : q.text; }
  function takeawayKeys(q) { return typeof q === "string" || !q.principles ? [] : q.principles; }
  function weakest(t, totals, bounds) {
    var best = null;
    KEYS.forEach(function (k) {
      var r = rating(t, totals[k], bounds.max[k], bounds.min[k]);
      if (r[0] === t.ratingNotTested || r[1] === "success") return;
      var rank = totals[k] < 0 ? 0 : 1;
      var score = totals[k] / Math.max(totals[k] < 0 ? Math.abs(bounds.min[k]) : bounds.max[k], 1);
      if (!best || rank < best.rank || (rank === best.rank && score < best.score)) best = { key: k, rank: rank, score: score, rating: r[0] };
    });
    return best;
  }
  // Add negative weighted impacts only: positive gains must not hide harm elsewhere.
  function lowestChoice(s, choices) {
    var found = [], low = 0;
    choices.forEach(function (c) {
      var o = findOption(s, c.stepId, c.optionId);
      if (!o) return;
      var v = KEYS.reduce(function (sum, k) { return sum + Math.min(0, ((o.impacts && o.impacts[k]) || 0) * W[k]); }, 0);
      if (v < low) { low = v; found = [{ option: o, impact: v }]; }
      else if (v < 0 && v === low) found.push({ option: o, impact: v });
    });
    return found;
  }
  function weakKeys(t, totals, bounds) {
    return KEYS.filter(function (k) {
      var r = rating(t, totals[k], bounds.max[k], bounds.min[k]);
      return r[1] !== "success" && r[0] !== t.ratingNotTested;
    });
  }
  // Workshop: option with most votes (ties → earlier option), or none if nobody voted.
  function leading(votes, ids) {
    var best = null, max = 0;
    ids.forEach(function (id) { var v = (votes && votes[id]) || 0; if (v > max) { max = v; best = id; } });
    return best;
  }
  function split(t, st, v) {
    return st.options.map(function (o, j) { return t.optionLetters[j] + " " + ((v && v[o.id]) || 0); }).join(" · ");
  }
  function hasVotes(v) { return v && Object.keys(v).some(function (k) { return v[k]; }); }

  // ---------- tiny html helpers ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function raw(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function fmt(s, v) { return esc(raw(s, v)); }
  function icon(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[k] + '"/></svg>'; }
  function pname(t, k) { var p = t.principles.find(function (x) { return x.key === k; }); return p ? p.name : k; }
  function langSelect(t) {
    return '<select data-lang aria-label="' + esc(t.languageLabel) + '">' + LANGS.map(function (l) {
      return '<option value="' + l[0] + '"' + (l[0] === state.lang ? " selected" : "") + ">" + l[1] + "</option>";
    }).join("") + "</select>";
  }
  function otherOptions(t, step, chosen) {
    var rest = (step.options || []).filter(function (opt) { return opt.id !== chosen.id; });
    if (!rest.length) return "";
    return '<details class="box"><summary>' + esc(t.otherOptions) + '</summary><div class="alts">' + rest.map(function (opt) {
      return '<div><b>' + esc(opt.label) + "</b><p>" + esc(opt.reflection) + "</p>" + impacts(t, opt.impacts, opt.id) + "</div>";
    }).join("") + "</div></details>";
  }
  function costNote(t, s) {
    var all = window.GAME_DATA.costNotes || {}, note = (all[state.lang] || all.en || {})[s.id];
    if (!note) return "";
    return '<section class="cost-note"><h2>' + esc(t.costEnvironmentHeading) + '</h2><p class="muted">' + esc(t.costEnvironmentNote) + '</p><p class="debrief-text">' + esc(note) + "</p></section>";
  }
  function impacts(t, imp, optionId) {
    return KEYS.filter(function (k) { return typeof imp[k] === "number"; }).map(function (k) {
      var v = imp[k];
      var badge = '<span class="impact pc-' + k + (v < 0 ? " neg" : "") + '">' + icon(k) + esc(pname(t, k)) + " " + (v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0") + "</span>";
      var reasons = window.GAME_DATA.humanityReasons || {};
      var reason = k === "humanity" && optionId && reasons[state.lang] && reasons[state.lang][optionId];
      return reason ? '<span class="impact-explained">' + badge + '<span class="impact-reason">' + esc(reason) + '</span></span>' : badge;
    }).join("");
  }
  function meter(t, k, v, max, min) {
    var p = t.principles.find(function (x) { return x.key === k; });
    var pct = Math.min(Math.abs(v) / Math.max(max, Math.abs(min), 1), 1) * 50;
    var r = rating(t, v, max, min);
    var fill = v === 0 ? "" : '<div class="fill" style="' + (v > 0
      ? "inset-inline-start:50%;width:" + pct + "%;background:var(--pc)"
      : "inset-inline-end:50%;width:" + pct + "%;background:var(--bad);opacity:.7") + '"></div>';
    return '<div class="box meter pc-' + k + '"><div class="head"><span class="icon">' + icon(k) + "</span><p>" + esc(p.name) +
      '</p><span class="tone ' + r[1] + '">' + esc(r[0]) + (v ? " (" + (v > 0 ? "+" : "") + v + ")" : "") + "</span></div>" +
      '<div class="track" role="img" aria-label="' + esc(p.name + ": " + r[0] + ", " + v) + '"><div class="mid"></div>' + fill + "</div>" +
      '<p class="muted">' + esc(p.description) + "</p></div>";
  }
  // Spider/radar chart: one axis per principle; dashed ring = neutral, outer ring = best possible, centre = worst.
  function radar(t, totals, max, min) {
    var n = KEYS.length, cx = 130, cy = 130, R = 95, pts = [], axes = "", labels = "", legend = "", rings = "";
    function xy(i, r) { var a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      rings += '<polygon class="ring' + (f === 0.5 ? " mid" : "") + '" points="' + KEYS.map(function (k, i) { return xy(i, R * f).join(","); }).join(" ") + '"/>';
    });
    KEYS.forEach(function (k, i) {
      var lo = min[k], hi = max[k], v = totals[k];
      var f = 0.5 + (v >= 0 ? (hi > 0 ? v / hi : 0) : (lo < 0 ? -v / lo : 0)) * 0.5;
      f = Math.max(0.04, Math.min(1, f));
      pts.push(xy(i, R * f).join(","));
      var e = xy(i, R), l = xy(i, R + 18), p = t.principles.find(function (x) { return x.key === k; });
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '"/>';
      // Icon with its principle name right next to it, placed outside the ring so nothing covers the shape.
      var c = Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n), nm = esc(p ? p.name : k), ix, tx, anc;
      if (c > 0.3) { ix = l[0] - 6; tx = ix + 28; anc = "start"; }
      else if (c < -0.3) { ix = l[0] - 10; tx = ix - 4; anc = "end"; }
      else { ix = l[0] - 50; tx = ix + 28; anc = "start"; }
      labels += '<svg x="' + ix + '" y="' + (l[1] - 12) + '" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[k] + '"/></svg>' +
        '<text x="' + tx + '" y="' + (l[1] + 6) + '" text-anchor="' + anc + '">' + nm + '</text>';
    });
    return '<div class="radar-chart"><svg class="radar" viewBox="-120 0 500 260" role="img" aria-label="' + esc(t.principlesBalance) + '">' + rings + axes +
      '<polygon class="shape" points="' + pts.join(" ") + '"/>' + labels + '</svg></div>';
  }
  // Scenario colours: brand tokens by default, or optional "colors": ["#hex", "#hex"] in the scenario JSON.
  function accent(s) {
    var c = s.colors && s.colors.length === 2 ? ' style="--acc:' + esc(s.colors[0]) + ";--acc2:" + esc(s.colors[1]) + '"' : "";
    return c.trim();
  }
  function box(label, html) { return '<section class="box"><p class="label">' + esc(label) + "</p>" + html + "</section>"; }

  function feedbackForm(t, s) {
    if (!feedbackApi) return "";
    if (sentFeedback[s.id]) return '<p class="muted feedback-thanks">' + esc(t.feedbackThanks) + '</p>';
    return '<details class="scenario-feedback"><summary>' + esc(t.feedbackHeading) + '</summary><form data-feedback="' + esc(s.id) + '"><fieldset><legend>' + esc(t.feedbackQuestion) + '</legend><div class="feedback-stars">' + [1,2,3,4,5].map(function (n) {
      return '<label><input type="radio" name="rating" value="' + n + '" required><span>★</span><span class="muted">' + n + '</span></label>';
    }).join("") + '</div></fieldset><label>' + esc(t.feedbackComment) + '<textarea name="comment" maxlength="500" rows="3"></textarea></label><p class="muted">' + esc(t.feedbackPrivacy) + '</p><button class="btn small" type="submit">' + esc(t.feedbackSend) + '</button><p class="muted" data-feedback-status role="status"></p></form></details>';
  }

  // ---------- home ----------
  function home(t) {
    var list = scenarios(), totals = empty(), max = empty(), min = empty(), count = 0;
    list.forEach(function (s) {
      if (!done(s)) return; count++;
      var tt = totalsFor(s, state.progress[s.id]), b = boundsFor(s);
      KEYS.forEach(function (k) { totals[k] += tt[k]; max[k] += b.max[k]; min[k] += b.min[k]; });
    });
    var modes = ["solo", "workshop"].map(function (m) {
      return '<button class="mode" role="radio" data-mode="' + m + '" aria-checked="' + (state.mode === m) + '"><b>' +
        esc(m === "solo" ? t.modeSolo : t.modeWorkshop) + "</b><small>" + esc(m === "solo" ? t.modeSoloHint : t.modeWorkshopHint) + "</small></button>";
    }).join("");
    var guide = true ? '<details class="box"><summary>' + esc(t.guideHeading) + ' +</summary><ol class="guide" style="padding:0;list-style:none">' +
      t.guideSteps.map(function (g, i) { return '<li><span class="letter">' + (i + 1) + "</span><span>" + esc(g) + "</span></li>"; }).join("") +
      '</ol><p class="muted" style="margin-top:12px;font-size:12px">' + esc(t.guideNote) + "</p></details>" : "";
    var record = count ? '<section class="box"><h2>' + esc(t.recordHeading) + '</h2><p class="muted">' + fmt(t.recordSummary, { n: count }) +
      '</p>' + radar(t, totals, max, min) + '<div class="grid two">' + KEYS.map(function (k) { return meter(t, k, totals[k], max[k], min[k]); }).join("") + "</div></section>" : "";
    var visible = list.filter(function (s) {
      return !state.topic || [s.title, s.tagline].concat(s.topics || []).join(" ").toLocaleLowerCase().indexOf(state.topic.toLocaleLowerCase()) >= 0;
    });
    if (state.sort === "rated") visible.sort(function (a, b) { return ((ratings[b.id] || {}).average_rating || 0) - ((ratings[a.id] || {}).average_rating || 0); });
    var cards = visible.map(function (s) {
      var dr = state.drafts[s.id], r = ratings[s.id];
      var go = dr ? fmt(t.inProgress, { i: dr.choices.length + 1, n: s.steps.length }) + " · " + esc(t.resume)
        : esc(done(s) ? t.playAgain : t.startScenario);
      return '<li ' + accent(s) + '><button class="scard" data-open="' + esc(s.id) + '"><div class="sband grad">' + sceneIcon(s) + '<h3>' + esc(s.title) + '</h3>' + (done(s) ? '<span class="chip">✓</span>' : "") + '</div><div class="body"><span class="muted">' + esc(hook(s)) + '</span><div class="tags">' +
        (s.topics || []).slice(0, 2).map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join("") + '</div>' +
        (r ? '<span class="muted">★ ' + esc(r.average_rating) + '/5 · ' + fmt(t.feedbackCount, { n: r.rating_count }) + '</span>' : "") +
        '<span class="go">' + go + ' →</span></div></button>' + '</li>';
    }).join("");
    var topicSet = []; list.forEach(function (s) { (s.topics || []).forEach(function (x) { if (topicSet.indexOf(x) < 0) topicSet.push(x); }); });
    var filter = '<div class="scenario-tools"><datalist id="topic-list">' + topicSet.sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + '</datalist><input type="search" list="topic-list" data-topic aria-label="' + esc(t.filterLabel) + '" placeholder="' + esc(t.searchTopics) + '" value="' + esc(state.topic) + '"><select data-sort aria-label="' + esc(t.sortLabel) + '"><option value="default">' + esc(t.allScenarios) + '</option><option value="rated"' + (state.sort === "rated" ? " selected" : "") + '>' + esc(t.topRated) + '</option></select></div>';
    var principles = t.principles.map(function (p) {
      return '<li class="prow pc-' + p.key + '"><span class="icon">' + icon(p.key) + "</span><details class=\"pdesc\"><summary><b>" + esc(p.name) + '</b> +</summary><p class="muted">' + esc(p.description) + "</p></details></li>";
    }).join("");
    var footer = '<footer class="footer"><p>' + esc(t.footerNote) + '</p><a href="https://preparecenter.org/site/ict-resolution/" target="_blank" rel="noreferrer">' +
      esc(t.ictLinkLabel) + "</a></footer>";
    // Step 1 — landing: what the game is, what it measures, then solo or group.
    // Step 0 — cover: title, one-line hook, Start game (slides away on click).
    if (!state.entered && !state.picked) {
      return '<div class="cover"><header class="grad"><div class="wrap hero"><div class="top">' + langSelect(t) + '</div><h1>' + esc(t.appTitle) + '</h1><p class="subtitle">' + esc(t.subtitle) + '</p><p class="cover-hook">' + esc(t.coverHook) +
        '</p><button class="btn start" data-act="enter">' + esc(t.startGame) + ' →</button><p class="kicker cover-kicker">' + esc(t.kicker) + "</p></div></header></div>";
    }
    if (!state.picked) {
      var picks = [["solo", t.pickSolo || t.playSolo], ["workshop", t.pickTogether || t.startWorkshop]].map(function (m) {
        return '<button class="btn playbtn" data-pick="' + m[0] + '">' + esc(m[1]) + " →</button>";
      }).join("");
      return '<div class="enter-in"><header class="bar"><div class="wrap"><span><button class="back" data-act="cover">← ' + esc(t.appTitle) + "</button></span>" +
        langSelect(t) + '</div></header><main class="wrap stack" style="padding-top:20px">' +
        '<section class="box playbox"><h2>' + esc(t.pickHeading) + '</h2><div class="playbtns">' + picks + "</div></section>" +
        '<section class="box intro-box"><h2>' + esc(t.aboutHeading) + '</h2><p class="intro">' + esc(t.intro) + '</p></section>' +
        '<section class="box pguide"><h2>' + esc(t.principlesHeading) + '</h2><ul class="pgrid">' + principles + "</ul></section>" +
        (t.howToPlaySteps ? '<details class="box howto"><summary>' + esc(t.howToPlayHeading) + ' +</summary><ol class="guide" style="padding:0;list-style:none">' +
          t.howToPlaySteps.map(function (g, i) { return '<li><span class="letter">' + (i + 1) + "</span><span>" + esc(g) + "</span></li>"; }).join("") + "</ol></details>" : "") +
        "</main></div>";
    }
    // Step 2 — scenarios for the chosen way of playing (workshop guide only for group play).
    var ws = state.mode === "workshop";
    return '<div><header class="bar"><div class="wrap"><span><button class="back" data-act="landing">← ' + esc(t.appTitle) + "</button></span>" +
      langSelect(t) + '</div></header><main class="wrap stack" style="padding-top:20px">' +
      '<p><span class="chip">' + esc(ws ? t.workshopBadge : t.playSolo) + "</span></p>" + (ws ? guide : "") +
      '<section><div class="rowhead"><h2>' + esc(t.scenariosHeading) + '</h2><span class="muted">' + fmt(t.progressOverall, { n: count, m: list.length }) +
      '</span></div><div class="pbar"><div style="width:' + (count / list.length) * 100 + '%"></div></div>' + filter + '<ul class="grid two">' + cards + "</ul></section>" + record +
      '<section class="box pguide"><h2>' + esc(t.principlesHeading) + '</h2><ul class="pgrid">' + principles + "</ul></section>" +
      footer + "</main></div>";
  }

  // ---------- scenario ----------
  function scenario(t) {
    var s = current(), n = s.steps.length, ph = state.phase, play = state.play || { choices: [], mode: state.mode, votes: {} };
    var ch = play.choices, ws = play.mode === "workshop";
    var idx = ph === "consequence" ? ch.length - 1 : ch.length;
    var step = s.steps[Math.min(idx, n - 1)];
    var sv = play.votes[step.id];
    var chosen = state.selected || (ws ? leading(sv, step.options.map(function (o) { return o.id; })) : null);
    var inPlay = ph === "decision" || ph === "consequence";
    var dots = inPlay ? '<ol class="tl" aria-label="' + esc(t.progressLabel) + '">' + s.steps.map(function (st, i) {
      var c = i < ch.length ? "done" : i === idx ? "now" : "";
      return '<li class="' + c + '"' + (c === "now" ? ' aria-current="step"' : "") + '><span class="tc">' + (c === "done" ? "✓" : i + 1) + "</span>" + (i < n - 1 ? '<span class="tline"></span>' : "") + "</li>";
    }).join("") + "</ol>" : "";
    var body = "", dock = "";

    if (ph === "briefing") {
      var prev = state.progress[s.id] || [], dr = state.drafts[s.id];
      body = '<div class="banner grad">' + sceneIcon(s, "big") + '<p class="kicker">' + fmt(t.scenarioKicker, { n: n }) + "</p><h1>" + esc(s.title) + '</h1><p style="opacity:.8;font-size:14px">' + esc(s.tagline) + "</p></div>" +
        box(t.yourRole, "<b>" + esc(s.role) + "</b>") +
        (s.roles && s.roles.length ? box(t.rolesLabel, s.roles.map(function (r) { return '<span class="chip">' + esc(r) + "</span>"; }).join(" ")) : "") +
        box(t.theSituation, storyboard(s) + esc(s.context) + (D.storyboards && D.storyboards[s.id] ? "" : snapshot(s))) +
        (dr ? '<button class="btn" data-act="resume">' + esc(t.resume) + " · " + fmt(t.inProgress, { i: dr.choices.length + 1, n: n }) + "</button>" : "") +
        '<button class="btn" data-begin="' + state.mode + '">' + esc(t.takeCommand) + " →</button>" +
        (prev.length === n ? '<button class="linkbtn" data-act="review">' + esc(t.debriefHeading) + "</button>" : "");
    } else if (ph === "decision") {
      var mm = String(Math.floor(timer.left / 60)).padStart(2, "0"), ss = String(timer.left % 60).padStart(2, "0");
      var tbar = ws ? '<section class="box timer" aria-label="' + esc(t.timer) + '"><div class="row"><span>' + esc(t.timer) +
          '</span><button class="round" data-timer="-1" aria-label="' + esc(t.timer) + ' −">−</button><span class="clock" dir="ltr" data-clock>' + mm + ":" + ss +
          '</span><button class="round" data-timer="1" aria-label="' + esc(t.timer) + ' +">+</button></div><div class="two-btn"><button class="btn small" data-timer="toggle"' + (timer.left ? "" : " disabled") + ">" +
          esc(timer.running ? t.timerPause : t.timerStart) + '</button><button class="btn ghost small" data-timer="reset">' + esc(t.timerReset) + "</button></div>" +
          (timer.left ? "" : '<p class="acc" style="font-weight:600;font-size:14px">' + esc(t.timeUp) + "</p>") + "</section>" : "";
      body = '<p class="acc" style="font-weight:600;font-size:14px">' + fmt(t.decisionOf, { scenario: s.title, i: idx + 1, n: n }) + "</p>" +
        '<details class="box howto situation"><summary>' + esc(t.theSituation) + ' +</summary><p>' + esc(s.context) + "</p>" + snapshot(s) + "</details>" + "<div class=\"scene\">" + (D.stepArt && D.stepArt[step.id] ? '<img class="step-art" src="' + esc(D.stepArt[step.id]) + '" alt="" width="640" height="434" decoding="async">' : "") + "<h1>" + esc(step.title) +
        '</h1><p style="font-size:18px;margin-bottom:0">' + esc(step.narrative) + "</p></div>" +
        (ws ? '<details class="box howto discuss"><summary>' + esc(t.questionsHeading) + ' +</summary><ul>' +
          ((s.discuss && s.discuss.length) ? s.discuss : (t.discussPrompts || [])).map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + "</ul></details>" : "") +
        '<div class="choices-heading"><div><h2>' + esc(t.whatDoYouDo) + '</h2><p class="muted">' + esc(ws ? t.voteHint : t.selectFirst) + '</p></div>' + tbar + '</div><div class="choice-grid">' +
        step.options.map(function (o, i) {
          var on = chosen === o.id;
          return '<div class="optwrap' + (on ? " sel" : "") + '"><button class="opt" data-choose="' + esc(o.id) + '" aria-pressed="' + on + '"><span class="letter">' +
            (on ? "✓" : esc(t.optionLetters[i] || i + 1)) + "</span><span><b>" + esc(o.label) + "</b><small>" + esc(o.detail) + "</small></span></button>" +
            (ws ? '<div class="votes"><b>' + fmt(t.votes, { n: (sv && sv[o.id]) || 0 }) + '</b><button class="round" data-vote="' + esc(o.id) + '" data-d="-1">−</button><button class="round" data-vote="' +
              esc(o.id) + '" data-d="1">+</button></div>' : "") + "</div>";
        }).join("") + "</div>";
      dock = '<button class="btn" data-act="confirm"' + (chosen ? "" : " disabled") + ">" + esc(chosen ? t.confirmDecision : t.selectFirst) + "</button>";
    } else if (ph === "consequence") {
      var last = ch[ch.length - 1], o = findOption(s, last.stepId, last.optionId), end = ch.length === n;
      body = '<p class="acc" style="font-weight:600;font-size:14px">' + fmt(t.stepOf, { n: ch.length, m: n }) + '</p><div class="decided">' +
        (ws ? esc(t.groupChose + ": " + o.label) : fmt(t.youDecided, { label: o.label })) + "</div>" +
        '<div><p class="muted" style="font-weight:600;margin-bottom:8px">' + esc(t.impactLabel) + "</p>" + impacts(t, o.impacts, o.id) + "</div>" +
        box(t.whatHappened, esc(o.consequence)) + box(t.whyItMatters, esc(o.reflection)) +
        otherOptions(t, step, o) +
        (ws ? '<div class="takeaways"><p class="label">' + esc(t.discussHeading) + "</p>" + esc(t.afterDiscuss) + "</div>" : "");
      dock = '<button class="btn" data-act="' + (end ? "debrief" : "next") + '">' + esc(end ? t.seeDebrief : t.nextDecision) + "</button>";
    } else {
      var tot = totalsFor(s, ch), b = boundsFor(s), v = verdict(t, tot, b.max);
      var weak = weakest(t, tot, b), low = lowestChoice(s, ch);
      var lead = weak ? '<section class="box"><p class="label">' + esc(t.debriefWeak) + "</p><p>" +
        fmt(t.debriefWeakDetail, { principle: pname(t, weak.key), rating: weak.rating }) + "</p></section>" : "";
      if (low.length) lead += '<section class="box"><p class="label">' + esc(t.debriefCostHeading) + '</p><p class="muted">' + esc(t.debriefCostExplain) + '</p>' + low.map(function (item) {
        return '<p><b>' + esc(item.option.label) + '</b> (' + item.impact + ')</p><div>' + impacts(t, item.option.impacts || {}, item.option.id) + '</div>';
      }).join("") + '</section>';
      var keys = weakKeys(t, tot, b);
      var questions = t.takeaways.filter(function (q) {
        if (!keys.length) return true;
        var ps = takeawayKeys(q);
        return ps.some(function (k) { return keys.indexOf(k) !== -1; });
      });
      body = '<div class="banner grad"><p class="kicker">' + fmt(t.debriefKicker, { scenario: s.title }) + "</p><h1>" + esc(t.debriefHeading) + "</h1></div>" +
        (t.debriefReflect ? '<p class="reflect">' + esc(t.debriefReflect) + "</p>" : "") +
        '<p><span class="muted" style="font-weight:600">' + esc(t.overallVerdict) + ':</span> <span class="tone big ' + v[1] + '">' + esc(v[0]) + "</span></p>" +
        lead +
        "<section class=\"box\"><h2>" + esc(t.principlesBalance) + '</h2>' + radar(t, tot, b.max, b.min) + '<div class="grid two">' + KEYS.map(function (k) { return meter(t, k, tot[k], b.max[k], b.min[k]); }).join("") + "</div></section>" +
        '<section class="scenario-reflection"><h2>' + esc(t.scenarioReflectionHeading) + '</h2><p class="debrief-text">' + esc(s.debrief) + "</p></section>" + costNote(t, s) + "<section><h2>" + esc(ws ? t.groupPath : t.pathYouTook) + '</h2><div class="grid">' +
        ch.map(function (c, i) {
          var st = s.steps.find(function (x) { return x.id === c.stepId; }), op = findOption(s, c.stepId, c.optionId), vv = play.votes[c.stepId];
          return '<div class="box"><p class="label" style="text-transform:none;letter-spacing:0">' + fmt(t.decisionLabel, { i: i + 1, title: st.title }) + "</p><b>" + esc(op.label) + "</b>" +
            (hasVotes(vv) ? '<p class="muted">' + fmt(t.splitVote, { votes: split(t, st, vv) }) + "</p>" : "") + '<div style="margin-top:8px">' + impacts(t, op.impacts, op.id) + "</div></div>";
        }).join("") + '</div></section><section class="box takeaways-box"><h2 class="h1">' + esc(t.takeawayHeading) + '</h2><ol class="guide">' +
        questions.map(function (q, i) { return '<li><span class="letter">' + (i + 1) + "</span><span>" + esc(takeawayText(q)) + "</span></li>"; }).join("") + "</ol></section>" +
        (ws ? '<div class="modebtns"><button class="btn ghost" data-act="copy">' + esc(state.copied ? "✓ " + t.copied : t.copySummary) +
          '</button><button class="btn ghost" data-act="download">' + esc(t.downloadSummary) + "</button></div>" : "") +
        feedbackForm(t, s) + '<button class="btn" data-act="replay">' + esc(t.replay) + '</button><button class="btn ghost" data-act="home">' + esc(t.chooseAnother) + "</button>";
    }
    var status = "";
    if (inPlay) {
      var sb = boundsFor(s);
      status = '<aside class="box status"><div class="srow">' + sceneIcon(s) + '<div><p class="label">' + esc(t.statusHeading || t.yourRole) + "</p><b>" + esc(s.role) + "</b></div></div>" +
        '<p class="label" style="margin-top:12px">' + esc(t.statusBalance || t.principlesBalance) + "</p>" + radar(t, totalsFor(s, ch), sb.max, sb.min) + "</aside>";
      if (ph === "decision") {
        status = '<details class="box decision-status"><summary>' + esc(t.statusBalance || t.principlesBalance) + ' +</summary><div class="status-content">' + status + '</div></details>';
        body = body.replace('<details class="box howto situation">', '<div class="decision-tools">' + status + '<details class="box howto situation">').replace('</details><div class="scene">', '</details></div><div class="scene">');
        status = "";
      }
      body = '<div class="playgrid' + (ph === "decision" ? ' active-decision' : '') + '">' + status + '<div class="stack">' + body + "</div></div>";
    }
    return '<div ' + accent(s) + '><header class="bar"><div class="wrap"><span><button class="back" data-act="home">← ' + esc(t.allScenarios) + "</button>" +
      (ws && ph !== "briefing" ? '<span class="wbadge">' + esc(t.workshopBadge) + "</span>" : "") + "</span>" + langSelect(t) + "</div>" +
      '</header><main class="wrap stack' + (inPlay ? " pad" : "") + '">' + dots + body + "</main>" + (dock ? '<div class="dock">' + dock + "</div>" : "") + "</div>";
  }

  function summary(t) {
    var s = current(), p = state.play, lines = [t.appTitle + " — " + s.title, s.role, ""];
    p.choices.forEach(function (c, i) {
      var st = s.steps.find(function (x) { return x.id === c.stepId; }), o = findOption(s, c.stepId, c.optionId);
      lines.push(raw(t.decisionLabel, { i: i + 1, title: st.title }), t.groupChose + ": " + o.label);
      if (hasVotes(p.votes[c.stepId])) lines.push(raw(t.splitVote, { votes: split(t, st, p.votes[c.stepId]) }));
      lines.push("");
    });
    lines.push(t.takeawayHeading);
    t.takeaways.forEach(function (q) { lines.push("• " + takeawayText(q)); });
    return lines.join("\n");
  }

  // ---------- render + events ----------
  var root = document.getElementById("app");
  var lastKey = "", lastScr = "";
  function render() {
    var t = ui();
    document.documentElement.lang = state.lang;
    document.documentElement.dir = RTL.indexOf(state.lang) >= 0 ? "rtl" : "ltr";
    document.title = t.appTitle;
    var screenKey = state.view + state.id + state.phase + (state.play ? state.play.choices.length : "");
    var openPanels = screenKey === lastKey ? Array.from(root.querySelectorAll("details")).map(function (d) { return d.open; }) : [];
    root.innerHTML = state.view === "home" ? home(t) : scenario(t);
    root.querySelectorAll("details").forEach(function (d, i) { if (openPanels[i]) d.open = true; });
    // Only jump to the top when the screen changes, not on every vote tap.
    var key = state.view + state.id + state.phase + (state.play ? state.play.choices.length : "");
    var scr = key + state.picked + state.entered;
    if (key !== lastKey) window.scrollTo(0, 0);
    // Soft "from the middle" reveal whenever the screen changes (CSS only, no extra work per tap).
    if (lastScr && scr !== lastScr) { root.classList.remove("swap"); void root.offsetWidth; root.classList.add("swap"); }
    lastScr = scr;
    lastKey = key;
    track();
  }
  // Browser back/forward: each screen gets a history entry; going back inside a scenario undoes later decisions.
  var fromPop = false;
  function snap() { return { v: state.view, id: state.id, ph: state.phase, pk: state.picked, en: state.entered, n: state.play ? state.play.choices.length : 0 }; }
  function snapKey(x) { return [x.v, x.id, x.ph, x.pk, x.en, x.n].join("|"); }
  function track() {
    if (fromPop) { fromPop = false; return; }
    var x = snap(), cur = history.state && history.state.hai;
    if (!cur) history.replaceState({ hai: x }, "");
    else if (snapKey(cur) !== snapKey(x)) history.pushState({ hai: x }, "");
  }
  window.addEventListener("popstate", function (e) {
    var x = e.state && e.state.hai; if (!x) return;
    stopTimer();
    state.view = x.v; state.id = x.id; state.picked = x.pk; state.entered = !!x.en; state.phase = x.ph; state.selected = null;
    if (x.v === "scenario" && (x.ph === "decision" || x.ph === "consequence")) {
      if (!state.play) state.play = state.drafts[x.id] || null;
      if (!state.play) state.phase = "briefing";
      else {
        if (state.play.choices.length > x.n) { state.play.choices.length = x.n; syncDraft(); }
        if (state.play.choices.length < x.n) state.phase = "decision";
        if (state.phase === "consequence" && !state.play.choices.length) state.phase = "decision";
      }
    } else if (x.v === "scenario" && x.ph === "debrief" && (!state.play || !state.play.choices.length)) state.phase = "briefing";
    fromPop = true; render();
  });
  function stopTimer() { clearInterval(timer.handle); timer.running = false; }
  function resetTimer(m) { stopTimer(); timer.minutes = Math.min(15, Math.max(1, m)); timer.left = timer.minutes * 60; }
  function syncDraft() {
    var p = state.play, s = current();
    if (p.choices.length === s.steps.length) delete state.drafts[s.id]; else state.drafts[s.id] = p;
    save();
  }
  function begin(m) {
    state.mode = m; state.play = { choices: [], mode: m, votes: {} }; state.selected = null; state.phase = "decision";
    resetTimer(timer.minutes); syncDraft();
  }

  async function loadRatings() {
    if (!feedbackApi) return;
    try { (await feedbackApi.ratings()).forEach(function (r) { ratings[r.scenario_id] = r; }); render(); } catch (e) { /* Game remains available offline. */ }
  }
  root.addEventListener("submit", async function (e) {
    var form = e.target.closest("[data-feedback]");
    if (!form || !feedbackApi) return;
    e.preventDefault();
    var id = form.dataset.feedback, sc = scenarios().find(function (s) { return s.id === id; });
    if (!sc || !done(sc)) return;
    var data = new FormData(form), button = form.querySelector('[type="submit"]');
    button.disabled = true;
    feedbackIds[id] = feedbackIds[id] || crypto.randomUUID();
    try {
      await feedbackApi.submit({ id: feedbackIds[id], scenario: id, rating: Number(data.get("rating")), comment: String(data.get("comment") || "").trim(), mode: state.mode, language: state.lang });
      sentFeedback[id] = true; render(); loadRatings();
    } catch (err) { button.disabled = false; form.querySelector('[data-feedback-status]').textContent = ui().feedbackError; }
  });
  loadRatings();
  root.addEventListener("change", function (e) {
    if (e.target.matches("[data-lang]")) { state.lang = e.target.value; state.topic = ""; save(); render(); }
    else if (e.target.matches("[data-topic]")) { state.topic = e.target.value; render(); }
    else if (e.target.matches("[data-sort]")) { state.sort = e.target.value; render(); }
  });
  root.addEventListener("click", function (e) {
    var el = e.target.closest("[data-open],[data-choose],[data-act],[data-mode],[data-pick],[data-begin],[data-vote],[data-timer]");
    if (!el) return;
    var ds = el.dataset, s = state.id && current();
    if (ds.mode) { state.mode = ds.mode; save(); }
    else if (ds.pick) { state.mode = ds.pick; state.picked = true; save(); window.scrollTo(0, 0); }
    else if (ds.open) { state.view = "scenario"; state.id = ds.open; state.phase = "briefing"; state.play = null; state.copied = false; }
    else if (ds.begin) begin(ds.begin);
    else if (ds.choose) state.selected = ds.choose;
    else if (ds.vote) {
      var st = s.steps[state.play.choices.length], v = state.play.votes[st.id] = state.play.votes[st.id] || {};
      v[ds.vote] = Math.max(0, (v[ds.vote] || 0) + Number(ds.d)); syncDraft();
    } else if (ds.timer) {
      if (ds.timer === "toggle") {
        if (timer.running) stopTimer();
        else {
          timer.running = true;
          timer.handle = setInterval(function () {
            timer.left = Math.max(0, timer.left - 1);
            if (!timer.left) { stopTimer(); render(); return; }
            var c = root.querySelector("[data-clock]");
            if (c) c.textContent = String(Math.floor(timer.left / 60)).padStart(2, "0") + ":" + String(timer.left % 60).padStart(2, "0");
          }, 1000);
        }
      } else if (ds.timer === "reset") resetTimer(timer.minutes);
      else resetTimer(timer.minutes + Number(ds.timer));
    } else {
      var a = ds.act, t = ui();
      if (a === "enter") {
        var cv = root.querySelector(".cover"); if (cv) cv.classList.add("leaving");
        setTimeout(function () { state.entered = true; render(); window.scrollTo(0, 0); }, cv ? 400 : 0);
        return;
      }
      if (a === "cover") { state.entered = false; state.picked = false; state.view = "home"; }
      if (a === "more") state.more = !state.more;
      if (a === "landing") { state.entered = true; state.picked = false; state.view = "home"; }
      if (a === "home") { stopTimer(); state.view = "home"; }
      if (a === "replay") begin(state.play.mode);
      if (a === "resume") { state.play = state.drafts[s.id]; state.mode = state.play.mode; state.selected = null; state.phase = "decision"; save(); }
      if (a === "review") { state.play = { choices: state.progress[s.id].slice(), mode: "solo", votes: {} }; state.phase = "debrief"; }
      if (a === "next") { state.phase = "decision"; resetTimer(timer.minutes); }
      if (a === "debrief") state.phase = "debrief";
      if (a === "confirm") {
        var step = s.steps[state.play.choices.length];
        var pick = state.selected || (state.play.mode === "workshop" ? leading(state.play.votes[step.id], step.options.map(function (o) { return o.id; })) : null);
        if (!pick) return;
        state.play.choices.push({ stepId: step.id, optionId: pick });
        state.selected = null; state.phase = "consequence"; stopTimer();
        if (state.play.choices.length === s.steps.length) state.progress[s.id] = state.play.choices.slice();
        syncDraft();
      }
      if (a === "copy") {
        if (navigator.clipboard) navigator.clipboard.writeText(summary(t)).then(function () { state.copied = true; render(); }, function () {});
        return;
      }
      if (a === "download") {
        var url = URL.createObjectURL(new Blob([summary(t)], { type: "text/plain;charset=utf-8" }));
        var link = document.createElement("a"); link.href = url; link.download = "workshop-" + s.id + ".txt";
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
        return;
      }
    }
    render();
  });

  render();
})();
