const {findHood, adjMap} = require("../src/utils/netz");


test("Graph ist symmetrisch", () => {
  const errors = [];

  for (const [node, neighbors] of adjMap.entries()) {
    for (const n of neighbors) {
      const nSet = adjMap.get(n);
      if (!nSet) {
        errors.push(`Fehler: Nachbarknoten ${n} existiert nicht (von Knoten ${node})`);
      } else if (!nSet.has(node)) {
        errors.push(`Fehler: Kante ${node} → ${n} ist da, aber ${n} → ${node} fehlt`);
      }
    }
  }

  if (errors.length) console.error(errors.join("\n"));
  expect(errors.length).toBe(0);
});

function floodingTest(startId, allowedNodes = null) {
  if (!adjMap.has(startId)) return new Set();

  const visited = new Set();
  const queue = [startId];
  let index = 0;

  while (index < queue.length) {
    const current = queue[index++];

    if (visited.has(current)) continue;

    visited.add(current);

    const neighbors = adjMap.get(current) ?? [];

    for (const n of neighbors) {
      if (!visited.has(n)) {
        if (!allowedNodes || allowedNodes.has(n)) {
          queue.push(n);
        }
      }
    }
  }

  return visited;
}
function floodingCount(startId, allowedNodes = null) {
  return floodingTest(startId, allowedNodes).size;
}
test("Flooding erreicht alle Knoten?", () => {
  const result = floodingTest(1);

console.log("Erreicht:", [...result]);
  expect(floodingCount(1)).toBe(240);
});