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

// Markerline class
// Point Structure
type Point = { x: number, y: number };
interface Drawable {
    points: Point[];
    drag(point: Point): void;
    display(ctx: CanvasRenderingContext2D): void;
}
// Factory function for creating a marker line
function createMarkerLine(initialPoint: Point, thickness: number): Drawable {
    const points: Point[] = [initialPoint];

    return {
        points,
        drag(point: Point) {
            points.push(point);
        },
        display(ctx: CanvasRenderingContext2D) {
            if (points.length === 0) return;
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
            ctx.closePath();
        }
    };
}
let strokes: Drawable[] = [];
let currentStroke: Drawable | null = null; 
let redoStack: Drawable[] = [];
let currentThickness = 1;

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

    strokes.forEach(stroke => stroke.display(ctx));
};

let drawing = false;
// Handle drawing actions
const stopDrawing = () => {
    drawing = false;
    if (currentStroke) {
        strokes.push(currentStroke);
        currentStroke = null 
        redoStack = [];
    }
    renderCanvas();
};

// Register the mouse event listeners on the canvas
artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    drawing = true;
    const startPoint = { x: event.offsetX, y: event.offsetY };
    currentStroke = createMarkerLine(startPoint, currentThickness);
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (drawing && currentStroke) {
        const point = { x: event.offsetX, y: event.offsetY };
        currentStroke.drag(point);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
});

artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);

// Tool Buttons
const createToolButton = (text: string, thickness: number) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', () => {
        currentThickness = thickness;
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

// Create the tool buttons
createToolButton('Thin', 1);
createToolButton('Thick', 5);

// Clear Button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    strokes = [];
    currentStroke = null;
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
