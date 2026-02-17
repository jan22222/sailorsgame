// public/js/board.js
// Tiles unverändert, Vertices zick-zack für Flat-Top Hexes
let vertexPoints = [];
let selectedVertex = null;

let canvas, ctx;
let overlayCanvas, overlayCtx;

const CANVAS_W = 1250;
const CANVAS_H = 1250;
const HEX_RADIUS = 50;

// Tile Grid
const TILE_COLS = 13;
const TILE_ROWS = 11;

// Vertex Grid
const VERTEX_COLS = 12;  // ähnlich wie vorher
const VERTEX_ROWS = 20;  // pro Spalte
const HORIZ_SPACING = 44; // grob an Hex-Abstand
const VERT_SPACING = 50;  // grob an Hex-Abstand


class Point {
  constructor(x, y, placeId) {
    this.x = x;
    this.y = y;
    this.placeId = placeId;
  }
}

// ===================== VERTICES FÜR HEX-COLLISION =====================
function generateVerticesForHexMap() {
  vertexPoints = [];
  let placeId = 1;

  // Hex-Abstände (wie in deinem Code)
  const HEX_RADIUS = 50;
  const HORIZ_SPACING = 88; // horizontaler Abstand der Hex-Mitten
  const VERT_SPACING = 100; // vertikaler Abstand der Hex-Mitten

  // Versatz für pointy-top Hexes (rechts/links)
  const X_OFFSET = HEX_RADIUS;
  const Y_OFFSET = HEX_RADIUS;

  // Gesamt Hex Grid
  const TILE_COLS = 13;
  const TILE_ROWS = 11;

  // ---------------- SPALTENWEISE ----------------
  for (let col = 0; col < TILE_COLS - 1; col++) {
    const colEven = col % 2 === 0;

    // Obere Reihe von Vertex zwischen Spalte col und col+1
    for (let row = 0; row < TILE_ROWS - 1; row++) {
      // linke Hex-Spalte
      const leftHexX = col * HORIZ_SPACING+HORIZ_SPACING;
      const leftHexY = row * VERT_SPACING + (colEven ? 0 : VERT_SPACING / 2)+VERT_SPACING;
      const rightHexX = (col + 1) * HORIZ_SPACING+HORIZ_SPACING;
      const rightHexY = row * VERT_SPACING + ((col + 1) % 2 === 0 ? 0 : VERT_SPACING / 2)+VERT_SPACING;

      if(!colEven){
        
        // Vertex auf der unteren Seite der oberen Hex-Reihe
        const vx2 = rightHexX - HEX_RADIUS ;
        const vy2 = rightHexY + HEX_RADIUS ;

        vertexPoints.push(new Point(vx2, vy2, placeId));
        placeId++;
          // Vertex zwischen 3 Hexen: leicht nach rechts/links über die Spitze hinaus
        const vx = leftHexX + HEX_RADIUS ; // +2 für Versatz
        const vy = leftHexY + HEX_RADIUS ;
        vertexPoints.push(new Point(vx, vy, placeId));
        placeId++;

      }else{
        // Vertex zwischen 3 Hexen: leicht nach rechts/links über die Spitze hinaus
        const vx = leftHexX + HEX_RADIUS ; // +2 für Versatz
        const vy = leftHexY + HEX_RADIUS ;
        vertexPoints.push(new Point(vx, vy, placeId));
        placeId++;

        // Vertex auf der unteren Seite der oberen Hex-Reihe
        const vx2 = rightHexX - HEX_RADIUS ;
        const vy2 = rightHexY + HEX_RADIUS;

        vertexPoints.push(new Point(vx2, vy2, placeId));
        placeId++;

      }
    }
  }

  console.log("Vertex erzeugt:", vertexPoints.length);
}
// ===================== SETUP =====================
function setupCanvas(map) {
  canvas = document.getElementById("my-canvas");
  overlayCanvas = document.getElementById("overlay-canvas");

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  overlayCanvas.width = CANVAS_W;
  overlayCanvas.height = CANVAS_H;

  ctx = canvas.getContext("2d");
  overlayCtx = overlayCanvas.getContext("2d");

  vertexPoints = [];
  selectedVertex = null;

  drawHexMap(map);    
  generateVerticesForHexMap()

  redrawOverlay();
  overlayCanvas.addEventListener("click", onCanvasClick);
}

// ===================== HEX MAP =====================
function drawHexMap(map) {
  let tileId = 1;
  for (let col = 1; col <= TILE_COLS; col++) {
    for (let row = 1; row <= TILE_ROWS; row++) {
      const x = col * 88;
      const y = row * 100 + (col % 2) * 50;

      drawHex(x, y, map[tileId]);
      tileId++;
    }
  }
}

function drawHex(cx, cy, tile) {
  const angle = Math.PI / 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const px = cx + HEX_RADIUS * Math.cos(angle * i);
    const py = cy + HEX_RADIUS * Math.sin(angle * i);
    ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = resourceToColor(tile.res);
  ctx.fill();
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "bold 20px sans-serif";
  if(tile.num < 10){
    ctx.fillText(tile.num, cx - 7, cy + 7);
  }
  else{
    ctx.fillText(tile.num, cx - 12, cy + 7);
  }
}


// ===================== CLICK =====================
function onCanvasClick(event) {
  const rect = overlayCanvas.getBoundingClientRect();
  const scaleX = overlayCanvas.width / rect.width;
  const scaleY = overlayCanvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  selectedVertex = findNearestVertex(x, y, 30);
  redrawOverlay();

  console.log("CLICK placeId =", getSelectedPlaceId());
}

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

function getSelectedPlaceId() {
  return selectedVertex ? selectedVertex.placeId : null;
}

// ===================== OVERLAY =====================
function redrawOverlay() {
  overlayCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  overlayCtx.fillStyle = "rgba(180,180,180,0.9)";
  for (const p of vertexPoints) {
    overlayCtx.beginPath();
    overlayCtx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    overlayCtx.fill();
  }

  if (selectedVertex) {
    overlayCtx.strokeStyle = "red";
    overlayCtx.lineWidth = 4;
    overlayCtx.beginPath();
    overlayCtx.arc(selectedVertex.x, selectedVertex.y, 18, 0, Math.PI * 2);
    overlayCtx.stroke();
  }
}

// ===================== BUILDINGS =====================
function drawHouse(color, placeId) {
  const p = vertexPoints.find(v => v.placeId === placeId);
  if (!p) return;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
  const img = document.getElementById("scream");
  if (img) ctx.drawImage(img, p.x - 23, p.y - 28, 44, 54);
}

function drawVilla(color, placeId) {
  const p = vertexPoints.find(v => v.placeId === placeId);
  if (!p) return;

  ctx.fillStyle = color;
  ctx.strokeStyle = "orange";
  ctx.lineWidth = 4;
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

// ===================== HELPERS =====================
function resourceToColor(res) {
  switch (res) {
    case 1: return "#9c7e00";
    case 2: return "#ffff00";
    case 3: return "#a5d02a";
    case 4: return "darkgreen";
    case 5: return "#838383";
    case 6: return "#9fd7ff";
    case 7: return "#818146";
    default: return "#444";
  }
}

window.setupCanvas = setupCanvas;
window.getSelectedPlaceId = getSelectedPlaceId;
window.drawHouse = drawHouse;
window.drawVilla = drawVilla;