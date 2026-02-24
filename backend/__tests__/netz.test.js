const { findPlacesAroundArea, areaMap } = require("../src/utils/netz");

test("jede area wird genau 6x getroffen", () => {
  const areaToPlaces = new Map();

  // area -> Set von places aufbauen
  for (const [place, areas] of Object.entries(areaMap)) {
    for (const area of areas) {
      if (!areaToPlaces.has(area)) {
        areaToPlaces.set(area, []);
      }
      areaToPlaces.get(area).push(Number(place));
    }
  }
});
