import Konva from "konva";
import viewHtml from "./view.html";
import { TaskOpts, Task as BaseTask, Task } from "../../../task";
import { TaskModule } from "../../../taskManager";
import { HitContext } from "konva/types/Context";
import { map } from "lodash";
import { container, debug } from "webpack";
import { MapI, MapStorage } from "@apirush/common/src/maps";
import { Coordinate as Coord } from "@apirush/common/src/types";

const cord = (x: number, y: number) => ({ x, y });

/**
 * Use this to globally enable / disable all console outputs.
 */
var DEBUG_MODE: boolean = true;
function debugPrint(x: any) {
  if (DEBUG_MODE) {
    console.log(x);
  }
}

/**
 * The element type of a specific field on the grid.
 */
enum ElementType {
  Wall, // W
  OpenSpace, // O
  Task, // T
}

/**
 * We can collide with walls and tasks, potentially with players (NYI)
 */
enum CollisionType {
  None,
  Wall,
  Task,
  Player,
}

/**
 * Interface for "player moved" callback function.
 */
interface IPlayerMovedCB {
  (x: number, y: number): void;
}

/**
 * Interface for "player opens task" callback function.
 */
interface IOnTaskOpenCB {
  (id: string): void;
}

/**
 * Interface for a task drawn on screen.
 */
interface IPlaygroundTask {
  taskModule: TaskModule;
  isCompleted?: boolean;
  x?: number;
  y?: number;
  id?: string;
}

class Task {
  id: string;
  position: Coord;
  isCompleted: boolean;

  constructor(id: string, position: Coord, isCompleted: boolean) {
    this.id = id;
    this.position = position;
    this.isCompleted = isCompleted;
  }
}

var gridSize: number = 20; // simple default value, overwritten later
var gridLength: number = 50; // this defines the actual gridsize based on div width
var gridSizeHeight: number = 10;
var gridRows: number = 30;
var player: Player;

/**
 * Define the base layer & its grid.
 */
