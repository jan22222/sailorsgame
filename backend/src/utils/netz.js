const net1 = require("./adjMap.js"); // jetzt ist das ein Array
const net2 = require("./areaMap.js");

// adjMap als Map rekonstruieren
const adjMap = new Map(
  Object.entries(net1).map(([id, neighbors]) => [
    Number(id),
    new Set(neighbors),
  ]),
);

// areaMap analog, falls nötig
const areaMap = new Map(
  Object.entries(net2).map(([id, neighbors]) => [
    Number(id),
    new Set(neighbors),
  ]),
);

function findHood(nodeId) {
  if (!adjMap.has(nodeId)) return [];
  return Array.from(adjMap.get(nodeId)); // Set → Array
}

function buildingPossible(placeId) {
  if (!adjMap.has(placeId)) return [];

  const result = new Set();

  for (const neighbor of adjMap.get(placeId)) {
    const hood = adjMap.get(neighbor);
    if (!hood) continue;

    for (const n of hood) {
      result.add(n);
    }
  }

  return [...result];
}
const hexToCorners = new Map();

for (const [cornerId, hexSet] of areaMap) {
  for (const hexId of hexSet) {
    if (!hexToCorners.has(hexId)) {
      hexToCorners.set(hexId, []);
    }
    hexToCorners.get(hexId).push(cornerId);
  }
}

// --- OPTIMIERT: findPlacesAroundArea nutzt jetzt den schnellen Map-Zugriff ---
function findPlacesAroundArea(targetArea) {
  // Sicherstellen, dass targetArea eine Zahl ist, falls sie als String vom Socket kommt
  const id = Number(targetArea);
  return hexToCorners.get(id) || [];
}

// Export nicht vergessen (bleibt gleich)
module.exports = {
  adjMap,
  areaMap,
  findHood,
  findPlacesAroundArea,
  buildingPossible,
};
