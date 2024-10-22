import "./style.css";

const APP_NAME = "Sticker Sketchbook";
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

// Interfaces
interface Drawable {
    display(ctx: CanvasRenderingContext2D): void;
}

interface EmojiCommand extends Drawable {
    position: Point;
    setPosition(point: Point): void;
}

function createEmoji(emoji: string, position: Point): EmojiCommand {
    return {
        position,
        setPosition(point: Point) {
            this.position = point;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.font = '30px Arial'; // Adjusted emoji size for clearer visibility
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, this.position.x, this.position.y);
        }
    };
}

interface BrushStroke extends Drawable {
    drag(point: Point): void;
}

function createBrushStroke(initialPoint: Point, thickness: number): BrushStroke {
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

let drawings: Drawable[] = [];
let currentBrushStroke: BrushStroke | null = null;
let currentEmojiCommand: EmojiCommand | null = null;
let redoStack: Drawable[] = [];
let currentThickness = 2; // More distinct thin marker
let currentEmoji = ''; // Tracks the currently selected emoji

const emojis: string[] = ['😊', '✨', '🐱', '🎨', '🌈']; // More varied and fun emojis

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

    drawings.forEach(drawable => drawable.display(ctx));
    if (currentEmojiCommand) currentEmojiCommand.display(ctx);
};

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
    if (currentBrushStroke) {
        drawings.push(currentBrushStroke);
        currentBrushStroke = null;
        redoStack = [];
    }
    if (currentEmojiCommand) {
        drawings.push(currentEmojiCommand);
        currentEmojiCommand = null;
    }
    renderCanvas();
};

artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    const pointerPosition = { x: event.offsetX, y: event.offsetY };

    if (currentEmoji) {
        currentEmojiCommand = createEmoji(currentEmoji, pointerPosition);
    } else {
        drawing = true;
        currentBrushStroke = createBrushStroke(pointerPosition, currentThickness);
        ctx.beginPath();
        ctx.moveTo(pointerPosition.x, pointerPosition.y);
    }
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    const nextPoint = { x: event.offsetX, y: event.offsetY };

    if (currentEmojiCommand) {
        currentEmojiCommand.setPosition(nextPoint);
        renderCanvas();
    }

    if (drawing && currentBrushStroke) {
        currentBrushStroke.drag(nextPoint);
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
        currentEmoji = '';
        setCursor(thickness);

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

// Create the brush buttons
createToolButton('Fine Line', 4);
createToolButton('Bold Line', 12);

// Create emoji buttons from array
const createEmojiButton = (emoji: string) => {
    const button = document.createElement('button');
    button.textContent = emoji;
    button.addEventListener('click', () => {
        currentEmoji = emoji;
        currentThickness = 0;

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');

        const event = new CustomEvent('tool-moved');
        artCanvas.dispatchEvent(event);
    });
    button.classList.add('tool-button');
    app.append(button);
};

// Initialize predefined emojis
emojis.forEach(createEmojiButton);

// Button to add a custom emoji
const addEmojiButton = document.createElement('button');
addEmojiButton.textContent = 'Add Emoji';
addEmojiButton.addEventListener('click', () => {
    const newEmoji = prompt('Enter your custom emoji:');
    if (newEmoji) {
        emojis.push(newEmoji);
        createEmojiButton(newEmoji);
    }
});
app.append(addEmojiButton);

// Export Button
const exportButton = document.createElement('button');
exportButton.textContent = 'Export';
exportButton.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext('2d');

    if (exportCtx) {
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        exportCtx.scale(4, 4);

        drawings.forEach(drawable => drawable.display(exportCtx));

        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'drawing.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
});
app.append(exportButton);

// Clear Button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    drawings = [];
    currentBrushStroke = null;
    redoStack = [];
    renderCanvas();
});
app.append(clearButton);

// Undo Button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
undoButton.addEventListener('click', () => {
    if (drawings.length > 0) {
        const lastDrawing = drawings.pop();
        if (lastDrawing) redoStack.push(lastDrawing);
        renderCanvas();
    }
});
app.append(undoButton);

// Redo Button
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const drawingToRedo = redoStack.pop();
        if (drawingToRedo) drawings.push(drawingToRedo);
        renderCanvas();
    }
});
app.append(redoButton);

artCanvas.addEventListener('tool-moved', () => {
    console.log('Tool moved event fired');
});

// Initial cursor setup
setCursor(currentThickness);
