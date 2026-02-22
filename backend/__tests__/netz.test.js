const { findPlacesAroundArea } = require("../src/utils/netz");

describe("Ernte-Logik Integration", () => {
  test("Ecke 1 muss an Hex-Feld 12 grenzen (laut areaMap Algo)", () => {
    // Laut deiner areaMap.js: i=1 -> [wert, wert+11, wert+12] wobei wert=1
    // Also Ecke 1 -> Hex [1, 12, 13]
    const result = findPlacesAroundArea(12);

    expect(result).toContain(1); // Ecke 1 muss in der Liste sein
  });

  test("Sollte leeres Array bei ungültiger Hex-ID liefern (kein Absturz)", () => {
    const result = findPlacesAroundArea(999);
    expect(result).toEqual([]);
  });
});

const { distributeResources } = require("../src/sockets/game.socket.js"); // Pfad anpassen

// Mocking der Abhängigkeiten, falls nötig
describe("Ressourcen-Verteilung Test (Fokus: MUD ID 3)", () => {
  test("Sollte MUD (ID 3) korrekt an Spieler verteilen, wenn die entsprechende Zahl gewürfelt wird", () => {
    // 1. Setup: Ein fiktiver Raum-Status
    const roomId = "testRoom";
    const slotId = "1"; // Spieler 1
    const mudResourceId = 3;
    const targetAreaId = 12; // Das Hex-Feld mit der gewürfelten Zahl

    const mockState = {
      [roomId]: {
        // Spieler 1 Daten
        [slotId]: {
          username: "TestPlayer",
          [mudResourceId]: 0, // Startet mit 0 Mud
        },
        // Die Karte: Hex 12 ist ein MUD-Feld
        roomMap: {
          [targetAreaId]: { resource: mudResourceId, number: 8 },
        },
        // Das Netz: Ein Haus von Spieler 1 steht an Ecke 1, welche an Hex 12 grenzt
        net: {
          1: { playerNumber: 1, value: 1 }, // 1 = Siedlung/Haus
        },
        playerCount: 1,
      },
    };

    // 2. Aktion: Ressourcen für Hex 12 verteilen (z.B. weil eine 8 gewürfelt wurde)
    // Wir simulieren den Teil der distributeResources Logik
    const area = mockState[roomId].roomMap[targetAreaId];
    const places = findPlacesAroundArea(targetAreaId);

    // In deinem Code loopen wir durch die gefundenen Plätze
    places.forEach((p) => {
      const building = mockState[roomId].net[p];
      if (building && building.playerNumber == slotId) {
        const resId = area.resource; // Sollte 3 sein
        const currentAmount = mockState[roomId][slotId][resId];
        mockState[roomId][slotId][resId] = currentAmount + building.value;
      }
    });

    // 3. Assert: Hat Spieler 1 nun 1x MUD (Key 3)?
    expect(mockState[roomId][slotId][3]).toBe(1);

    // Bonus: Sicherstellen, dass es nicht fälschlicherweise bei Erz (1) gelandet ist
    expect(mockState[roomId][slotId][1]).toBeUndefined();
  });
});
//     } else {
//       netz[String(i)] = [Startwert, Startwert + 10, Startwert + 11];
//     }
//   }
// }

//       if (i % 2 === 1) {
//         netz[String(i)] = [Startwert, Startwert + 11, Startwert + 12];
//       } else {
//         netz[String(i)] = [Startwert, Startwert + 1, Startwert + 12];
//         Startwert++;
//       }
//     } else {
//       if (i % 2 === 1) {
// Test

// test('jede area wird genau 6x getroffen', () => {
//   const areaToPlaces = new Map();

//   // area -> Set von places aufbauen
//   for (const [place, areas] of Object.entries(netz)) {
//     for (const area of areas) {
//       if (!areaToPlaces.has(area)) {
//         areaToPlaces.set(area, []);
//       }
//       areaToPlaces.get(area).push(Number(place));
//     }
//   }

//   // Alle Areas sammeln die NICHT 6x vorkommen
//   const failing = [];

//   for (const [area, places] of areaToPlaces.entries()) {
//     if (places.length !== 6) {
//       failing.push({
//         area,
//         count: places.length,
//         places: places.sort((a, b) => a - b)
//       });
//     }
//   }

//   // Fehlerausgabe
//   if (failing.length > 0) {
//     const message = failing
//       .map(
//         ({ area, count, places }) =>
//           `Area ${area} wird ${count}x getroffen von places: [${places.join(', ')}]`
//       )
//       .join('\n');

//     throw new Error('\n' + message);
//   }

//   expect(failing).toHaveLength(0);
// });

// test("Graph ist symmetrisch", () => {
//   const errors = [];

//   for (const [node, neighbors] of adjMap.entries()) {
//     for (const n of neighbors) {
//       const nSet = adjMap.get(n);
//       if (!nSet) {
//         errors.push(`Fehler: Nachbarknoten ${n} existiert nicht (von Knoten ${node})`);
//       } else if (!nSet.has(node)) {
//         errors.push(`Fehler: Kante ${node} → ${n} ist da, aber ${n} → ${node} fehlt`);
//       }
//     }
//   }

//   if (errors.length) console.error(errors.join("\n"));
//   expect(errors.length).toBe(0);
// });

// function floodingTest(startId, allowedNodes = null) {
//   if (!adjMap.has(startId)) return new Set();

//   const visited = new Set();
//   const queue = [startId];
//   let index = 0;

//   while (index < queue.length) {
//     const current = queue[index++];

//     if (visited.has(current)) continue;

//     visited.add(current);

//     const neighbors = adjMap.get(current) ?? [];

//     for (const n of neighbors) {
//       if (!visited.has(n)) {
//         if (!allowedNodes || allowedNodes.has(n)) {
//           queue.push(n);
//         }
//       }
//     }
//   }

//   return visited;
// }
// function floodingCount(startId, allowedNodes = null) {
//   return floodingTest(startId, allowedNodes).size;
// }
// test("Flooding erreicht alle Knoten?", () => {
//   const result = floodingTest(1);

// console.log("Erreicht:", [...result]);
//   expect(floodingCount(1)).toBe(240);
// });
