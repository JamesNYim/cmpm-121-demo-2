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
type Point = { x: number, y: number };
let strokes: Point[][] = [];
let currentStroke: Point[] = [];
let redoStack: Point[][] = [];

let drawing = false;

const ctx = artCanvas.getContext("2d");
if (!ctx) {
    throw new Error('Failed to retrieve 2D context from canvas.');
}

// Initialize the canvas
ctx.fillStyle = "white";
ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

// Draw function
const renderCanvas = () => {
    ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
    ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    strokes.forEach(stroke => {
        ctx.beginPath();
        if (stroke.length > 0) {
            ctx.moveTo(stroke[0].x, stroke[0].y);
            stroke.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.closePath();
        }
    });
};

// Handle drawing actions
const stopDrawing = () => {
    drawing = false;
    if (currentStroke.length > 0) {
        strokes.push(currentStroke);
        currentStroke = [];
        redoStack = [];
    }
    renderCanvas();
};

// Register the mouse event listeners on the canvas
artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    drawing = true;
    currentStroke = [{ x: event.offsetX, y: event.offsetY }];
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (drawing) {
        const point = { x: event.offsetX, y: event.offsetY };
        currentStroke.push(point);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
});

artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);

// Clear Button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    strokes = [];
    currentStroke = [];
    redoStack = [];
    renderCanvas();
});
app.append(clearButton);

// Undo Button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
undoButton.addEventListener('click', () => {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        if (lastStroke) redoStack.push(lastStroke);
        renderCanvas();
    }
});
app.append(undoButton);

// Redo Button
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const strokeToRedo = redoStack.pop();
        if (strokeToRedo) strokes.push(strokeToRedo);
        renderCanvas();
    }
});
app.append(redoButton);
