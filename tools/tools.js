// Shared helpers for build.html and check.html: read the chosen folder as text.
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

function report(r) {
  var h = "";
  if (r.errors.length) h += '<h2 class="err">' + r.errors.length + " to fix</h2><ul>" + r.errors.map(function (e) { return '<li class="err">' + esc(e) + "</li>"; }).join("") + "</ul>";
  if (r.warnings.length) h += "<details><summary>" + r.warnings.length + " notes (optional)</summary><ul>" + r.warnings.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul></details>";
  return h;
}

function pickFolder(onFiles) {
  var input = document.getElementById("dir"), out = document.getElementById("out");
  input.addEventListener("change", function () {
    var list = Array.prototype.slice.call(input.files), files = {};
    out.textContent = "Reading " + list.length + " files…";
    Promise.all(list.filter(function (f) { return /\.(json|html|css|js)$/.test(f.name); }).map(function (f) {
      return f.text().then(function (txt) {
        // "ai-humanitarian-game/content/x.json" → "content/x.json"
        var p = (f.webkitRelativePath || f.name).split("/");
        var i = Math.max(p.indexOf("content"), p.indexOf("app"));
        files[i >= 0 ? p.slice(i).join("/") : p.join("/")] = txt;
      });
    })).then(function () { onFiles(files, out); });
  });
}
