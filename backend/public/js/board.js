// public/js/board.js
// Board rendering + click selection + building draw helpers

let vertexPoints = [];     // früher: Netz
let tiles = [];            // früher: asteroids
let selectedVertex = null; // früher: aktpunkt

let canvas, ctx;              // base (map)
let overlayCanvas, overlayCtx; // overlay (punkte + selection)


const CANVAS_W = 1250;
const CANVAS_H = 1250;

// Map: placeId (1..240) -> vertexPoints index (1-based) mapping
// Dein altes trans[] war blockweise: Block 1 (1..20) nur Paare,
// ab Block 2: (20k+1) fix, (20k) fix, dazwischen Paare.
const placeToVertexIndex = buildPlaceToVertexIndexMap();

// Reverse: vertexIndex (1..N) -> placeId (1..240)
const vertexIndexToPlaceId = buildVertexIndexToPlaceId(placeToVertexIndex);

function buildPlaceToVertexIndexMap() {
  const map = new Array(241);

  for (let block = 0; block < 12; block++) {
    const start = block * 20 + 1; // 1,21,41,...,221
    const end = start + 19;       // 20,40,...,240

    if (block === 0) {
      // 1..20: (1<->2), (3<->4) ... (19<->20)
      for (let id = start; id <= end; id += 2) {
        map[id] = id + 1;
        map[id + 1] = id;
      }
    } else {
      // 21..40, 41..60, ...:
      // start (z.B. 21) bleibt, end (z.B. 40) bleibt
      map[start] = start;
      map[end] = end;

      for (let id = start + 1; id < end; id += 2) {
        map[id] = id + 1;
        map[id + 1] = id;
      }
    }
  }

  return map;
}

function buildVertexIndexToPlaceId(placeToIdx) {
  const rev = {};
  for (let placeId = 1; placeId <= 240; placeId++) {
    const idx = placeToIdx[placeId];
    rev[idx] = placeId;
  }
  return rev;
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Tile {
  constructor(x, y, tileNo, diceNumber, fillColor) {
    this.visible = true;
    this.x = x;
    this.y = y;
    this.radius = 50;
    this.angle = 0;
    this.tileNo = tileNo;       // früher: no
    this.diceNumber = diceNumber; // früher: zahl
    this.fillColor = fillColor;

    this.draw();
    tiles.push(this);
  }

  draw() {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "grey";
    ctx.fillStyle = this.fillColor;

    ctx.beginPath();
    const vertAngle = (Math.PI * 2) / 6;
    const radians = (this.angle / Math.PI) * 180;

    for (let i = 0; i < 6; i++) {
      ctx.lineTo(
        this.x - this.radius * Math.cos(vertAngle * i + radians),
        this.y - this.radius * Math.sin(vertAngle * i + radians)
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Zahlenlabel
    ctx.fillStyle = "#000033";
    ctx.font = "italic bold 32px sans-serif";
    let txt = String(this.diceNumber);
    if (txt.length !== 2) txt = " " + txt;
    ctx.fillText(txt, this.x - 20, this.y + 10);

    // --- Vertex points einsammeln (deine alte Logik beibehalten) ---
    // Diese Sonderfälle verhindern doppelte Punkte an Rändern.
    if (this.tileNo > 11) {
      if (
        this.tileNo !== 12 &&
        this.tileNo !== 34 &&
        this.tileNo !== 56 &&
        this.tileNo !== 78 &&
        this.tileNo !== 100 &&
        this.tileNo !== 122 &&
        this.tileNo !== 144
      ) {
        if (
          this.tileNo !== 33 &&
          this.tileNo !== 55 &&
          this.tileNo !== 77 &&
          this.tileNo !== 99 &&
          this.tileNo !== 121 &&
          this.tileNo !== 143
        ) {
          // Vertex 0
          vertexPoints.push(
            new Point(
              this.x - 9 - this.radius * Math.cos(vertAngle * 0 + radians),
              this.y - this.radius * Math.sin(vertAngle * 0 + radians)
            )
          );
        }

        if (
          this.tileNo !== 23 &&
          this.tileNo !== 45 &&
          this.tileNo !== 67 &&
          this.tileNo !== 89 &&
          this.tileNo !== 111 &&
          this.tileNo !== 133
        ) {
          // Vertex 1
          vertexPoints.push(
            new Point(
              this.x - 5 - this.radius * Math.cos(vertAngle * 1 + radians),
              -8 + this.y - this.radius * Math.sin(vertAngle * 1 + radians)
            )
          );
        }
      }
    }
  }
}

// Debug helper (optional)
function drawVertexDebug(points, highlightPoint) {
  // Normale Punkte: gefüllte Kreise
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); // <- Größe der Punkte
    ctx.fillStyle = "#9aa0a6";            // grau
    ctx.fill();
    ctx.closePath();
  }

  // Highlight: Ring/Rahmen (nicht füllen)
  if (highlightPoint) {
    ctx.beginPath();
    ctx.arc(highlightPoint.x, highlightPoint.y, 14, 0, Math.PI * 2); // <- Ringgröße
    ctx.strokeStyle = "#ff3b30";  // rot
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();
  }
}

function placeIdFromSelectedVertex() {
  if (!selectedVertex) return null;
  const idx0 = vertexPoints.findIndex((p) => p === selectedVertex);
  const vertexIndex1Based = idx0 + 1;
  return vertexIndexToPlaceId[vertexIndex1Based] || null;
}

// ===== Public API (wird vom restlichen Frontend genutzt) =====

function setupCanvas(map) {
  canvas = document.getElementById("my-canvas");
  overlayCanvas = document.getElementById("overlay-canvas");

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  overlayCanvas.width = CANVAS_W;
  overlayCanvas.height = CANVAS_H;

  ctx = canvas.getContext("2d");
  overlayCtx = overlayCanvas.getContext("2d");

  // reset
  vertexPoints = [];
  tiles = [];
  selectedVertex = null;

  // Tiles zeichnen (auf BASE)
  let tileId = 1;
  for (let col = 1; col < 14; col++) {
    for (let row = 1; row < 12; row++) {
      const res = map[tileId].res;
      const num = map[tileId].num;
      const color = resourceToColor(res);
      new Tile(col * 88, row * 100 + (col % 2) * 50, tileId, num, color);
      tileId++;
    }
  }

  // Overlay initial zeichnen (graue Punkte direkt sichtbar)
  redrawOverlay();

  // Klick auf OVERLAY (nicht base)
  overlayCanvas.addEventListener("click", onCanvasClick);
}


function resourceToColor(res) {
  switch (res) {
    case 1: return "#9c7e00";   // mud/lehm
    case 2: return "#dbdb00";   // grains/weizen
    case 3: return "#a5d02a";   // sheep
    case 4: return "darkgreen"; // wood
    case 5: return "#838383";   // metals/erz
    case 6: return "#9fd7ff"; // water
    case 7: return "#ecece6";   // desert
    default: return "#444";
  }
}


function onCanvasClick(event) {
  const rect = overlayCanvas.getBoundingClientRect();
  const scaleX = overlayCanvas.width / rect.width;
  const scaleY = overlayCanvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  selectedVertex = findNearestVertex(x, y, 30);

  redrawOverlay();

  const placeId = placeIdFromSelectedVertex();
  console.log("CLICK", "x=", Math.round(x), "y=", Math.round(y), "placeId=", placeId);
}

function drawVertexOverlay(points, highlightPoint) {
  // overlay komplett löschen
  overlayCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // graue Punkte (größer und sichtbar)
  overlayCtx.fillStyle = "rgba(180,180,180,0.9)";
  for (const p of points) {
    overlayCtx.beginPath();
    overlayCtx.arc(p.x, p.y, 6, 0, Math.PI * 2); // punktgröße
    overlayCtx.fill();
  }

  // Highlight: Ring + Rahmen
  if (highlightPoint) {
    // Außenring
    overlayCtx.strokeStyle = "red";
    overlayCtx.lineWidth = 4;
    overlayCtx.beginPath();
    overlayCtx.arc(highlightPoint.x, highlightPoint.y, 18, 0, Math.PI * 2);
    overlayCtx.stroke();

    // optional: innerer Ring
    overlayCtx.strokeStyle = "rgba(255,255,255,0.8)";
    overlayCtx.lineWidth = 2;
    overlayCtx.beginPath();
    overlayCtx.arc(highlightPoint.x, highlightPoint.y, 12, 0, Math.PI * 2);
    overlayCtx.stroke();
  }
}

function redrawOverlay() {
  drawVertexOverlay(vertexPoints, selectedVertex);
}

// “nächster Punkt” statt abs(x/y) – stabiler
function findNearestVertex(x, y, maxDist) {
  let best = null;
  let bestD2 = maxDist * maxDist;

  for (const p of vertexPoints) {
    const dx = p.x - x;
    const dy = p.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = p;
    }
  }
  return best;
}

