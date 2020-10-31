import Konva from "konva";
import viewHtml from "./view.html";

var map_01: string[] = [
  "WWWWWWWWWWWWW",
  "WTOOOOOOTOOOW",
  "WWWOOOOOOOOWW",
  "WWWOOOOOOWWWW",
  "WWOOOTOOOWWWW",
  "WOOOOOOOOOOOW",
  "WWOOWOOOOWOOW",
  "WWOWWWWWWWTWW",
  "WOOWWWWWWWWWW",
  "WOWWWOOWWWWWW",
  "WOOOOOTWWWWWW",
  "WWWWWWWWWWWWW",
];

var map_02: string[] = [
  "WWWWWWWWWWWWWWWWWWWWWW",
  "WTOOOOOOOOOOOOOOOOOOOW",
  "WOWWWWWWWWOWWWWWWWWWTW",
  "WOWWWOOOOOOWWWWWTWWWWW",
  "WOOOOOOOOOOWWWWWOWWWWW",
  "WOOOOOOOOOOOOOOOOOOOTW",
  "WOOOOOOOOOOOOOOOOOOOOW",
  "WOOOOOOOWWWOWOOOOOOOOW",
  "WOOOOWWWWWWOWWWWWOWWWW",
  "WOOTWWWWWWTOWWWWTOWWWW",
  "WWWWWWWWWWWWWWWWWWWWWW",
];

enum ElementType {
  Wall,
  OpenSpace,
  Task,
}

var gridSize: number = 50;
var player: Player;

var baseLayer: Konva.Layer;
var grid: GridObject[][];
var velocity: 10;

class Task {
  taskName: string;
  isCompleted: boolean;
  x: number;
  y: number;

  constructor(taskName: string) {
    this.taskName = taskName;
    this.isCompleted = false;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

var map_tasks: Task[] = [
  new Task("Task01"),
  new Task("Task02"),
  new Task("Task03"),
  new Task("Task04"),
  new Task("Task05"),
  new Task("Task06"),
];

var activeTasks: Task[] = new Array();

function checkTaskCompletion(): boolean {
  var done: boolean = true;
  activeTasks.forEach((task) => {
    if (task.isCompleted == false) {
      done = false;
    }
  });
  if (done) {
    alert("you won :)");
    return false; 
  } else {
    return true;
  }
}

class Player {
  layer: Konva.Layer;
  stage: Konva.Stage;
  x: number;
  y: number;
  model: Konva.Circle;

  constructor(x: number, y: number, layer: Konva.Layer, stage: Konva.Stage) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.stage = stage;

    this.model = new Konva.Circle({
      x: (x + 1) * gridSize - gridSize / 2,
      y: (y + 1) * gridSize - gridSize / 2,
      radius: gridSize / 2,
      fill: "green",
      stroke: "black",
      strokeWidth: 2,
    });

    this.layer.add(this.model);
    this.stage.add(this.layer);
  }

  moveUp(amount: number) {
    var newPos = grid[this.y - amount][this.x];
    if (newPos !== undefined) {
      if (newPos.type != ElementType.Wall) {
        this.model.y(this.model.y() - amount * gridSize);
        /*var model: Konva.Circle = this.model;
        var stop: number = model.y() - (amount * gridSize);
        var anim = new Konva.Animation(function(frame) {
          model.y(model.y() - (amount * gridSize * (frame.timeDiff / 1000) * 10));
          if (amount > 0 && model.y() <= stop) {
            anim.stop();
            model.y(stop);
          }
          if (amount < 0 && model.y() >= stop) {
            anim.stop();
            model.y(stop);
          }
        }, this.layer);
        
        anim.start();
        */
        this.y -= amount;
      }
      if (newPos.type == ElementType.Task) {
        newPos.shape.fill("red");
        baseLayer.batchDraw();
        newPos.task.isCompleted = true;
        console.log(newPos.task);
        checkTaskCompletion();
      }
    }
  }

  moveLeft(amount: number) {
    var newPos = grid[this.y][this.x - amount];
    if (newPos !== undefined) {
      if (newPos.type != ElementType.Wall) {
        this.model.x(this.model.x() - amount * gridSize);
        /*var model: Konva.Circle = this.model;
        var stop: number = model.x() - (amount * gridSize);
        var anim = new Konva.Animation(function(frame) {
          model.x(model.x() - (amount * gridSize * (frame.timeDiff / 1000) * 10));
          if (amount > 0 && model.x() <= stop) {
            anim.stop();
            model.x(stop);
          }
          if (amount < 0 && model.x() >= stop) {
            anim.stop();
            model.x(stop);
          }
        }, this.layer);
        anim.start();
        */
        this.x -= amount;
      }
      if (newPos.type == ElementType.Task) {
        newPos.shape.fill("red");
        baseLayer.batchDraw();
        newPos.task.isCompleted = true;
        console.log(newPos.task);
        checkTaskCompletion();
      }
    }
  }

  moveRight(amount: number) {
    this.moveLeft(-amount);
  }

  moveDown(amount: number) {
    this.moveUp(-amount);
  }

  redraw() {
    this.layer.batchDraw();
  }
}

class GridObject {
  type: ElementType;
  shape: Konva.Shape;
  task: Task;

