import "./style.css";

const APP_NAME = "Sticker Drawer";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// App Title Header
const appTitle = document.createElement("h1");
appTitle.textContent = APP_NAME;
app.append(appTitle);

// Canvas
const artCanvas = document.createElement("canvas");
artCanvas.id = 'artCanvas';
artCanvas.height = 256;
artCanvas.width = 256;
app.append(artCanvas);

// Point Structure
type Point = {
    x: number,
    y: number
};
let strokes: Point[][] = [];
let currentStroke: Point[] = [];

// Mouse Events
let drawing = false;
const startDrawing = (event: MouseEvent) => {
    drawing = true;
    draw(event);
};

const ctx = artCanvas.getContext("2d");
if (!ctx) {
    throw new Error('Failed to retrieve 2d context from canvas.');
}
ctx.fillStyle = "white";
ctx.fillRect(0, 0, 256, 256);
const draw = (MouseEvent) => {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, 256, 256);
    strokes.forEach(stroke => {
        ctx.beginPath();
        if (stroke.length > 0) {
            ctx.moveTo(stroke[0].x, stroke[0].y);
            stroke.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    });
};
const dispatchDrawingChangeEvent = () => {
    const event = new CustomEvent('drawing-changed');
    artCanvas.dispatchEvent(event);
}
const stopDrawing = () => {
    drawing = false;
    if (currentStroke.length >0) {
        strokes.push(currentStroke);
        currentStroke = [];
    }
};

// Register the mouse event listeners on the canvas
artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    drawing = true;
    currentStroke = [{x: event.offsetX, y: event.offsetY}]
    strokes.push(currentStroke);  // Start a new stroke immediately
    dispatchDrawingChangeEvent(); // Immediate update
});
artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (drawing) {
        currentStroke.push({x: event.offsetX, y: event.offsetY});
        dispatchDrawingChangeEvent();
    }
});
artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);
artCanvas.addEventListener('drawing-changed', draw);
// Clear Button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    strokes = [];
    currentStroke = [];
    ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
    ctx.fillRect(0, 0, 256, 256);
    ctx.closePath();
});
app.append(clearButton);
