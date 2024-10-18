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
const draw = (event: MouseEvent) => {
    if (!drawing)
        return;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
};

const stopDrawing = () => {
    drawing = false;
};

// Register the mouse event listeners on the canvas
artCanvas.addEventListener('mousedown', startDrawing);
artCanvas.addEventListener('mousemove', draw);
artCanvas.addEventListener('mouseup', stopDrawing);
artCanvas.addEventListener('mouseleave', stopDrawing);

// Clear Button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
    ctx.fillRect(0, 0, 256, 256);
    ctx.closePath();
});
app.append(clearButton);