var baseLayer: Konva.Layer;
var grid: GridObject[][];
var tasks: Task[];

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
  radius: number;
  playerID: number;
  public playerMovedCB: IPlayerMovedCB;
  public onTaskOpenCB: IOnTaskOpenCB;

  constructor(x: number, y: number, col: string, layer: Konva.Layer, stage: Konva.Stage, playerID?: number) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.stage = stage;
    this.col = col;
    this.radius = (gridSize / 2) * 3;

    if (playerID !== undefined) this.playerID = playerID;
    else this.playerID = -1;

    this.model = new Konva.Circle({
      x: (x + 1) * gridSize - gridSize / 2,
      y: (y + 1) * gridSize - gridSize / 2,
      radius: this.radius,
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
      fontFamily: "Arial",
      fontSize: 12,
      padding: 5,
      fill: "white",
      alpha: 0.75,
      visible: true,
    });
    this.tooltip.x(this.tooltip.x() + gridSize / 2 - this.tooltip.width() / 2);
    this.tooltip.y(this.tooltip.y() + gridSize / 2 - this.tooltip.height() / 2);

    /* Add a shape to draw the tooltip on */
    this.tooltipShape = new Konva.Rect({
      x: this.tooltip.x(),
      y: this.tooltip.y(),
      width: this.tooltip.width(),
      height: this.tooltip.height() - 2,
      fill: "black",
      cornerRadius: 5,
      opacity: 0.6,
    });

    this.layer.add(this.tooltipShape);
    this.layer.add(this.tooltip);
    this.stage.add(this.layer);

    this.refreshTooltip();
  }

  /**
   * Redraw the tooltip with new movement information.
   * Automatically centers the text inside the background object
   */
  refreshTooltip(text?: string) {
    if (text !== undefined) {
      this.tooltip.text(text);
    } else if (this.playerID != -1) {
      this.tooltip.text("P" + this.playerID);
    } else {
      this.tooltip.text(this.x + "," + this.y);
    }
    this.tooltip.x(this.x * gridSize + gridSize / 2 - this.tooltip.width() / 2);
    this.tooltip.y(this.y * gridSize + gridSize / 2 - this.tooltip.height() / 2);

    this.tooltipShape.x(this.tooltip.x());
    this.tooltipShape.y(this.tooltip.y());
    this.tooltipShape.width(this.tooltip.width());
    this.tooltipShape.height(this.tooltip.height() - 2);

    this.redraw();
  }

  /**
   * Manual collision detection, checks collisions around the new
   * player position.
   */
  checkCollision(newPosY: number, newPosX: number, openTask?: boolean): CollisionType {
    var col: CollisionType = CollisionType.None;
    var radiusIncr: number = (this.radius - gridSize / 2) / gridSize;
    for (let i = -radiusIncr; i <= radiusIncr; i++) {
      for (let j = -radiusIncr; j <= radiusIncr; j++) {
        var newPos = grid[newPosY + i][newPosX + j];
        if (newPos !== undefined) {
          if (newPos.type == ElementType.Wall) {
            col = CollisionType.Wall;
          } else if (newPos.type == ElementType.Task) {
            if (openTask !== undefined) {
              if (openTask) {
                this.onTaskOpenCB(newPos.task);
                newPos.shape.fill("red");
                baseLayer.batchDraw();
              }
            }
            if (col != CollisionType.Wall) col = CollisionType.Task;
          }
        }
      }
    }

    return col;
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
    var foundCollision = this.checkCollision(this.y - amount, this.x);
    debugPrint(foundCollision);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        this.model.y(this.model.y() - amount * gridSize);
        this.y -= amount;
        this.refreshTooltip();

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
    }
  }

  moveLeft(amount: number) {
    var newPos = grid[this.y][this.x - amount];
    var foundCollision = this.checkCollision(this.y, this.x - amount);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        this.model.x(this.model.x() - amount * gridSize);
        this.x -= amount;
        this.refreshTooltip();

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
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

  attachOnTaskOpenCb(cb: IOnTaskOpenCB) {
    this.onTaskOpenCB = cb;
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

    this.refreshTooltip();
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
  task: string;

  constructor(type: ElementType, shape: Konva.Shape, task?: string) {
    this.type = type;
    this.shape = shape;
    if (task !== undefined) this.task = task;
  }
}

export default class GamePlayground extends BaseTask {
  stage: Konva.Stage;
  map: MapI;
  constructor(opts: TaskOpts) {
    super(opts);
  }

  onMounted() {
    console.log(GamePlayground.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    window.addEventListener("resize", (event) => {
      this.setupGrid();
    });
    //this.setupGrid();

    /* DEMO */
    this.setMap(MapStorage.map1);
  }

  onUnmounting() {
    console.log(GamePlayground.name, "disconnected from DOM");
  }

  addPlayer(x: number, y: number, col: string, cb: IPlayerMovedCB, id?: number): Player {
    var playerLayer = new Konva.Layer();
    const newPlayer = new Player(x, y, col, playerLayer, this.stage, id);

    newPlayer.attachCallback(cb);
    return newPlayer;
  }

  setPlayer(x: number, y: number, col: string, cb: IPlayerMovedCB, id?: number): Player {
    var playerLayer = new Konva.Layer();
    player = new Player(20, 20, "orange", playerLayer, this.stage, 0);
    return player;
  }

  setTaskComplete(id: string) {
    tasks.forEach((task) => {
      if (task.id == id) {
        var gridElement = grid[task.position.y][task.position.x];
        gridElement.shape.fill("green");
        task.isCompleted = true;
      }
    });
  }

  setMap(map: MapI) {
    if (map !== undefined) {
      this.map = map;
      gridLength = map.width;
      gridRows = map.height;
      this.setupGrid();
    }
  }

  /**
   * Initializes the grid by creating a new layer (baseLayer) and looping
   * through the user defined map to draw and populate the grid structure.
   * Finally, creates the player layer and the player element.
   */
  setupGrid() {
    /* Initial setup (stage) */

    var containerDiv: HTMLDivElement = this.shadowRoot.getElementById("container") as HTMLDivElement;

    containerDiv.setAttribute("style", "width: 100%");
    containerDiv.style.width = "100%";

    var width = containerDiv.clientWidth;
    var height = containerDiv.clientHeight;

    gridSizeHeight = Math.floor(height / gridRows);
    gridSize = Math.floor(width / gridLength);

    gridSize = Math.min(gridSizeHeight, gridSize);

    containerDiv.setAttribute("style", "width: " + (gridSize * gridLength).toString() + "px");
    containerDiv.setAttribute("style", "height: " + (gridSize * gridRows).toString() + "px");
    containerDiv.style.width = (gridSize * gridLength).toString() + "px";

    width = gridSize * gridLength;
    height = gridSize * gridRows;
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
    debugPrint("Empty map mode - width: " + this.map.width + ", height: " + this.map.height);
    for (let h = 0; h < this.map.height; h++) {
      gridRow = new Array();
      for (let w = 0; w < this.map.width; w++) {
        if (w != 0 && h != 0 && w != this.map.width - 1 && h != this.map.height - 1) {
          gridRow.push(
            new GridObject(
              ElementType.OpenSpace,
              this.drawRect(baseLayer, this.stage, w * gridSize, y * gridSize, ElementType.OpenSpace),
            ),
          );
        } else {
          /* Automatically place walls around the specified size */
          gridRow.push(
            new GridObject(
              ElementType.Wall,
              this.drawRect(baseLayer, this.stage, w * gridSize, y * gridSize, ElementType.Wall),
            ),
          );
        }
        /* Debug grid indicators */
        if (w == 0 && DEBUG_MODE)
          this.drawText(baseLayer, this.stage, w * gridSize + 1, y * gridSize + 1, h.toString());
        if (h == 0 && DEBUG_MODE)
          this.drawText(baseLayer, this.stage, w * gridSize + 1, y * gridSize + 1, w.toString());
      }

      grid.push(gridRow);
      y += 1;
      //this.stage.height(this.stage.height() + gridSize);
    }

    this.stage.add(baseLayer);

    /* Draw all the specified walls */
    this.map.walls.forEach((wall) => {
      this.addWall(wall);
    });

    /* DEMO - Adding tasks in all possible locations */

    for (var key in this.map.taskPositions) {
      debugPrint(
        "Adding task [" +
          key +
          "] on coordinates (X,Y) [" +
          this.map.taskPositions[key].x +
          ", " +
          this.map.taskPositions[key].y +
          "]",
      );
      var newPos = grid[this.map.taskPositions[key].y][this.map.taskPositions[key].x];
      if (newPos !== undefined) {
        newPos.shape.fill("purple");
        newPos.type = ElementType.Task;
        newPos.task = key;
        if (tasks === undefined) tasks = new Array();
        tasks.push(new Task(key, cord(this.map.taskPositions[key].x, this.map.taskPositions[key].y), false));
      }
    }

    /* DEMO IMPLEMENTATION BLOCK
    // PLAYER
    var playerLayer = new Konva.Layer();
    player = new Player(20, 20, "orange", playerLayer, this.stage, 0);

    // CALLBACK
    player.attachCallback(function (x: number, y: number): void {
      debugPrint("Player X: " + x + "; Y: " + y);
    });

    // + WALL
    this.addWall([new Coord(5, 17), new Coord(10, 17), new Coord(10, 22), new Coord(30, 22)]);

    // - WALL
    this.removeWall([new Coord(10, 29), new Coord(27, 29)]);
    */
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
    });

    if (DEBUG_MODE) {
      elem.stroke("darkgray");
      elem.strokeWidth(1);
    }

    if (type == ElementType.OpenSpace) {
      elem.fill("white");
    } else if (type == ElementType.Task) {
      elem.fill("yellow");
    }
    elem.listening(false);
    elem.transformsEnabled("position");
    layer.add(elem);
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
      fontSize: gridSize / 2,
      fontFamily: "Arial",
    });

    layer.add(elem);
  }

  /**
   * Adds a single wall to the board and draw it.
   *
   * @param wall The coordinates of a single wall, given as an Array.
   */
  addWall(wall: Coord[]): void {
    this.modifyElements(wall, ElementType.Wall);
  }

  /**
   * Removes a single wall from the board.
   *
   * @param wall The coordinates of a single wall, given as an Array.
   */
  removeWall(wall: Coord[]): void {
    this.modifyElements(wall, ElementType.OpenSpace);
  }

  /**
   * Modifies an array of coordinates on the board.
   * Coordinates are parsed as "edge points", meaning a wall can be defined by all its corners
   *
   * @param coord Array of x,y coordinates
   * @param elemType ElementType that should be applied to all coordinates
   */
  modifyElements(coord: Coord[], elemType: ElementType): void {
    var previousCoord: Coord = undefined;
    var start_y: number;
    var end_y: number;
    var start_x: number;
    var end_x: number;
    coord.forEach((c) => {
      if (grid[c.y] !== undefined) {
        if (grid[c.y][c.x] !== undefined) {
          if (previousCoord !== undefined) {
            debugPrint(
              "Inside the thing, c.x: " +
                c.x +
                ", c.y: " +
                c.y +
                " // p.x: " +
                previousCoord.x +
                ", p.y: " +
                previousCoord.y,
            );
            if (previousCoord.y < c.y) {
              start_y = previousCoord.y;
              end_y = c.y;
            } else {
              start_y = c.y;
              end_y = previousCoord.y;
            }
            if (previousCoord.x < c.x) {
              start_x = previousCoord.x;
              end_x = c.x;
            } else {
              start_x = c.x;
              end_x = previousCoord.x;
            }
            debugPrint("start_y: " + start_y + ", end_y: " + end_y + ", start_x: " + start_x + ", end_x: " + end_x);
            for (let i = start_y; i <= end_y; i++) {
              for (let j = start_x; j <= end_x; j++) {
                (grid[i][j].shape = this.drawRect(baseLayer, this.stage, j * gridSize, i * gridSize, elemType)),
                  (grid[i][j].type = elemType);
              }
            }
          }
          previousCoord = c;
        }
      }
    });
    baseLayer.batchDraw();
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
      case 32:
        if (player.checkCollision(player.y, player.x, true) == CollisionType.Task) {
          debugPrint("[SPCBR] pressed on player position: " + player.x + "," + player.y + " returns TASK in proximity");
        } else {
          debugPrint("[SPCBR] pressed on player position: " + player.x + "," + player.y + " ... no task in prox");
        }
        break;
    }
    player.redraw();
  }

  getCurrentPlayer() {
    return player;
  }
}

customElements.define("game-playground", GamePlayground);
