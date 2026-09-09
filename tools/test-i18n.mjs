import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { root } from "./design.mjs";

const source = fs.readFileSync(`${root}/i18n.js`, "utf8");
function load(search = "", defaultLanguage = "es") {
  const catalogs = [];
  const select = { value: "", addEventListener() {} };
  const events = [];
  const document = { body: { querySelectorAll: () => [] }, documentElement: {},
    createTreeWalker: () => ({ nextNode: () => false }), querySelector: () => select,
    dispatchEvent: event => events.push(event) };
  const window = { STUDY_CONFIG: { participantLanguage: defaultLanguage },
    location: { search, href: "https://study.test/" + search } };
  window.history = { replaceState: (_, __, url) => { window.location.href = String(url); } };
  vm.runInNewContext(source, { window, document, URL, URLSearchParams, WeakMap,
    NodeFilter: { SHOW_TEXT: 4 }, MutationObserver: class { observe() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    Map: class extends Map { constructor(entries) { super(entries); catalogs.push(this); } }
  });
  return { api: window.SurveyI18n, catalogs, document, window, select, events };
}
const state = load("?LANG=ca&BLOCK_ID=B01");
assert.equal(state.catalogs.length, 2);
assert.deepEqual([...state.catalogs[0].keys()].sort(), [...state.catalogs[1].keys()].sort());
assert(state.catalogs.every(catalog => [...catalog.values()].every(value => typeof value === "string" && value.trim())));
assert.equal(state.api.language, "ca");
assert.equal(state.document.documentElement.lang, "ca");
assert.equal(state.select.value, "ca");
assert.equal(state.api.translate("PAD rating 1 of 10"), "Valoració PAD 1 de 10");
assert.equal(state.api.translate("Preference pair 1 of 5"), "Parella de preferència 1 de 5");
assert.equal(state.api.translate("Retention period: approximately 10 years"), "Termini de conservació: aproximadament 10 anys");
assert.equal(state.api.translate("Ethics approval or exemption reference: CEUPC 2026-046"), "Referència d'aprovació ètica o exempció: CEUPC 2026-046");
assert.equal(state.api.translate("Committee meeting date: 2026-01-22"), "Data de reunió del comitè: 2026-01-22");
assert.equal(state.api.translate("Signature date shown in the decision: 2026-01-23"), "Data de signatura que consta al dictamen: 2026-01-23");
assert.equal(state.api.translate("The UPC Ethics Committee has issued a favourable opinion on the ethical aspects related to the research carried out in this project/article."),
  "El Comitè d'Ètica de la UPC ha emès un dictamen favorable sobre els aspectes ètics relacionats amb la recerca realitzada en aquest projecte/article.");
assert.equal(load("?LANG=es").api.translate("Committee meeting date: 2026-01-22"), "Fecha de reunión del comité: 2026-01-22");
assert.equal(load("?LANG=es").api.translate("Signature date shown in the decision: 2026-01-23"), "Fecha de firma que figura en el dictamen: 2026-01-23");
assert.equal(state.api.translate("Street context heading 90"), "Vista de l'entorn urbà a 90 graus");
assert.equal(state.api.translate("Eixample, Barcelona, Catalonia, Spain. Rate the marked target facade as part of the visible street scene."),
  "Eixample, Barcelona, Catalunya, Espanya. Valora la façana marcada com a part de l'escena urbana visible.");
for (const language of ["en", "es", "ca", "en", "ca"]) {
  state.api.setLanguage(language);
  assert.equal(state.api.language, language);
  assert.equal(new URL(state.window.location.href).searchParams.get("LANG"), language);
  assert.equal(new URL(state.window.location.href).searchParams.get("BLOCK_ID"), "B01");
  for (const [key, value] of state.catalogs[language === "ca" ? 1 : 0]) {
    assert.equal(state.api.translate(key), language === "en" ? key : value);
  }
}
state.api.setLanguage("invalid");
assert.equal(state.api.language, "ca");
assert.equal(load().api.language, "es");
assert.equal(load("?LANG=invalid").api.language, "es");
assert.equal(load("", "ca").api.language, "ca");
assert.equal(load("?LANG=en", "ca").api.language, "en");
console.log(`Translation checks passed: ${state.catalogs[0].size} matching ES/CA entries, dynamic text, three language switches, URL preservation and default language.`);