// Wird vom UI-Button genutzt: sendet placeId zurück (oder null)
function getSelectedPlaceId() {
  return placeIdFromSelectedVertex();
}

// Gebäude zeichnen (state.net[placeId].value)
function drawHouse(color, placeId) {
  const vertexIndex = placeToVertexIndex[placeId];
  if (!vertexIndex) return;

  const p = vertexPoints[vertexIndex - 1];
  if (!p) return;

  ctx.fillStyle = color;
  ctx.strokeStyle = "transparent";

  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  const img = document.getElementById("scream");
  if (img) ctx.drawImage(img, p.x - 23, p.y - 28, 44, 54);
}


function drawVilla(color, placeId) {
  const vertexIndex = placeToVertexIndex[placeId];
  if (!vertexIndex) return;

  const p = vertexPoints[vertexIndex - 1];
  if (!p) return;

  // Hintergrund-Kreis etwas größer (40 statt 30)
  ctx.fillStyle = color;
  ctx.strokeStyle = "orange";
  ctx.lineWidth = 4; // Breiterer Rand für Schiffe

  ctx.beginPath();
  ctx.arc(p.x, p.y, 40, 0, 2 * Math.PI); 
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  // Das Icon (scream) ebenfalls größer skalieren
  const img = document.getElementById("scream");
  if (img) {
    // Original beim Haus war: p.x - 23, p.y - 28, 44, 54
    // Hier jetzt ca. 25% größer:
    const width = 55;
    const height = 68;
    ctx.drawImage(img, p.x - (width / 2), p.y - (height / 2), width, height);
  }
}

// Exports in global scope (weil du plain HTML nutzt)
window.setupCanvas = setupCanvas;
window.getSelectedPlaceId = getSelectedPlaceId;
window.drawHouse = drawHouse;
window.drawVilla = drawVilla;
