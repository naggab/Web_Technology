import Konva from "konva";
import viewHtml from "./view.html";
import { TaskOpts, Task as BaseTask } from "../../../task";
import { HitContext } from "konva/types/Context";
import { map } from "lodash";
import { container, debug } from "webpack";
import { MapI, MapStorage } from "@apirush/common/src/maps";
import { Coordinate as Coord } from "@apirush/common/src/types";
import { PlayerInGameI } from "@apirush/common/src/types";
import { MasterOfDisaster } from "../../../masterOfDisaster";
import { CommandOp, Event, GameEventOp } from "@apirush/common";
import { Game } from "@apirush/server/src/game";

const cord = (x: number, y: number) => ({ x, y });

/**
 * Use this to globally enable / disable all console outputs.
 */
var DEBUG_MODE: boolean = false;
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

var modInstance: MasterOfDisaster;

/**
 * Define the base layer & its grid.
 */
var baseLayer: Konva.Layer;
var grid: GridObject[][];
var tasks: Task[];

// Layer for all other players
var foreignPlayerLayer: Konva.Layer;

// Keep a reference to all foreign players
var foreignPlayers: Player[];

var sprites: HTMLImageElement[];
var questionMarkSprite: HTMLImageElement;
var questionMarkDone: HTMLImageElement;

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
  model: Konva.Sprite;
  tooltip: Konva.Text;
  tooltipShape: Konva.Rect;
  radius: number;
  playerID: number;
  bibNumber: number;
  public playerMovedCB: IPlayerMovedCB;
  public onTaskOpenCB: IOnTaskOpenCB;

  constructor(
    x: number,
    y: number,
    col: string,
    layer: Konva.Layer,
    stage: Konva.Stage,
    playerID?: number,
    bibNumber?: number,
  ) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.stage = stage;
    this.col = col;
    this.radius = (gridSize / 2) * 3;

    if (playerID !== undefined) this.playerID = playerID;
    else this.playerID = -1;

    this.bibNumber = bibNumber;

    this.drawPlayer();
  }

  drawPlayer(clearAll?: boolean) {
    this.radius = (gridSize / 2) * 3;
    if (clearAll) {
      var children = this.layer.getChildren();
      children.toArray().forEach((child) => {
        child.remove();
      });
    }
    /*
    this.model = new Konva.Circle({
      x: (this.x + 1) * gridSize - gridSize / 2,
      y: (this.y + 1) * gridSize - gridSize / 2,
      radius: this.radius,
      fill: this.col,
      stroke: "black",
      strokeWidth: 2,
      name: this.playerID.toString(),
    });
    */
    var spriteNbr = (this.bibNumber - 1) % sprites.length;
    this.model = new Konva.Sprite({
      height: 64,
      width: 64,
      x: (this.x - 1) * gridSize,
      y: (this.y - 1) * gridSize,
      image: sprites[spriteNbr],
      animation: "idleRight",
      scaleX: (gridSize / 64.0) * 3,
      scaleY: (gridSize / 64.0) * 3,
      animations: {
        // x, y, width, height
        // prettier-ignore
        idleRight: [
          0, 0, 64, 64,
          64, 0, 64, 64,
          128, 0, 64, 64],
        // prettier-ignore
        idleLeft: [
          192, 0, 64, 64,
          256, 0, 64, 64,
          320, 0, 64, 64],
      },
      frameRate: 2,
      frameIndex: 0,
      name: this.playerID.toString(),
    });

    this.tooltip = new Konva.Text({
      x: this.x * gridSize,
      y: (this.y - 2) * gridSize,
      text: this.x + "," + this.y,
      fontFamily: "Arial",
      fontSize: 12,
      padding: 5,
      fill: "white",
      alpha: 0.75,
      visible: true,
      name: this.playerID.toString(),
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
      strokeWidth: 4,
      stroke: this.col,
      name: this.playerID.toString(),
    });

    this.layer.add(this.model);
    this.layer.add(this.tooltipShape);
    this.layer.add(this.tooltip);
    this.stage.add(this.layer);

    this.refreshTooltip();

    this.model.start();

    /* Add tooltip to the player object */
    /* We do this first because we need the text size in order */
    /* to figure out how large the background needs to be. */
  }

  /**
   * Redraw the tooltip with new movement information.
   * Automatically centers the text inside the background object
   */
  refreshTooltip(text?: string, x?: boolean, y?: boolean) {
    if (text !== undefined) {
      this.tooltip.text(text);
    } else if (this.playerID != -1) {
      this.tooltip.text("P" + this.bibNumber);
    } else {
      this.tooltip.text(this.x + "," + this.y);
    }
    if (x == undefined || x == true) this.tooltip.x(this.x * gridSize + gridSize / 2 - this.tooltip.width() / 2);
    if (y == undefined || y == true) this.tooltip.y((this.y - 2) * gridSize + gridSize / 2 - this.tooltip.height() / 2);

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
                //this.onTaskOpenCB(newPos.task);
                var taskPos = newPos;
                var ty = newPosY + i;
                var tx = newPosX + j;
                modInstance.openTask(taskPos.task).then((completed) => {
                  if (completed) {
                    // Get new grid object in case we had to redraw while doing the task
                    taskPos = grid[ty][tx];
                    var tpx = taskPos.shape.x();
                    var tpy = taskPos.shape.y();
                    taskPos.shape.remove();
                    if (taskPos) {
                      taskPos.shape = new Konva.Image({
                        x: tpx,
                        y: tpy,
                        image: questionMarkDone,
                        width: 16,
                        height: 16,
                        scaleX: gridSize / 16.0,
                        scaleY: gridSize / 16.0,
                      });
                      baseLayer.add(taskPos.shape);
                      baseLayer.batchDraw();
                    }
                  }
                });
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
    this.model.y((this.y - 1) * gridSize);
    this.refreshTooltip(undefined, false, true);
    var newPos = grid[this.y - amount][this.x];
    var foundCollision = this.checkCollision(this.y - amount, this.x);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        this.y -= amount;

        var iter = (gridSize / 7) * amount;
        var stop = this.model.y() - amount * gridSize;

        var anim = new Konva.Animation(
          function (frame) {
            this.model.y(this.model.y() - iter);
            this.tooltip.y(this.tooltip.y() - iter);
            this.tooltipShape.y(this.tooltipShape.y() - iter);
            if (amount > 0 && this.model.y() <= stop) {
              anim.stop();
              this.model.y(stop);
            } else if (amount < 0 && this.model.y() >= stop) {
              anim.stop();
              this.model.y(stop);
            }
          }.bind(this),
          this.layer,
        );
        anim.start();
        /*this.model.y(this.model.y() - amount * gridSize); */

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
    }
  }

  moveLeft(amount: number) {
    this.model.x((this.x - 1) * gridSize);
    this.refreshTooltip(undefined, true, false);
    this.model.animation("idleLeft");
    var newPos = grid[this.y][this.x - amount];
    var foundCollision = this.checkCollision(this.y, this.x - amount);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        //this.model.x(this.model.x() - amount * gridSize);
        this.x -= amount;

        var iter = (gridSize / 7) * amount;
        var stop = this.model.x() - amount * gridSize;

        var anim = new Konva.Animation(
          function (frame) {
            this.model.x(this.model.x() - iter);
            this.tooltip.x(this.tooltip.x() - iter);
            this.tooltipShape.x(this.tooltipShape.x() - iter);
            if (amount > 0 && this.model.x() <= stop) {
              anim.stop();
              this.model.x(stop);
            } else if (amount < 0 && this.model.x() >= stop) {
              anim.stop();
              this.model.x(stop);
            }
          }.bind(this),
          this.layer,
        );
        anim.start();

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
    }
  }

  moveRight(amount: number) {
    this.moveLeft(-amount);
    this.model.animation("idleRight");
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
    var oldx = this.x;

    if (x > oldx) this.model.animation("idleRight");
    else if (x < oldx) this.model.animation("idleLeft");

    this.x = x;
    this.y = y;

    this.model.x((x - 1) * gridSize);
    this.model.y((y - 1) * gridSize);

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

export default class GamePlayground extends HTMLElement {
  stage: Konva.Stage;
  map: MapI;
  timerFunction: any;
  keyMap: Map<number, boolean>;
  constructor() {
    super();
    this.keyMap = new Map();
    document.onkeydown = document.onkeyup = function (e) {
      if (this.keyMap.get(e.keyCode) != true && e.type == "keydown") {
        this.keyMap.set(e.keyCode, e.type == "keydown");
        this.handleMove(e.keyCode);
        clearInterval(this.timerFunction);
        this.timerFunction = false;
      } else {
        this.keyMap.set(e.keyCode, e.type == "keydown");
      }
      if (!this.timerFunction) {
        this.timerFunction = setInterval(this.keyDownCheck.bind(this), 150);
      }
    }.bind(this);
  }

  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    window.addEventListener("resize", (event) => {
      debugPrint("RESIZING");
      this.stage.clear();
      this.setupGrid();
      baseLayer.moveToBottom();
      this.getCurrentPlayer()
        .layer.getChildren()
        .toArray()
        .forEach((node) => {
          node.moveToTop();
        });

      this.getCurrentPlayer().drawPlayer(true);

      if (foreignPlayerLayer) {
        foreignPlayerLayer.setZIndex(1);
        foreignPlayerLayer
          .getChildren()
          .toArray()
          .forEach((child) => {
            child.remove();
          });
        foreignPlayers.forEach((fp) => {
          fp.drawPlayer();
        });
        this.stage.add(foreignPlayerLayer);
      }

      this.stage.add(this.getCurrentPlayer().layer);
    });
    //this.setupGrid();
    sprites = [];
    const imageObj = new Image();
    imageObj.src = "/assets/img/sprite1.png";
    await imageObj.decode();
    sprites.push(imageObj);

    const imageObj2 = new Image();
    imageObj2.src = "/assets/img/sprite2.png";
    await imageObj2.decode();
    sprites.push(imageObj2);

    const imageObj3 = new Image();
    imageObj3.src = "/assets/img/sprite3.png";
    await imageObj3.decode();
    sprites.push(imageObj3);

    const imageObj4 = new Image();
    imageObj4.src = "/assets/img/sprite4.png";
    await imageObj4.decode();
    sprites.push(imageObj4);

    questionMarkSprite = new Image();
    questionMarkSprite.src = "/assets/img/questionMarkSprite.png";
    await questionMarkSprite.decode();

    questionMarkDone = new Image();
    questionMarkDone.src = "/assets/img/questionMarkDone.png";

    modInstance = MasterOfDisaster.getInstance();
    if (!modInstance) throw console.error("no mod instance");

    /* Uncomment for testing playground without lobby */
    /*
    await modInstance.userWantsToJoin("MyPlayer");
    const listRes = await modInstance.serverSession.sendRPC(CommandOp.LIST_GAMES, {});
    await modInstance.joinGame(listRes.games[0].id);
    */

    this.setMap(MapStorage[modInstance.activeGame.map]);

    //const joinRes = await modInstance.serverSession.sendRPC(CommandOp.JOIN_GAME, { id: listRes.games[0].id });

    const listPlayerRes = await modInstance.serverSession.sendRPC(CommandOp.LIST_PLAYERS, {});
    listPlayerRes.players.forEach((p) => {
      // TODO get ID from MOD
      if (p.id != modInstance.myPlayerId) {
        this.addForeignPlayer(p);
      } else {
        this.setMyPlayer(p, this.sendMyPlayerMoved);
      }
    });

    this.foreignPlayerMoved = this.foreignPlayerMoved.bind(this);
    this.foreignPlayerJoined = this.foreignPlayerJoined.bind(this);
    this.foreignPlayerLeft = this.foreignPlayerLeft.bind(this);
    this.sendMyPlayerMoved = this.sendMyPlayerMoved.bind(this);

    modInstance.serverSession.subscribe(GameEventOp.PLAYER_MOVED, this.foreignPlayerMoved);
    modInstance.serverSession.subscribe(GameEventOp.PLAYER_JOINED, this.foreignPlayerJoined);
    modInstance.serverSession.subscribe(GameEventOp.PLAYER_LEFT, this.foreignPlayerLeft);
  }

  keyDownCheck() {
    if (this.keyMap == undefined || player == undefined) return;
    if (
      !this.keyMap.get(87) &&
      !this.keyMap.get(65) &&
      !this.keyMap.get(83) &&
      !this.keyMap.get(68) &&
      !this.keyMap.get(32)
    ) {
      clearInterval(this.timerFunction);
      this.timerFunction = false;
      player.model.frameRate(2);
      player.refreshTooltip();
      return;
    } else {
      player.model.frameRate(10);
      if (this.keyMap.get(87)) player.moveUp(1);
      if (this.keyMap.get(65)) player.moveLeft(1);
      if (this.keyMap.get(83)) player.moveDown(1);
      if (this.keyMap.get(68)) player.moveRight(1);
      player.redraw();
    }
  }

  handleMove(keyCode?: number) {
    if (keyCode == 87) player.moveUp(1);
    if (keyCode == 65) player.moveLeft(1);
    if (keyCode == 83) player.moveDown(1);
    if (keyCode == 68) player.moveRight(1);
    if (keyCode == 32) {
      if (player.checkCollision(player.y, player.x, true) == CollisionType.Task) {
        debugPrint("[SPCBR] pressed on player position: " + player.x + "," + player.y + " returns TASK in proximity");
      } else {
        debugPrint("[SPCBR] pressed on player position: " + player.x + "," + player.y + " ... no task in prox");
      }
    }
    player.redraw();
  }

  sendMyPlayerMoved(x: number, y: number) {
    modInstance.serverSession.sendRPC(CommandOp.MOVE, { position: { x, y } });
  }

  foreignPlayerMoved(event: Event<GameEventOp.PLAYER_MOVED>) {
    const { id, position } = event.payload;
    foreignPlayers.forEach((fp) => {
      if (fp.playerID == id) {
        fp.moveTo(position.x, position.y);
      }
    });
  }

  foreignPlayerJoined(event: Event<GameEventOp.PLAYER_JOINED>) {
    const foreignPlayer = event.payload;
    this.addForeignPlayer(foreignPlayer);
  }

  foreignPlayerLeft(event: Event<GameEventOp.PLAYER_LEFT>) {
    const { id } = event.payload;
    this.removeForeignPlayer(id);
  }

  disconnectedCallback() {}

  /**
   * Add a foreign player to the in-game and keep a reference to the object.
   *
   * @param fpl Player information
   */
  addForeignPlayer(fpl: PlayerInGameI): Player {
    if (!foreignPlayerLayer || !foreignPlayers) {
      foreignPlayerLayer = new Konva.Layer();
      foreignPlayers = new Array();
    }
    const newPlayer = new Player(
      fpl.position.x,
      fpl.position.y,
      fpl.color,
      foreignPlayerLayer,
      this.stage,
      fpl.id,
      fpl.bibNumber,
    );
    foreignPlayers.push(newPlayer);
    if (this.getCurrentPlayer()) {
      this.getCurrentPlayer()
        .layer.getChildren()
        .toArray()
        .forEach((node) => {
          node.moveToTop();
        });
      this.getCurrentPlayer().layer.moveToTop();
    }
    return newPlayer;
  }

  /**
   * Removes a foreign player from the stage, clearing the reference to the object.
   * Specifically, destroys every node in the foreignPlayerLayer whose name matches the playerID given in the
   * reference to the player object, including the shape itself and its associated tooltip.
   *
   * @param fpl A reference to the player ID that should be removed
   */
  removeForeignPlayer(fpl: number): boolean {
    var foundElem = false;
    for (let i = 0; i < foreignPlayers.length; i++) {
      if (foreignPlayers[i].playerID == fpl) {
        foreignPlayers.splice(i, 1);
        foreignPlayerLayer
          .find("." + fpl)
          .toArray()
          .forEach((node) => {
            node.destroy();
          });
        foundElem = true;
      }
    }
    foreignPlayerLayer.batchDraw();
    return foundElem;
  }

  /**
   * Set the current "main" player (myPlayer).
   *
   * @param mpl Player information
   * @param cb Callback that is to be executed when the player executes a move command
   */
  setMyPlayer(mpl: PlayerInGameI, cb: IPlayerMovedCB): Player {
    var playerLayer = new Konva.Layer();
    player = new Player(mpl.position.x, mpl.position.y, mpl.color, playerLayer, this.stage, mpl.id, mpl.bibNumber);
    playerLayer
      .getChildren()
      .toArray()
      .forEach((node) => {
        node.moveToTop();
      });
    player.attachCallback(cb);
    return player;
  }

  /**
   * Mark a task as complete.
   *
   * @param id The task ID (string)
   */
  setTaskComplete(id: string) {
    tasks.forEach((task) => {
      if (task.id == id) {
        var gridElement = grid[task.position.y][task.position.x];
        gridElement.shape.fill("green");
        task.isCompleted = true;
      }
    });
  }

  /**
   * Change the currently active map and setup the grid accordingly.
   *
   * @param map Map information
   */
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
    grid = [];
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
    //document.onkeydown = this.keyDown;

    /* Loop through map and draw the grid */
    var x: number = 0;
    var y: number = 0;

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
        //newPos.shape.fill("purple");
        var npx = newPos.shape.x();
        var npy = newPos.shape.y();
        console.log(npx, npy);
        newPos.shape.destroy();
        var spr: Konva.Sprite;
        spr = new Konva.Sprite({
          x: npx,
          y: npy,
          image: questionMarkSprite,
          animation: "idle",
          scaleX: gridSize / 16.0,
          scaleY: gridSize / 16.0,
          animations: {
            // prettier-ignore
            idle: [
              0, 0, 16, 16,
              16, 0, 16, 16],
          },
          frameRate: 4,
          frameIndex: 0,
        });
        baseLayer.add(spr);
        spr.start();
        newPos.shape = spr;

        newPos.type = ElementType.Task;
        newPos.task = key;
        if (tasks === undefined) tasks = new Array();
        tasks.push(new Task(key, cord(this.map.taskPositions[key].x, this.map.taskPositions[key].y), false));
      }
      baseLayer.batchDraw();
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
      opacity: 0.85,
    });

    if (DEBUG_MODE) {
      elem.stroke("darkgray");
      elem.strokeWidth(1);
    }

    if (type == ElementType.OpenSpace) {
      if (DEBUG_MODE) elem.fill("white");
      else elem.fill("transparent");
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
                grid[i][j].shape.destroy();
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

  getCurrentPlayer() {
    return player;
  }
}

customElements.define("game-playground", GamePlayground);
