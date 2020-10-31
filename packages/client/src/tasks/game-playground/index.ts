import Konva from "konva";
import viewHtml from "./view.html";

var map_01: string[] = [
  "WWWWWWWWWWWWW",
  "WOOOOOOOOOOOW",
  "WWWOOOOOOOOWW",
  "WWWOOOOOOWWWW",
  "WWOOOTOOOWWWW",
  "WOOOOOOOOOOOW",
  "WWOOWOOOOWOOW",
  "WWOWWWWWWWTWW",
  "WWWWWWWWWWWWW",
];

enum ElementType {
  Wall,
  OpenSpace,
  Task,
}

var gridSize: number = 50;
var playerCircle: Konva.Circle;
var playerLayer: Konva.Layer;

export class GamePlayground extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log(GamePlayground.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.drawGrid();
  }

  disconnectedCallback() {
    console.log(GamePlayground.name, "disconnected from DOM");
  }

  drawGrid() {
    /* Initial setup (stage) */
    var width = window.innerWidth;
    var height = window.innerHeight;
    var containerDiv: HTMLDivElement = this.shadowRoot.getElementById("container") as HTMLDivElement;

    var stage = new Konva.Stage({
      container: containerDiv,
      width: width,
      height: height,
    });

    var layer = new Konva.Layer();

    /* Attach keybaord events */
    document.onkeydown = this.keyDown;

    /* Loop through map and draw the grid */
    var x: number = 0;
    var y: number = 0;

    map_01.forEach((row) => {
      console.log(row);
      for (let i = 0; i < row.length; i++) {
        switch (row.charAt(i)) {
          case "W":
            this.drawRect(layer, stage, x + i * gridSize, y, ElementType.Wall);
            break;
          case "O":
            this.drawRect(layer, stage, x + i * gridSize, y, ElementType.OpenSpace);
            break;
          case "T":
            this.drawRect(layer, stage, x + i * gridSize, y, ElementType.Task);
            break;
        }
      }
      y += gridSize;
    });

    /* Draw player */
    playerLayer = new Konva.Layer();
    this.drawPlayer(playerLayer, stage, 4 * gridSize, 5 * gridSize);
  }

  drawRect(layer: Konva.Layer, stage: Konva.Stage, x: number, y: number, type: ElementType) {
    if (type == ElementType.Wall) {
      var wall = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "gray",
        stroke: "black",
        strokeWidth: 2,
      });
      layer.add(wall);
    } else if (type == ElementType.OpenSpace) {
      var openSpace = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "white",
        stroke: "black",
        strokeWidth: 2,
      });
      layer.add(openSpace);
    } else if (type == ElementType.Task) {
      var task = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "yellow",
        stroke: "black",
        strokeWidth: 2,
      });
      layer.add(task);
    }

    stage.add(layer);
  }

  drawPlayer(layer: Konva.Layer, stage: Konva.Stage, x: number, y: number) {
    playerCircle = new Konva.Circle({
      x: x - gridSize / 2,
      y: y - gridSize / 2,
      radius: gridSize / 2,
      fill: "green",
      stroke: "black",
      strokeWidth: 2,
    });

    layer.add(playerCircle);
    stage.add(layer);
  }

  keyDown(e) {
    switch (e.keyCode) {
      case 87: playerCircle.y(playerCircle.y() - gridSize); break; // W
      case 65: playerCircle.x(playerCircle.x() - gridSize); break; // A
      case 83: playerCircle.y(playerCircle.y() + gridSize); break; // S 
      case 68: playerCircle.x(playerCircle.x() + gridSize); break; // D
    }
    playerLayer.batchDraw();
  }
}

customElements.define("game-playground", GamePlayground);
