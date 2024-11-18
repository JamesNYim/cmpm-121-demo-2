import "./style.css";

const APP_NAME = "Sticker Sketchbook";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Header
const appTitle = document.createElement("h1");
appTitle.textContent = APP_NAME;
app.append(appTitle);

// Canvas setup
const artCanvas = document.createElement("canvas");
artCanvas.id = 'artCanvas';
artCanvas.height = 256;
artCanvas.width = 256;
app.append(artCanvas);

type Point = { x: number, y: number };

// Interfaces
interface Drawable {
    display(ctx: CanvasRenderingContext2D): void;
}

interface EmojiCommand extends Drawable {
    position: Point;
    setPosition(point: Point): void;
    rotation: number;
}

function createEmoji(emoji: string, position: Point, rotation: number): EmojiCommand {
    return {
        position,
        rotation,
        setPosition(point: Point) {
            this.position = point;
        },
        display(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 0, 0);
            ctx.restore();
        }
    };
}

interface BrushStroke extends Drawable {
    drag(point: Point): void;
    color: string;
}

function createBrushStroke(initialPoint: Point, thickness: number, color: string): BrushStroke {
    const points: Point[] = [initialPoint];

    return {
        color,
        drag(point: Point) {
            points.push(point);
        },
        display(ctx: CanvasRenderingContext2D) {
            if (points.length === 0) return;

            ctx.lineWidth = thickness;
            ctx.strokeStyle = this.color;
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
let currentThickness = 4;
let currentColor = "#000000";
let currentEmoji = '';
let emojiRotation = 0;
const emojis = ['😊', '✨', '🐱', '🎨', '🌈'];

const ctx = artCanvas.getContext("2d");
if (!ctx) {
    throw new Error('Failed to retrieve 2D context from canvas.');
}

ctx.fillStyle = "white";
ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

function renderCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);

        drawings.forEach(drawable => drawable.display(ctx));
    }
}

function createSquareCursor(thickness: number): string {
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = thickness * 2;
    cursorCanvas.height = thickness * 2;
    const cursorCtx = cursorCanvas.getContext('2d');
    if (cursorCtx) {
        cursorCtx.fillStyle = currentColor;
        cursorCtx.fillRect(0, 0, thickness * 2, thickness * 2);
    }
    return cursorCanvas.toDataURL('image/png');
}

function setCursorForBrush(thickness: number) {
    const cursorURL = createSquareCursor(thickness);
    artCanvas.style.cursor = `url(${cursorURL}) ${thickness / 2} ${thickness / 2}, auto`;
}

function setCursorForEmoji(emoji: string, rotation: number) {
    const size = 64;  // Larger size for visibility
    const cursorCanvas = document.createElement('canvas');
    cursorCanvas.width = size;
    cursorCanvas.height = size;
    const cursorCtx = cursorCanvas.getContext('2d');

    if (cursorCtx) {
        cursorCtx.clearRect(0, 0, size, size);
        cursorCtx.save();
        cursorCtx.translate(size / 2, size / 2);
        cursorCtx.rotate((Math.PI / 180) * rotation);
        cursorCtx.font = '30px Arial';
        cursorCtx.textAlign = 'center';
        cursorCtx.textBaseline = 'middle';
        cursorCtx.fillText(emoji, 0, 0);
        cursorCtx.restore();
    }

    const cursorURL = cursorCanvas.toDataURL('image/png');
    artCanvas.style.cursor = `url(${cursorURL}) ${size / 2} ${size / 2}, auto`;
}

let drawing = false;

function stopDrawing() {
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
}

artCanvas.addEventListener('mousedown', (event: MouseEvent) => {
    const pointerPosition = { x: event.offsetX, y: event.offsetY };

    if (currentEmoji) {
        currentEmojiCommand = createEmoji(currentEmoji, pointerPosition, emojiRotation);
    } else {
        drawing = true;
        currentBrushStroke = createBrushStroke(pointerPosition, currentThickness, currentColor);

        ctx.beginPath();
        ctx.moveTo(pointerPosition.x, pointerPosition.y);
    }
});

artCanvas.addEventListener('mousemove', (event: MouseEvent) => {
    if (!drawing || !currentBrushStroke) return;

    const nextPoint = { x: event.offsetX, y: event.offsetY };

    currentBrushStroke.drag(nextPoint);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
});

artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);

const createToolButton = (text: string, thickness: number) => {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', () => {
        currentThickness = thickness;
        setCursorForBrush(thickness);
        currentEmoji = '';
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

createToolButton('Fine Line', 4);
createToolButton('Bold Line', 12);

const createEmojiButton = (emoji: string) => {
    const button = document.createElement('button');
    button.textContent = emoji;
    button.addEventListener('click', () => {
        currentEmoji = emoji;
        emojiRotation = Math.random() * 360;  // Randomize rotation angle

        setCursorForEmoji(emoji, emojiRotation);

        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selectedTool'));
        button.classList.add('selectedTool');
    });
    button.classList.add('tool-button');
    app.append(button);
};

emojis.forEach(createEmojiButton);

function addCustomEmoji() {
    const newEmoji = prompt('Enter your custom emoji:');
    if (newEmoji) {
        emojis.push(newEmoji);
        createEmojiButton(newEmoji);
    }
}

function exportCanvas() {
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
            const url = URL.createObjectURL(blob!);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'drawing.png';
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}

function createAbilityButton(buttonText: string, ability: () => void) {
    const button = document.createElement('button');
    button.textContent = buttonText;
    button.addEventListener('click', ability);
    app.append(button);
}

const buttons = [
    { text: 'Add Emoji', action: addCustomEmoji },
    { text: 'Export', action: exportCanvas },
    { text: 'Clear', action: () => {
        drawings = [];
        currentBrushStroke = null;
        redoStack = [];
        renderCanvas();
    }},
    { text: 'Undo', action: () => {
        if (drawings.length > 0) {
            const lastDrawing = drawings.pop();
            if (lastDrawing) redoStack.push(lastDrawing);
            renderCanvas();
        }
    }},
    { text: 'Redo', action: () => {
        if (redoStack.length > 0) {
            const drawingToRedo = redoStack.pop();
            if (drawingToRedo) drawings.push(drawingToRedo);
            renderCanvas();
        }
    }},
]

buttons.forEach(({ text, action }) => createAbilityButton(text, action));

const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = currentColor;
colorPicker.addEventListener('input', () => {
    currentColor = colorPicker.value;
    setCursorForBrush(currentThickness);
});
app.append(colorPicker);

setCursorForBrush(currentThickness);
