import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { root } from "./design.mjs";
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(`${root}/recovery.js`, "utf8"), context);
const Recovery = context.window.SurveyRecovery;
const values = new Map();
const storage = {
  get length() { return values.size; }, key(i) { return [...values.keys()][i]; },
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); }, removeItem(key) { values.delete(key); }
};
let now = 100;
const config = { storage, identity: { pid: "synthetic", version: "v1" }, now: () => now, ttlMs: 1000 };
const first = new Recovery(config);
assert.equal(first.state, null);
assert.equal(first.save({ consented: false, rows: [] }), false);
assert.equal(storage.length, 0);
assert(first.save({ consented: true, rows: [{ study_trial_id: "T00" }], seed: "fixed", draft: { inputs: ["value"] } }));
const second = new Recovery(config);
assert.equal(second.state.seed, "fixed");
assert.equal(second.state.draft.inputs[0], "value");
assert(first.save({ ...first.state, rows: [...first.state.rows, { study_trial_id: "T01" }] }));
assert.equal(second.save(second.state), false);
assert.equal(second.error, "conflict");
assert.equal(new Recovery(config).state.rows.length, 2);
assert.equal(new Recovery({ ...config, identity: { pid: "another", version: "v1" } }).state, null);
storage.setItem("unrelated", "keep");
now = 1100;
Recovery.purgeExpired(storage, now);
assert.equal(new Recovery(config).state, null);
assert.equal(storage.getItem("unrelated"), "keep");
storage.setItem(first.key, "{not-json");
assert.equal(new Recovery(config).state, null);
assert.equal(storage.getItem(first.key), "{not-json");
storage.removeItem(first.key);
const blocked = new Recovery({ ...config, storage: { ...storage, setItem() { throw Error("QuotaExceededError"); } } });
assert.equal(blocked.save({ consented: true, rows: [] }), false);
assert.equal(blocked.error, "unavailable");
assert.equal(storage.getItem(first.key), null);
assert(first.clear());
assert.equal(storage.getItem("unrelated"), "keep");
console.log("Recovery checks passed: consent, drafts, identity isolation, expiry, corruption, quota failure and stale-tab conflicts.");
