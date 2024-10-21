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

type Point = { x: number, y: number };

interface Drawable {
    points: Point[];
    drag(point: Point): void;
    display(ctx: CanvasRenderingContext2D): void;
}

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
let currentThickness = 1; // Default to a thin marker

const ctx = artCanvas.getContext("2d");
if (!ctx) {
    throw new Error('Failed to retrieve 2D context from canvas.');
}

ctx.fillStyle = "white";
ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

const renderCanvas = () => {
    ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
    ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

    ctx.strokeStyle = 'black';

    strokes.forEach(stroke => stroke.display(ctx));
};

// Function to create the square cursor image
function createSquareCursor(thickness: number): string {
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = thickness * 2; // Size reflects thickness
    cursorCanvas.height = thickness * 2;
    const cursorCtx = cursorCanvas.getContext('2d');

    if (cursorCtx) {
        cursorCtx.fillStyle = 'black';
        cursorCtx.fillRect(0, 0, thickness * 2, thickness * 2); // Draw a filled square
    }

    return cursorCanvas.toDataURL('image/png');
}

function setCursor(thickness: number) {
    const cursorURL = createSquareCursor(thickness);
    artCanvas.style.cursor = `url(${cursorURL}) ${thickness / 2} ${thickness / 2}, auto`;
}

let drawing = false;

const stopDrawing = () => {
    drawing = false;
    if (currentStroke) {
        strokes.push(currentStroke);
        currentStroke = null;
        redoStack = [];
    }
    renderCanvas();
};

artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    drawing = true;
    const startPoint = { x: event.offsetX, y: event.offsetY };
    currentStroke = createMarkerLine(startPoint, currentThickness);
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    const nextPoint = { x: event.offsetX, y: event.offsetY };

    if (drawing && currentStroke) {
        currentStroke.drag(nextPoint);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
    }
});

artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);

const createToolButton = (text: string, thickness: number) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', () => {
        currentThickness = thickness;
        setCursor(thickness);

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

createToolButton('Thin', 4);
createToolButton('Thick', 8);

const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    strokes = [];
    currentStroke = null;
    redoStack = [];
    renderCanvas();
});
app.append(clearButton);

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

// Set initial cursor
setCursor(currentThickness);
