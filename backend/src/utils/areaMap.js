//areaMap.js
function netzErzeugen() {
  const netz = {};
  let iteration = 1;
  let Startwert;
  while (iteration <= 6) {
    Startwert = 1 + (iteration - 1) * 22;
    wert = Startwert;

    for (
      let i = 1 + (iteration - 1) * 40;
      i <= 19 + (iteration - 1) * 40;
      i += 2
    ) {
      netz[String(i)] = [wert, wert + 11, wert + 12];
      wert += 1;
    }

    wert = Startwert;

    for (
      let i = 2 + (iteration - 1) * 40;
      i <= 20 + (iteration - 1) * 40;
      i += 2
    ) {
      netz[String(i)] = [wert, wert + 1, wert + 11];
      wert += 1;
    }

    Startwert = Startwert + 11;
    wert = Startwert;

    for (
      let i = 21 + (iteration - 1) * 40;
      i <= 39 + (iteration - 1) * 40;
      i += 2
    ) {
      netz[String(i)] = [wert, wert + 1, wert + 11];
      wert += 1;
    }

    Startwert++;
    wert = Startwert;

    for (
      let i = 22 + (iteration - 1) * 40;
      i <= 40 + (iteration - 1) * 40;
      i += 2
    ) {
      netz[String(i)] = [wert, wert + 10, wert + 11];
      wert += 1;
    }

    iteration++;
  }

  return netz;
}

const netz = netzErzeugen();

module.exports = netz;