  constructor(type: ElementType, shape: Konva.Shape, task?: Task) {
    this.type = type;
    this.shape = shape;
    if (task !== undefined) this.task = task;
  }
}

export class GamePlayground extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log(GamePlayground.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.setupGrid();
  }

  disconnectedCallback() {
    console.log(GamePlayground.name, "disconnected from DOM");
  }

  setupGrid() {
    /* Initial setup (stage) */
    var width = window.innerWidth;
    var height = window.innerHeight;
    var containerDiv: HTMLDivElement = this.shadowRoot.getElementById("container") as HTMLDivElement;

    var stage = new Konva.Stage({
      container: containerDiv,
      width: width,
      height: height,
    });

    baseLayer = new Konva.Layer();

    /* Attach keybaord events */
    document.onkeydown = this.keyDown;

    /* Loop through map and draw the grid */
    var x: number = 0;
    var y: number = 0;

    grid = new Array();
    var gridRow: GridObject[];
    map_01.forEach((row) => {
      gridRow = new Array();
      for (let i = 0; i < row.length; i++) {
        switch (row.charAt(i)) {
          case "W":
            gridRow.push(
              new GridObject(
                ElementType.Wall,
                this.drawRect(baseLayer, stage, x + i * gridSize, y * gridSize, ElementType.Wall),
              ),
            );
            break;
          case "O":
            gridRow.push(
              new GridObject(
                ElementType.OpenSpace,
                this.drawRect(baseLayer, stage, x + i * gridSize, y * gridSize, ElementType.OpenSpace),
              ),
            );
            break;
          case "T":
            var r = Math.floor(Math.random() * map_tasks.length);
            var gridTask: Task = map_tasks[r];
            map_tasks.splice(r, 1);

            gridRow.push(
              new GridObject(
                ElementType.Task,
                this.drawRect(baseLayer, stage, x + i * gridSize, y * gridSize, ElementType.Task),
                gridTask,
              ),
            );

            this.drawText(baseLayer, stage, x + i * gridSize, y * gridSize + gridSize / 2 - 10, gridTask.taskName);
            gridTask.setPosition(x + i, y);
            activeTasks.push(gridTask);
            break;
        }
      }
      grid.push(gridRow);
      y += 1;
    });

    /* Create player */
    var playerLayer = new Konva.Layer();
    player = new Player(5, 5, playerLayer, stage);
  }

  drawRect(layer: Konva.Layer, stage: Konva.Stage, x: number, y: number, type: ElementType) {
    var elem: Konva.Rect;
    if (type == ElementType.Wall) {
      elem = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "gray",
        stroke: "black",
        strokeWidth: 2,
      });
    } else if (type == ElementType.OpenSpace) {
      elem = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "white",
        stroke: "black",
        strokeWidth: 2,
      });
    } else if (type == ElementType.Task) {
      elem = new Konva.Rect({
        x: x,
        y: y,
        width: gridSize,
        height: gridSize,
        fill: "yellow",
        stroke: "black",
        strokeWidth: 2,
      });
    }
    layer.add(elem);
    stage.add(layer);
    return elem;
  }

  drawText(layer: Konva.Layer, stage: Konva.Stage, x: number, y: number, s: string) {
    var elem: Konva.Text = new Konva.Text({
      x: x,
      y: y,
      text: s,
      fontSize: 15,
      fontFamily: "Arial",
    });

    layer.add(elem);
    stage.add(layer);
  }

  keyDown(e) {
    switch (e.keyCode) {
      case 87:
        player.moveUp(1);
        break; // W
      case 65:
        player.moveLeft(1);
        break; // A
      case 83:
        player.moveDown(1);
        break; // S
      case 68:
        player.moveRight(1);
        break; // D
    }
    player.redraw();
  }
}

customElements.define("game-playground", GamePlayground);
