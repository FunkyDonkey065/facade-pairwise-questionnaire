import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadDesign() {
  const context = vm.createContext({ window: {} });
  for (const file of ["scene_manifest.js", "pairs.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  }
  return JSON.parse(vm.runInContext("JSON.stringify({design:DESIGN,blocks:ACTIVE_PAIR_SETS,scenes:SURVEY_SCENES,manifest:window.STIMULUS_MANIFEST})", context));
}

export function connectedComponents(ids, edges) {
  const neighbours = new Map(ids.map(id => [id, new Set()]));
  for (const [a, b] of edges) {
    neighbours.get(a)?.add(b);
    neighbours.get(b)?.add(a);
  }
  const unseen = new Set(ids);
  const components = [];
  while (unseen.size) {
    const queue = [unseen.values().next().value];
    const component = [];
    while (queue.length) {
      const id = queue.pop();
      if (!unseen.delete(id)) continue;
      component.push(id);
      queue.push(...neighbours.get(id));
    }
    components.push(component);
  }
  return components;
}
