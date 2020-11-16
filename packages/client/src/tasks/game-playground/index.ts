import Konva from "konva";
import viewHtml from "./view.html";
import { TaskOpts, Task as BaseTask, Task } from "../../task";
import { TaskModule } from "../../taskManager";
import { HitContext } from "konva/types/Context";

/**
 * Maps are parsed rows -> columns.
 */
var map_01: string[] = [
  "WWWWWWWWWWWWW",
  "WTOOOOOOTOOOW",
  "WWWOOOOOOOOWW",
  "WWWOOOOOOWWWW",
  "WWOOOTOOOWWWW",
  "WOOOOOOOOOOOW",
  "WWOOWOOOOWOOW",
  "WWOWWWWWWWTOW",
  "WOOWWWWWWWWOW",
  "WOWWWOOWWWWOW",
  "WOOOOOTOOOOOW",
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

/**
 * The element type of a specific field on the grid.
 */
enum ElementType {
  Wall, // W
  OpenSpace, // O
  Task, // T
}

/**
 * Interface for "player moved" callback function.
 */
interface IPlayerMovedCB {
  (x: number, y: number): void;
}

/**
 * Interface for a task drawn on screen.
 */
interface IPlaygroundTask {
  taskModule: TaskModule;
  isCompleted?: boolean;
  x?: number;
  y?: number;
}

var gridSize: number = 50;
var player: Player;

/**
 * Define the base layer & its grid.
 */
var baseLayer: Konva.Layer;
var grid: GridObject[][];

/**
 * List of currently active tasks. These are all the tasks the player
 * needs to complete in order to win the game.
 */
var activeTasks: IPlaygroundTask[] = new Array();

/**
 * Check for task completion (win state).
 */
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

/**
 * Defines the player and stores the associated layer we used to draw him.
 * The player layer is different to the base layer for redrawing purposes.
 *
 * Important: The x and y coordinates store the player position on the grid,
 * and not absolute coordinates, so we can use them to iterate through the
 * grid array when doing the movement.
 */
export class Player {
  layer: Konva.Layer;
  stage: Konva.Stage;
  x: number;
  y: number;
  col: string;
  model: Konva.Circle;
  tooltip: Konva.Text;
  tooltipShape: Konva.Rect;
  public playerMovedCB: IPlayerMovedCB;

  constructor(x: number, y: number, col: string, layer: Konva.Layer, stage: Konva.Stage) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.stage = stage;
    this.col = col;

    this.model = new Konva.Circle({
      x: (x + 1) * gridSize - gridSize / 2,
      y: (y + 1) * gridSize - gridSize / 2,
      radius: gridSize / 2,
      fill: col,
      stroke: "black",
      strokeWidth: 2,
    });

    this.layer.add(this.model);

    /* Add tooltip to the player object */
    /* We do this first because we need the text size in order */
    /* to figure out how large the background needs to be. */
    this.tooltip = new Konva.Text({
      x: x * gridSize,
      y: y * gridSize,
      text: x + "," + y,
      fontFamily: 'Arial',
      fontSize: 12,
      padding: 5,
      fill: 'white',
      alpha: 0.75,
      visible: true,
    });
    this.tooltip.x(this.tooltip.x() + (gridSize / 2) - this.tooltip.width() / 2);
    this.tooltip.y(this.tooltip.y() + (gridSize / 2) - this.tooltip.height() / 2);

    /* Add a shape to draw the tooltip on */
    this.tooltipShape = new Konva.Rect({
      x: this.tooltip.x(),
      y: this.tooltip.y(),
      width: this.tooltip.width(),
      height: this.tooltip.height() - 2,
      fill: 'black',
      cornerRadius: 5,
      opacity: 0.6,
    });

    this.layer.add(this.tooltipShape);
    this.layer.add(this.tooltip);
    this.stage.add(this.layer);
  }

  /** 
   * Redraw the tooltip with new movement information.
   * Automatically centers the text inside the background object
   */
  refreshTooltip(text?: string) {
    if (text !== undefined) {
      this.tooltip.text(text);
    } else {
      this.tooltip.text(this.x + "," + this.y);
    }
    this.tooltip.x(this.x * gridSize + (gridSize / 2) - this.tooltip.width() / 2);
    this.tooltip.y(this.y * gridSize + (gridSize / 2) - this.tooltip.height() / 2);

    this.tooltipShape.x(this.tooltip.x());
    this.tooltipShape.y(this.tooltip.y());
    this.tooltipShape.width(this.tooltip.width());
    this.tooltipShape.height(this.tooltip.height() - 2);

    this.redraw();
  }

  /**
   * Movement functions with collision detection, the player element
   * is only allowed to move if its not moving towards a wall.
   * If we move onto a task field -> highlight and check completion.
   *
   * @param amount The amount of grid elements the player should move.
   */
  moveUp(amount: number) {
    var newPos = grid[this.y - amount][this.x];
    if (newPos !== undefined) {
      if (newPos.type != ElementType.Wall) {
        this.model.y(this.model.y() - amount * gridSize);
        this.y -= amount;
        this.refreshTooltip();

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
      if (newPos.type == ElementType.Task) {
        newPos.shape.fill("red");
        baseLayer.batchDraw();
        if (newPos.task !== undefined) {
          newPos.task.isCompleted = true;
          console.log(newPos.task);
          checkTaskCompletion();
        }
      }
    }
  }

  moveLeft(amount: number) {
    var newPos = grid[this.y][this.x - amount];
    if (newPos !== undefined) {
      if (newPos.type != ElementType.Wall) {
        this.model.x(this.model.x() - amount * gridSize);
        this.x -= amount;
        this.refreshTooltip();

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
      if (newPos.type == ElementType.Task) {
        newPos.shape.fill("red");
        baseLayer.batchDraw();
        if (newPos.task !== undefined) {
          newPos.task.isCompleted = true;
          console.log(newPos.task);
          checkTaskCompletion();
        }
      }
    }
  }

  moveRight(amount: number) {
    this.moveLeft(-amount);
  }

  moveDown(amount: number) {
    this.moveUp(-amount);
  }

  /**
   * Call this to update the player.
   */
  redraw() {
    this.layer.batchDraw();
  }

  /**
   * Attaches a callback function to this player object.
   * Called whenever the player moves onto a valid field.
   */
  attachCallback(cb: IPlayerMovedCB) {
    this.playerMovedCB = cb;
  }

  /**
   * Moves the player to the specified position and redraws.
   *
   * @param x X coordinate (grid coordinates)
   * @param y Y coordinate (grid coordinates)
   */
  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.model.x(x * gridSize + gridSize / 2);
    this.model.y(y * gridSize + gridSize / 2);

    this.redraw();
  }
}

/**
 * Represents a singular grid field on the screen and stores everything we
 * need to manipulate it later. By storing the shape we can update the color
 * and apply transformations after the initial draw.
 */
class GridObject {
  type: ElementType;
  shape: Konva.Shape;
  task: IPlaygroundTask;

  constructor(type: ElementType, shape: Konva.Shape, task?: IPlaygroundTask) {
    this.type = type;
    this.shape = shape;
    if (task !== undefined) this.task = task;
  }
}

export default class GamePlayground extends BaseTask {
  stage: Konva.Stage;
  constructor(opts: TaskOpts) {
    super(opts);
  }

  onMounted() {
    console.log(GamePlayground.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    this.setupGrid();
  }

  onUnmounting() {
    console.log(GamePlayground.name, "disconnected from DOM");
  }

  addPlayer(x: number, y: number, col: string, cb: IPlayerMovedCB): Player {
    var playerLayer = new Konva.Layer();
    const newPlayer = new Player(x, y, col, playerLayer, this.stage);

    newPlayer.attachCallback(cb);
    return newPlayer;
  }

  /**
   * Initializes the grid by creating a new layer (baseLayer) and looping
   * through the user defined map to draw and populate the grid structure.
   * Finally, creates the player layer and the player element.
   */
  setupGrid() {
    /* Initial setup (stage) */
    var width = window.innerWidth;
    var height = window.innerHeight;
    var containerDiv: HTMLDivElement = this.shadowRoot.getElementById("container") as HTMLDivElement;

    this.stage = new Konva.Stage({
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

    /**
     * Parse the map.
     */
    map_01.forEach((row) => {
      gridRow = new Array();
      for (let i = 0; i < row.length; i++) {
        switch (row.charAt(i)) {
          case "W":
            gridRow.push(
              new GridObject(
                ElementType.Wall,
                this.drawRect(baseLayer, this.stage, x + i * gridSize, y * gridSize, ElementType.Wall),
              ),
            );
            break;
          case "O":
            gridRow.push(
              new GridObject(
                ElementType.OpenSpace,
                this.drawRect(baseLayer, this.stage, x + i * gridSize, y * gridSize, ElementType.OpenSpace),
              ),
            );
            break;
          case "T":
            gridRow.push(
              new GridObject(
                ElementType.Task,
                this.drawRect(baseLayer, this.stage, x + i * gridSize, y * gridSize, ElementType.Task),
              ),
            );

            // awful code, will fix later (TODO)
            this.drawText(baseLayer, this.stage, x + i * gridSize, y * gridSize + gridSize / 2 - 10, "TASK");
            break;
        }
      }
      grid.push(gridRow);
      y += 1;
    });

    /* Create demo player */
    var playerLayer = new Konva.Layer();
    player = new Player(5, 5, "orange", playerLayer, this.stage);
    player.refreshTooltip("PLAYER 1");

    /* Attach demo callback */
    player.attachCallback(function (x: number, y: number): void {
      console.log("Player X: " + x + "; Y: " + y);
    });
  }

  /**
   * Draws a single rectangle on the stage. ElementType defines the type of
   * rectangle this function draws.
   *
   * @param layer The layer to draw to.
   * @param stage The stage to draw to.
   * @param x Absolute x coordinate (top left of rectangle)
   * @param y Absolute y coordinate (top right of rectangle)
   * @param type ElementType of the field.
   */
  drawRect(layer: Konva.Layer, stage: Konva.Stage, x: number, y: number, type: ElementType) {
    var elem: Konva.Rect;
    elem = new Konva.Rect({
      x: x,
      y: y,
      width: gridSize,
      height: gridSize,
      fill: "gray",
      stroke: "black",
      strokeWidth: 2,
    });

    if (type == ElementType.OpenSpace) {
      elem.fill("white");
    } else if (type == ElementType.Task) {
      elem.fill("yellow");
    }
    layer.add(elem);
    stage.add(layer);
    return elem;
  }

  /**
   * Draws a single text element to the specified x,y coordinate.
   */
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

  /**
   * Add a single task to the board and draw it.
   * If the task contains coordinates (X,Y) it will be added to the specified field.
   * If no coordinates are given we select a new random field.
   * 
   * Returns true if the task was added and false on error / no free space.
   */
  addTask(task: IPlaygroundTask): boolean {
    var res: boolean = false;
    if (task.x !== undefined && task.y !== undefined) {
      var go: GridObject = grid[task.x][task.y];
      if (go !== undefined) {
        go.type = ElementType.Task;
        go.shape.fill("yellow");
        res = true;
        activeTasks.push(task);
        console.log(go);
      }
    } else {
      grid.forEach((row) => {
        row.forEach((column) => {
          if (column.type === ElementType.Task && column.task == undefined) {
            column.task = task;
            activeTasks.push(task);
            console.log(column);
          }
        });
      });
    }
    return res;
  }

  /**
   * Hook for keyboard events.
   */
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

  getCurrentPlayer() {
    return player;
  }
}

customElements.define("game-playground", GamePlayground);
