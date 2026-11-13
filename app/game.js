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
  var KEYS = ["humanity", "impartiality", "neutrality", "independence", "doNoHarm"];
  var ACCENT = {
    "flood-line": "accent-flood", "targeting-unseen": "accent-sahel", "front-line": "accent-conflict",
    "cloud-question": "accent-cloud", "edge-network": "accent-edge", "signals-noise": "accent-signals",
    "outbreak-signal": "accent-outbreak", "boardroom-test": "accent-governance",
    "clinic-notes": "accent-clinic", "invoice-engine": "accent-invoice", "volunteer-roster": "accent-roster", "heat-wave": "accent-heat",
  };
  var ICONS = {
    humanity: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z",
    impartiality: "M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z",
    neutrality: "M4 12h16M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z",
    independence: "M12 3l3 6 6 .9-4.5 4.3 1 6.3L12 17.6 6.5 20.5l1-6.3L3 9.9 9 9z",
    doNoHarm: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z",
  };
  var STORE = "hai-game-v1";
  var D = window.GAME_DATA;
  var SET = D.settings || {};
  var W = {}; KEYS_W(); function KEYS_W() { ["humanity", "impartiality", "neutrality", "independence", "doNoHarm"].forEach(function (k) { var w = SET.weights && SET.weights[k]; W[k] = typeof w === "number" ? w : 1; }); }
  var SHARE = typeof SET.strongShare === "number" ? SET.strongShare : 0.5;

  // ---------- saved state (only on this device) ----------
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) {}
  var state = {
    lang: saved.lang || "en", mode: saved.mode === "workshop" ? "workshop" : "solo",
    progress: saved.progress || {}, drafts: saved.drafts || {},
    view: "home", id: null, phase: "briefing", play: null, selected: null, more: false, copied: false, topic: "",
  };
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
      if (r[0] === t.ratingNotTested) return;
      var rank = totals[k] < 0 ? 0 : (r[1] === "success" ? 2 : 1);
      if (!best || rank < best.rank || (rank === best.rank && totals[k] < best.score)) best = { key: k, rank: rank, score: totals[k], rating: r[0] };
    });
    return best;
  }
  function lowestChoice(s, choices, key) {
    var found = null, low = Infinity;
    choices.forEach(function (c) {
      var o = findOption(s, c.stepId, c.optionId);
      if (!o) return;
      var v = (o.impacts && o.impacts[key]) || 0;
      if (v < low) { low = v; found = o; }
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
      return '<div><b>' + esc(opt.label) + "</b><p>" + esc(opt.reflection) + "</p>" + impacts(t, opt.impacts) + "</div>";
    }).join("") + "</div></details>";
  }
  function impacts(t, imp) {
    return KEYS.filter(function (k) { return imp[k]; }).map(function (k) {
      var v = imp[k];
      return '<span class="impact pc-' + k + (v < 0 ? " neg" : "") + '">' + icon(k) + esc(pname(t, k)) + " " + (v > 0 ? "+" + v : "−" + Math.abs(v)) + "</span>";
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
  // Scenario colours: built-in palette by id, or "colors": ["#hex", "#hex"] in the scenario JSON.
  function accent(s) {
    var c = s.colors && s.colors.length === 2 ? ' style="--acc:' + esc(s.colors[0]) + ";--acc2:" + esc(s.colors[1]) + '"' : "";
    return 'class="' + (ACCENT[s.id] || "accent-brand") + '"' + c;
  }
  function box(label, html) { return '<section class="box"><p class="label">' + esc(label) + "</p>" + html + "</section>"; }

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
    var guide = state.mode === "workshop" ? '<details class="box"><summary>' + esc(t.guideHeading) + ' +</summary><ol class="guide" style="padding:0;list-style:none">' +
      t.guideSteps.map(function (g, i) { return '<li><span class="letter">' + (i + 1) + "</span><span>" + esc(g) + "</span></li>"; }).join("") +
      '</ol><p class="muted" style="margin-top:12px;font-size:12px">' + esc(t.guideNote) + "</p></details>" : "";
    var record = count ? '<section class="box"><h2>' + esc(t.recordHeading) + '</h2><p class="muted">' + fmt(t.recordSummary, { n: count }) +
      '</p><div class="grid two">' + KEYS.map(function (k) { return meter(t, k, totals[k], max[k], min[k]); }).join("") + "</div></section>" : "";
    var cards = (state.topic ? list.filter(function (s) { return (s.topics || []).indexOf(state.topic) >= 0; }) : list).map (function (s) {
      var dr = state.drafts[s.id];
      var go = dr ? fmt(t.inProgress, { i: dr.choices.length + 1, n: s.steps.length }) + " · " + esc(t.resume)
        : esc(done(s) ? t.playAgain : t.startScenario);
      return '<li ' + accent(s) + '><button class="scard" data-open="' + esc(s.id) + '"><div class="strip grad"></div><div class="body"><div class="titlerow"><h3>' + esc(s.title) + "</h3>" +
        (done(s) ? '<span class="chip">✓</span>' : "") + '</div><span class="muted clamp2">' + esc(s.tagline) + "</span><div>" +
        (s.topics || []).map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join("") + '</div><span class="go">' + go + " →</span></div></button></li>";
    }).join("");
    var topics = [];
    list.forEach(function (s) { (s.topics || []).forEach(function (x) { if (topics.indexOf(x) < 0) topics.push(x); }); });
    var filter = '<label class="muted" style="display:block;margin-bottom:12px">' + esc(t.filterLabel) +
      ' <select data-topic>' + '<option value="">' + esc(t.allTopics) + "</option>" +
      topics.map(function (x) { return '<option value="' + esc(x) + '"' + (state.topic === x ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") +
      "</select></label>";
    var principles = t.principles.map(function (p) {
      return '<li class="prow pc-' + p.key + '"><span class="icon">' + icon(p.key) + "</span><div><b>" + esc(p.name) + '</b><p class="muted">' + esc(p.description) + "</p></div></li>";
    }).join("");
    return '<div class="accent-brand"><header class="grad"><div class="wrap hero"><div class="top">' + langSelect(t) + '</div><p class="kicker" style="margin-top:24px">' +
      esc(t.kicker) + "</p><h1>" + esc(t.appTitle) + '</h1><p class="intro">' + esc(t.intro) + '</p></div></header><main class="wrap stack"><div class="modes" role="radiogroup">' + modes + "</div>" + guide +
      '<section><div class="rowhead"><h2>' + esc(t.scenariosHeading) + '</h2><span class="muted">' + fmt(t.progressOverall, { n: count, m: list.length }) +
      '</span></div><div class="pbar"><div style="width:' + (count / list.length) * 100 + '%"></div></div>' + filter + '<ul class="grid two">' + cards + "</ul></section>" + record +
      '<details class="box"><summary>' + esc(t.principlesHeading) + ' +</summary><ul class="grid">' + principles + "</ul></details>" +
      '<footer class="footer"><p>' + esc(t.footerNote) + '</p><a href="https://preparecenter.org/site/ict-resolution/" target="_blank" rel="noreferrer">' +
      esc(t.ictLinkLabel) + "</a></footer></main></div>";
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
      body = '<div class="banner grad"><p class="kicker">' + fmt(t.scenarioKicker, { n: n }) + "</p><h1>" + esc(s.title) + "</h1><p>" + esc(s.tagline) + "</p></div>" +
        box(t.yourRole, "<b>" + esc(s.role) + "</b>") +
        (s.roles && s.roles.length ? box(t.rolesLabel, s.roles.map(function (r) { return '<span class="chip">' + esc(r) + "</span>"; }).join(" ")) : "") +
        box(t.theSituation, esc(s.context)) +
        '<div><p class="muted" style="font-weight:600;margin-bottom:8px">' + esc(t.roadmapLabel) + '</p><ol class="steps">' +
        s.steps.map(function (st, i) { return '<li><span class="letter">' + (i + 1) + "</span>" + esc(st.title) + "</li>"; }).join("") + "</ol></div>" +
        (dr ? '<button class="btn" data-act="resume">' + esc(t.resume) + " · " + fmt(t.inProgress, { i: dr.choices.length + 1, n: n }) + "</button>" : "") +
        '<div class="modebtns">' + [["solo", t.playSolo, t.modeSoloHint], ["workshop", t.startWorkshop, t.modeWorkshopHint]].map(function (m) {
          return '<button class="modebtn' + (state.mode === m[0] ? " on" : "") + '" data-begin="' + m[0] + '"><b>' + esc(m[1]) + " →</b><small>" + esc(m[2]) + "</small></button>";
        }).join("") + "</div>" +
        (prev.length === n ? '<button class="linkbtn" data-act="review">' + esc(t.debriefHeading) + "</button>" : "");
    } else if (ph === "decision") {
      var mm = String(Math.floor(timer.left / 60)).padStart(2, "0"), ss = String(timer.left % 60).padStart(2, "0");
      body = '<p class="acc" style="font-weight:600;font-size:14px">' + fmt(t.decisionOf, { scenario: s.title, i: idx + 1, n: n }) + "</p><div class=\"scene\"><h1>" + esc(step.title) +
        '</h1><p style="font-size:18px;margin-bottom:0">' + esc(step.narrative) + "</p></div>" +
        (ws ? '<section class="discuss"><h2 style="font-size:18px">' + esc(t.discussHeading) + "</h2><ul>" +
           ((s.discuss && s.discuss.length) ? s.discuss : (t.discussPrompts || [])).map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + '</ul><div class="timer" aria-live="polite"><div class="row"><span>' + esc(t.timer) +
          '</span><button class="round" data-timer="-1">−</button><span class="clock" dir="ltr" data-clock>' + mm + ":" + ss +
          '</span><button class="round" data-timer="1">+</button></div><div class="two-btn"><button class="btn small" data-timer="toggle"' + (timer.left ? "" : " disabled") + ">" +
          esc(timer.running ? t.timerPause : t.timerStart) + '</button><button class="btn ghost small" data-timer="reset">' + esc(t.timerReset) + "</button></div>" +
          (timer.left ? "" : '<p class="acc" style="font-weight:600;font-size:14px">' + esc(t.timeUp) + "</p>") + "</div></section>" : "") +
        '<div><h2 style="font-size:16px">' + esc(ws ? t.voteHeading : t.whatDoYouDo) + '</h2><p class="muted">' + esc(ws ? t.voteHint : t.selectFirst) + '</p></div><div class="stack">' +
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
        box(t.whatHappened, esc(o.consequence)) + box(t.whyItMatters, esc(o.reflection)) +
        '<div><p class="muted" style="font-weight:600;margin-bottom:8px">' + esc(t.impactLabel) + "</p>" + impacts(t, o.impacts) + "</div>" +
        otherOptions(t, step, o) +
        (ws ? '<div class="takeaways"><p class="label">' + esc(t.discussHeading) + "</p>" + esc(t.afterDiscuss) + "</div>" : "");
      dock = '<button class="btn" data-act="' + (end ? "debrief" : "next") + '">' + esc(end ? t.seeDebrief : t.nextDecision) + "</button>";
    } else {
      var tot = totalsFor(s, ch), b = boundsFor(s), v = verdict(t, tot, b.max);
      var weak = weakest(t, tot, b), low = weak && lowestChoice(s, ch, weak.key);
      var lead = weak ? '<section class="box"><p class="label">' + esc(t.debriefWeak) + "</p><p>" +
        fmt(t.debriefWeakDetail, { principle: pname(t, weak.key), rating: weak.rating, choice: low ? low.label : "" }) + "</p></section>" : "";
      var keys = weakKeys(t, tot, b);
      var questions = t.takeaways.filter(function (q) {
        if (!keys.length) return true;
        var ps = takeawayKeys(q);
        return ps.some(function (k) { return keys.indexOf(k) !== -1; });
      });
      body = '<div class="banner grad"><p class="kicker">' + fmt(t.debriefKicker, { scenario: s.title }) + "</p><h1>" + esc(t.debriefHeading) + "</h1></div>" +
        '<p><span class="muted" style="font-weight:600">' + esc(t.overallVerdict) + ':</span> <span class="tone big ' + v[1] + '">' + esc(v[0]) + "</span></p>" +
        lead +
        "<section><h2>" + esc(t.principlesBalance) + '</h2><div class="grid two">' + KEYS.map(function (k) { return meter(t, k, tot[k], b.max[k], b.min[k]); }).join("") + "</div></section>" +
        "<p>" + esc(s.debrief) + "</p><section><h2>" + esc(ws ? t.groupPath : t.pathYouTook) + '</h2><div class="grid">' +
        ch.map(function (c, i) {
          var st = s.steps.find(function (x) { return x.id === c.stepId; }), op = findOption(s, c.stepId, c.optionId), vv = play.votes[c.stepId];
          return '<div class="box"><p class="label" style="text-transform:none;letter-spacing:0">' + fmt(t.decisionLabel, { i: i + 1, title: st.title }) + "</p><b>" + esc(op.label) + "</b>" +
            (hasVotes(vv) ? '<p class="muted">' + fmt(t.splitVote, { votes: split(t, st, vv) }) + "</p>" : "") + '<div style="margin-top:8px">' + impacts(t, op.impacts) + "</div></div>";
        }).join("") + '</div></section><section class="takeaways"><h2>' + esc(t.takeawayHeading) + "</h2><ul>" +
        questions.map(function (q) { return "<li>" + esc(takeawayText(q)) + "</li>"; }).join("") + "</ul></section>" +
        (ws ? '<div class="modebtns"><button class="btn ghost" data-act="copy">' + esc(state.copied ? "✓ " + t.copied : t.copySummary) +
          '</button><button class="btn ghost" data-act="download">' + esc(t.downloadSummary) + "</button></div>" : "") +
        '<button class="btn" data-act="replay">' + esc(t.replay) + '</button><button class="btn ghost" data-act="home">' + esc(t.chooseAnother) + "</button>";
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
  var lastKey = "";
  function render() {
    var t = ui();
    document.documentElement.lang = state.lang;
    document.documentElement.dir = RTL.indexOf(state.lang) >= 0 ? "rtl" : "ltr";
    document.title = t.appTitle;
    root.innerHTML = state.view === "home" ? home(t) : scenario(t);
    // Only jump to the top when the screen changes, not on every vote tap.
    var key = state.view + state.id + state.phase + (state.play ? state.play.choices.length : "");
    if (key !== lastKey) window.scrollTo(0, 0);
    lastKey = key;
  }
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

  root.addEventListener("change", function (e) {
    if (e.target.matches("[data-lang]")) { state.lang = e.target.value; state.topic = ""; save(); render(); }
    else if (e.target.matches("[data-topic]")) { state.topic = e.target.value; render(); }
  });
  root.addEventListener("click", function (e) {
    var el = e.target.closest("[data-open],[data-choose],[data-act],[data-mode],[data-begin],[data-vote],[data-timer]");
    if (!el) return;
    var ds = el.dataset, s = state.id && current();
    if (ds.mode) { state.mode = ds.mode; save(); }
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
      if (a === "more") state.more = !state.more;
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
