function netzErzeugen() {

  const netz = {};
  let iteration = 1
  let Startwert
  while(iteration<=6){

     Startwert = 1 + (iteration-1) * 22;
    wert=Startwert

      for (let i = 1+(iteration-1)*40; i <= 19 + (iteration-1)*40 ; i+=2) {
            netz[String(i)] = [wert, wert + 11, wert + 12];
            wert +=1
      }
    
    wert=Startwert

      for (let i = 2+(iteration-1)*40 ; i <= 20 + (iteration-1)*40; i+=2) {
            netz[String(i)] = [wert, wert + 1, wert + 11];
            wert +=1
      }

    Startwert = Startwert+11;
    wert=Startwert
   
      for (let i = 21+ (iteration-1)*40; i <= 39 + (iteration-1)*40; i+=2) {
            netz[String(i)] = [wert, wert + 1, wert + 11];
            wert +=1
      }

    Startwert++;
    wert=Startwert

      for (let i = 22 + (iteration-1)*40; i <= 40 + (iteration-1)*40; i+=2) {
            netz[String(i)] = [wert, wert+10 , wert + 11];
            wert +=1
      }

    iteration++
  }
    
  return netz
}    
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
test('netzs ',()=>{
  const netz = netzErzeugen();
  console.log(netz);

})



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