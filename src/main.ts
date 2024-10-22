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
    display(ctx: CanvasRenderingContext2D): void;
}

interface StickerCommand extends Drawable {
    position: Point;
    setPosition(point: Point): void;
}

// Factory to create a sticker on a given position
function createSticker(emoji: string, position: Point): StickerCommand {
    return {
        position,
        setPosition(point: Point) {
            this.position = point;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, this.position.x, this.position.y);
        }
    };
}

interface MarkerLine extends Drawable {
    drag(point: Point): void;
}

function createMarkerLine(initialPoint: Point, thickness: number): MarkerLine {
    const points: Point[] = [initialPoint];

    return {
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
let currentStroke: MarkerLine | null = null;
let currentSticker: StickerCommand | null = null;
let redoStack: Drawable[] = [];
let currentThickness = 1; // Default to a thin marker
let currentEmoji = ''; // Tracks the currently selected emoji

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
    if (currentSticker) currentSticker.display(ctx);
};

// Function to create the square cursor image
function createSquareCursor(thickness: number): string {
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = thickness * 2;
    cursorCanvas.height = thickness * 2;
    const cursorCtx = cursorCanvas.getContext('2d');

    if (cursorCtx) {
        cursorCtx.fillStyle = 'black';
        cursorCtx.fillRect(0, 0, thickness * 2, thickness * 2);
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
    if (currentSticker) {
        strokes.push(currentSticker);
        currentSticker = null;
    }
    renderCanvas();
};

artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    const pointerPosition = { x: event.offsetX, y: event.offsetY };

    if (currentEmoji) {
        currentSticker = createSticker(currentEmoji, pointerPosition);
    } else {
        drawing = true;
        currentStroke = createMarkerLine(pointerPosition, currentThickness);
        ctx.beginPath();
        ctx.moveTo(pointerPosition.x, pointerPosition.y);
    }
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    const nextPoint = { x: event.offsetX, y: event.offsetY };

    // Drag functionality for stickers
    if (currentSticker) {
        currentSticker.setPosition(nextPoint);
        renderCanvas();
    }

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
        currentEmoji = ''; // Deselect any emoji
        setCursor(thickness);

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

// Create the tool buttons
createToolButton('Thin', 8);
createToolButton('Thick', 16);

// Sticker Buttons that fire `tool-moved`
const createStickerButton = (emoji: string) => {
    const button = document.createElement('button');
    button.textContent = emoji;
    button.addEventListener('click', () => {
        currentEmoji = emoji;
        currentThickness = 0; // Unset thickness as a drawing variable

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');

        // Fire a custom "tool-moved" event
        const event = new CustomEvent('tool-moved');
        artCanvas.dispatchEvent(event);
    });
    button.classList.add('tool-button');
    app.append(button);
};

// Add stickers
createStickerButton('😀');
createStickerButton('🔥');
createStickerButton('🌟');

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

// Event listener for "tool-moved"
artCanvas.addEventListener('tool-moved', () => {
    // You can add custom logic here
    console.log('Tool moved event fired');
});

// Initialize default cursor
setCursor(currentThickness);
