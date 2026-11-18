// Run from the repository root: node --test tools/tests/handoff.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const langs = ['en', 'sv', 'fr', 'es', 'ar'];
const data = Object.fromEntries(langs.map(l => [l, JSON.parse(read('content/scenarios-' + l + '.json'))]));
const reasons = JSON.parse(read('content/humanity-reasons.json'));
const assets = JSON.parse(read('content/assets.json'));
const engine = read('app/game.js');
const fold = engine.match(/\(function foldDoNoHarm\(\) \{[\s\S]*?\}\)\(\);/)[0];
const folded = JSON.parse(JSON.stringify(data));
vm.runInNewContext(fold, { window: { GAME_DATA: { scenarios: folded, i18n: {} } } });
const options = list => Object.fromEntries(list.flatMap(s => s.steps.flatMap(st => st.options.map(o => [o.id, o]))));
const files = {};
function walk(dir) { for (const name of fs.readdirSync(path.join(root, dir))) {
  const p = dir + '/' + name;
  if (fs.statSync(path.join(root,p)).isDirectory()) walk(p);
  else files[p] = /\.jpg$/i.test(p) ? 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root,p)).toString('base64') : read(p);
} }
walk('app'); walk('content');
for (const lang of langs) {
  test(lang + ': 12 scenarios, four decision gates and three options per gate', () => {
    assert.equal(data[lang].length, 12);
    for (const s of data[lang]) { assert.equal(s.steps.length, 4, s.id); for (const st of s.steps) assert.equal(st.options.length, 3, st.id); }
  });
  test(lang + ': all 144 option scores match English', () => {
    const en=options(data.en), local=options(data[lang]); assert.equal(Object.keys(local).length,144);
    for(const id of Object.keys(en)) assert.deepEqual(local[id].impacts,en[id].impacts,id);
  });
  test(lang + ': decision Humanity is never zero after legacy folding', () => {
    for (const o of Object.values(options(folded[lang]))) if ('humanity' in o.impacts) assert.notEqual(o.impacts.humanity,0,o.id);
  });
  test(lang + ': agreed manual trade-offs and vendor autonomy', () => {
    const o=options(folded[lang]);
    for(const id of ['fl-1c','os-1b','cn-1c']) assert.equal(o[id].impacts.humanity,-1,id);
    assert.equal(o['fl-1c'].impacts.independence,1); assert.equal(o['cn-1c'].impacts.independence,1); assert.equal(o['os-1b'].impacts.independence,undefined);
  });
  test(lang + ': reviewed Humanity values and explanations', () => {
    const expected={'tu-1b':1,'tu-2b':1}; const o=options(folded[lang]); assert.equal(Object.keys(reasons[lang]).length,24);
    for(const [id, reason] of Object.entries(reasons[lang])) { assert.equal(o[id].impacts.humanity,expected[id] || -1,id); assert.ok(reason.trim().length>0,id); }
  });
  const neutrality={'tu-3a':-1,'tu-3b':1,'tu-3c':1,'tu-4a':-1,'cn-1a':-1,'cn-1b':1,'cn-1c':1,'cn-3a':-1,'hw-2c':-1,'hw-4a':-1,'hw-4b':1};
  for(const [id,value] of Object.entries(neutrality)) test(lang + ': intermediary Neutrality ' + id,()=>assert.equal(options(data[lang])[id].impacts.neutrality,value));
}
test('all 12 storyboards and all 48 gate images are mapped to real JPEGs',()=>{
  assert.equal(Object.keys(assets.storyboards).length,12);assert.equal(Object.keys(assets.stepArt).length,48);
  for(const s of data.en){assert.ok(files[assets.storyboards[s.id]]);for(const st of s.steps)assert.ok(files[assets.stepArt[st.id]]);}
});
test('original content checker has no errors or warnings',()=>assert.deepEqual(require('../checker.js').checkContent(files),{errors:[],warnings:[]}));
test('offline builder embeds every image and translated explanation',()=>{
  const built=require('../builder.js').buildGame(files);assert.equal(built.scenarioCount,12);assert.equal(built.languages.length,5);
  for(const p of Object.values(assets.storyboards).concat(Object.values(assets.stepArt))) assert.ok(built.html.includes(files[p]),p);
  assert.ok(built.html.includes(JSON.stringify(reasons)));assert.equal(built.html,read(require('../builder.js').playableName));
});
test('missing mapped image is a clear build error, not an invisible picture',()=>{
  const broken={...files};delete broken[assets.stepArt['fl-3']];assert.throws(()=>require('../builder.js').buildGame(broken),/Missing or invalid illustration/);
});

test('cost and environment notes cover every scenario in every language and are embedded', () => {
  const notes = JSON.parse(read('content/cost-notes.json'));
  for (const lang of ['en','sv','fr','es','ar']) for (const s of data.en) assert.ok((notes[lang]||{})[s.id], lang + ' ' + s.id);
  const built = require('../builder.js').buildGame(files);
  assert.ok(built.html.includes('"costNotes"'));
});
