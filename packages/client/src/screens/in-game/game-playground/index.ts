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

var ANIMATIONS_ENABLED: boolean = true;
var DEBUG_MODE: boolean = true;

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
 * Interface for "game finished" callback function.
 */
export interface IGameDidFinishCB {
  (wid: number): void;
}

export interface IDebugToggleCB {
  (d: boolean): void;
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

var modInstance: MasterOfDisaster;

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
  playground: GamePlayground;
  playerName: string;
  didInteractWithTask: boolean;
  public playerMovedCB: IPlayerMovedCB;
  public onTaskOpenCB: IOnTaskOpenCB;

  taskOpen: boolean;

  constructor(
    x: number,
    y: number,
    col: string,
    layer: Konva.Layer,
    stage: Konva.Stage,
    playground: GamePlayground,
    playerID?: number,
    bibNumber?: number,
  ) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.stage = stage;
    this.col = col;
    this.radius = (gridSize / 2) * 3;
    this.playground = playground;
    this.playerName = "";
    this.didInteractWithTask = false;

    if (playerID !== undefined) this.playerID = playerID;
    else this.playerID = -1;

    this.bibNumber = bibNumber;
    this.taskOpen = false;

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
    var spriteNbr = (this.bibNumber - 1) % this.playground.sprites.length;
    this.model = new Konva.Sprite({
      height: 64,
      width: 64,
      x: (this.x - 1) * gridSize,
      y: (this.y - 1) * gridSize,
      image: this.playground.sprites[spriteNbr],
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
      listening: false,
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
      listening: false,
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
      listening: false,
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
      this.playerName = text;
    } else if (this.playerName != "") {
      this.tooltip.text(this.playerName);
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

  calculateTooltipPos(): Coord {
    let c_x = this.x * gridSize + gridSize / 2 - this.tooltip.width() / 2;
    let c_y = (this.y - 2) * gridSize + gridSize / 2 - this.tooltip.height() / 2;
    return cord(c_x, c_y);
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
        var newPos = this.playground.grid[newPosY + i][newPosX + j];
        if (newPos !== undefined) {
          if (newPos.type == ElementType.Wall) {
            col = CollisionType.Wall;
          } else if (newPos.type == ElementType.Task) {
            if (!this.didInteractWithTask)
              this.playground.showPopup(modInstance.getString().in_game.startTask, 3000, 16);
            if (openTask !== undefined) {
              if (openTask) {
                this.didInteractWithTask = true;
                //this.onTaskOpenCB(newPos.task);
                var taskPos = newPos;
                var ty = newPosY + i;
                var tx = newPosX + j;
                this.taskOpen = true;
                modInstance.openTask(taskPos.task).then((completed) => {
                  this.taskOpen = false;
                  if (completed) {
                    // Get new grid object in case we had to redraw while doing the task
                    taskPos = this.playground.grid[ty][tx];
                    var tpx = taskPos.shape.x();
                    var tpy = taskPos.shape.y();
                    taskPos.shape.remove();
                    if (taskPos) {
                      taskPos.shape = new Konva.Image({
                        x: tpx,
                        y: tpy,
                        image: this.playground.questionMarkDone,
                        width: 16,
                        height: 16,
                        scaleX: gridSize / 16.0,
                        scaleY: gridSize / 16.0,
                      });
                      this.playground.baseLayer.add(taskPos.shape);
                      this.playground.baseLayer.batchDraw();
                      var t = this.playground.tasks.find((element) => element.id == taskPos.task);
                      if (t) t.isCompleted = true;
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
    //this.model.y((this.y - 1) * gridSize);
    //if (ANIMATIONS_ENABLED) this.refreshTooltip(undefined, false, true);
    var newPos = this.playground.grid[this.y - amount][this.x];
    var foundCollision = this.checkCollision(this.y - amount, this.x);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        this.y -= amount;

        if (ANIMATIONS_ENABLED) {
          /*
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
          anim.start();*/
          let tPos = this.calculateTooltipPos();
          this.model.to({ y: (this.y - 1) * gridSize, duration: 0.14 });
          this.tooltip.to({ y: tPos.y, duration: 0.14 });
          this.tooltipShape.to({ y: tPos.y, duration: 0.14 });
        } else {
          this.model.y(this.model.y() - amount * gridSize);
          this.refreshTooltip(undefined, false, true);
        }

        if (this.playerMovedCB !== undefined) {
          this.playerMovedCB(this.x, this.y);
        }
      }
    }
  }

  moveLeft(amount: number) {
    //this.model.x((this.x - 1) * gridSize);
    //if (ANIMATIONS_ENABLED) this.refreshTooltip(undefined, true, false);
    if (amount < 0) this.model.animation("idleRight");
    else this.model.animation("idleLeft");
    var newPos = this.playground.grid[this.y][this.x - amount];
    var foundCollision = this.checkCollision(this.y, this.x - amount);
    if (newPos !== undefined && foundCollision != CollisionType.Wall) {
      if (newPos.type != ElementType.Wall) {
        //this.model.x(this.model.x() - amount * gridSize);
        this.x -= amount;

        if (ANIMATIONS_ENABLED) {
          /*
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
          anim.start();*/
          let tPos = this.calculateTooltipPos();
          this.model.to({ x: (this.x - 1) * gridSize, duration: 0.14 });
          this.tooltip.to({ x: tPos.x, duration: 0.14 });
          this.tooltipShape.to({ x: tPos.x, duration: 0.14 });
        } else {
          this.model.x(this.model.x() - amount * gridSize);
          this.refreshTooltip(undefined, true, false);
        }

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
    var oldx = this.x;

    if (x > oldx) this.model.animation("idleRight");
    else if (x < oldx) this.model.animation("idleLeft");

    this.x = x;
    this.y = y;

    if (ANIMATIONS_ENABLED) {
      this.model.to({ x: (x - 1) * gridSize, y: (y - 1) * gridSize, duration: 0.14 });
      let tPos = this.calculateTooltipPos();
      this.tooltip.to({ x: tPos.x, y: tPos.y, duration: 0.14 });
      this.tooltipShape.to({ x: tPos.x, y: tPos.y, duration: 0.14 });
    } else {
      this.model.x((x - 1) * gridSize);
      this.model.y((y - 1) * gridSize);
      this.refreshTooltip();
    }

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
  pos: Coord;

  constructor(type: ElementType, shape: Konva.Shape, task?: string, pos?: Coord) {
    this.type = type;
    this.shape = shape;
    if (task !== undefined) this.task = task;
    if (pos !== undefined) this.pos = pos;
  }
}

export default class GamePlayground extends HTMLElement {
  baseLayer: Konva.Layer;
  stage: Konva.Stage;
  map: MapI;
  timerFunction: any;
  keyMap: Map<number, boolean>;
  grid: GridObject[][];
  tasks: Task[];
  player: Player;

  popupLayer: Konva.Layer;
  popupLayerText: Konva.Text;
  popupLayerBackground: Konva.Rect;

  // Layer for all other players
  foreignPlayerLayer: Konva.Layer;

  // Keep a reference to all foreign players
  foreignPlayers: Player[];

  sprites: HTMLImageElement[];
  questionMarkSprite: HTMLImageElement;
  questionMarkDone: HTMLImageElement;

  endGameScreen: boolean;
  editMode: boolean;
  mouseIsDown: boolean;
  newWall: Coord[];

  constructor() {
    super();
    this.endGameScreen = false;
    this.keyMap = new Map();
    document.onkeydown = document.onkeyup = (e) => {
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
    };
  }

  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    modInstance = MasterOfDisaster.getInstance();
    if (!modInstance) throw console.error("no mod instance");
    DEBUG_MODE = modInstance.getMode();
    modInstance.registerGameFinishCB(this.endGame.bind(this));
    modInstance.registerDebugToggleCB(this.debugToggle.bind(this));

    this.fixCSS();

    window.addEventListener("resize", (event) => {
      MasterOfDisaster.log("RESIZING");
      this.resetStage();
    });

    await this.loadSprites();

    this.setMap(MapStorage[modInstance.activeGame.map]);

    const listPlayerRes = await modInstance.serverSession.sendRPC(CommandOp.LIST_PLAYERS, {});
    listPlayerRes.players.forEach((p) => {
      if (p.id != modInstance.myPlayerId) {
        this.addForeignPlayer(p);
      } else {
        this.setMyPlayer(p, this.sendMyPlayerMoved);
        this.player.refreshTooltip(modInstance.myPlayer.name);
      }
    });

    this.foreignPlayerMoved = this.foreignPlayerMoved.bind(this);
    this.foreignPlayerJoined = this.foreignPlayerJoined.bind(this);
    this.foreignPlayerLeft = this.foreignPlayerLeft.bind(this);
    this.sendMyPlayerMoved = this.sendMyPlayerMoved.bind(this);

    modInstance.serverSession.subscribe(GameEventOp.PLAYER_MOVED, this.foreignPlayerMoved);
    modInstance.serverSession.subscribe(GameEventOp.PLAYER_JOINED, this.foreignPlayerJoined);
    modInstance.serverSession.subscribe(GameEventOp.PLAYER_LEFT, this.foreignPlayerLeft);

    this.loadAudio();
  }

  /**
   * Load audio file and fix CSS.
   * Audio player will be hidden if it fails to load.
   */
  loadAudio() {
    var audioElement = this.shadowRoot.getElementById("audio-player") as HTMLAudioElement;
    if (audioElement) {
      audioElement.src = "/assets/music.ogg";
      audioElement.addEventListener("loadeddata", () => {
        let duration = audioElement.duration;
        audioElement.volume = 0.05;
        audioElement.loop = true;
        audioElement.play();
        this.fixCSS();
      });
      audioElement.addEventListener("error", () => {
        var bottomDiv = this.shadowRoot.getElementById("bottom") as HTMLElement;
        if (bottomDiv) {
          bottomDiv.style.display = "none";
          var outerContainer = this.shadowRoot.getElementById("outer-container") as HTMLElement;
          if (outerContainer) {
            this.resetStage();
          }
        }
      });
    }
  }

  /**
   * Fix CSS by giving the center div an absolute height based on the heading and bottom.
   */
  fixCSS() {
    var topDiv = this.shadowRoot.getElementById("heading");
    var centerDiv = this.shadowRoot.getElementById("outer-container");
    var botDiv = this.shadowRoot.getElementById("bottom");
    if (topDiv && centerDiv && botDiv) {
      centerDiv.style.height = "75vh";
      var title = this.shadowRoot.getElementById("title");
      if (title) {
        title.style.fontSize = centerDiv.clientHeight < 600 ? "100%" : "400%";
      }
      centerDiv.style.height = (centerDiv.clientHeight - topDiv.clientHeight - botDiv.clientHeight).toString() + "px";
    }
  }

  debugToggle(d: boolean) {
    DEBUG_MODE = d;
    this.resetStage();
  }

  /**
   * Reset the stage to its original state (except for already completed tasks)
   */
  async resetStage() {
    this.fixCSS();
    if (this.grid) this.grid = [];
    this.stage.clear();
    if (this.baseLayer) this.baseLayer.destroy();
    if (this.foreignPlayerLayer) this.foreignPlayerLayer.destroy();
    if (this.player.layer) this.player.layer.destroy();
    this.setupGrid();
    this.baseLayer.moveToBottom();
    this.getCurrentPlayer()
      .layer.getChildren()
      .toArray()
      .forEach((node) => {
        node.moveToTop();
      });

    this.getCurrentPlayer().drawPlayer(true);

    if (this.foreignPlayerLayer) {
      this.foreignPlayerLayer.setZIndex(1);
      this.foreignPlayerLayer
        .getChildren()
        .toArray()
        .forEach((child) => {
          child.remove();
        });
      this.foreignPlayers.forEach((fp) => {
        fp.drawPlayer();
      });
      this.stage.add(this.foreignPlayerLayer);
    }

    this.stage.add(this.getCurrentPlayer().layer);
  }

  /**
   * Interval function for keydown (called while holding down keys).
   */
  keyDownCheck() {
    if (this.keyMap == undefined || this.player == undefined) return;
    if (
      (!this.keyMap.get(87) &&
        !this.keyMap.get(65) &&
        !this.keyMap.get(83) &&
        !this.keyMap.get(68) &&
        !this.keyMap.get(32)) ||
      this.player.taskOpen
    ) {
      clearInterval(this.timerFunction);
      this.timerFunction = false;
      this.player.model.frameRate(2);
      this.player.refreshTooltip();
      return;
    } else {
      this.player.model.frameRate(10);
      if (this.keyMap.get(87) && !this.keyMap.get(83)) this.player.moveUp(1);
      if (this.keyMap.get(65) && !this.keyMap.get(68)) this.player.moveLeft(1);
      if (this.keyMap.get(83) && !this.keyMap.get(87)) this.player.moveDown(1);
      if (this.keyMap.get(68) && !this.keyMap.get(65)) this.player.moveRight(1);
      this.player.redraw();
    }
  }

  /**
   * Keydown function for a key press (not holding down).
   * @param keyCode
   */
  async handleMove(keyCode?: number) {
    if (!this.player.taskOpen) {
      if (keyCode == 87 && !this.keyMap.get(83)) this.player.moveUp(1);
      if (keyCode == 65 && !this.keyMap.get(68)) this.player.moveLeft(1);
      if (keyCode == 83 && !this.keyMap.get(87)) this.player.moveDown(1);
      if (keyCode == 68 && !this.keyMap.get(65)) this.player.moveRight(1);
      if (keyCode == 32) {
        if (!this.endGameScreen) {
          if (this.player.checkCollision(this.player.y, this.player.x, true) == CollisionType.Task) {
            MasterOfDisaster.log(
              "[SPCBR] pressed on player position: " +
                this.player.x +
                "," +
                this.player.y +
                " returns TASK in proximity",
            );
          } else {
            MasterOfDisaster.log(
              "[SPCBR] pressed on player position: " + this.player.x + "," + this.player.y + " ... no task in prox",
            );
          }
        } else {
          window.location.reload();
        }
      }
      if (keyCode == 84) {
        ANIMATIONS_ENABLED = !ANIMATIONS_ENABLED;
        this.showPopup(
          modInstance.getString().in_game.animations +
            " " +
            (ANIMATIONS_ENABLED ? modInstance.getString().in_game.enabled : modInstance.getString().in_game.disabled) +
            "!",
        );
      }
      if (keyCode == 90) {
        DEBUG_MODE = !DEBUG_MODE;
        await this.resetStage();
        this.showPopup(
          modInstance.getString().in_game.debug +
            " " +
            (DEBUG_MODE ? modInstance.getString().in_game.enabled : modInstance.getString().in_game.disabled) +
            "!",
        );
      }
      if (keyCode == 72) {
        this.showPopup(modInstance.getString().in_game.help, 6000, 18);
      }
      if (keyCode == 77 && DEBUG_MODE) {
        this.editMode = !this.editMode;
        if (this.grid) {
          this.grid.forEach((gridRow) => {
            gridRow.forEach((gridElem) => {
              this.baseLayer.listening(this.editMode);
              gridElem.shape.listening(this.editMode);

              var mapExport = this.shadowRoot.getElementById("map-export") as HTMLElement;
              if (this.editMode) {
                mapExport.style.display = "block";
                gridElem.shape.on(
                  "mousedown",
                  function () {
                    this.mouseIsDown = true;
                    this.newWall = [];
                  }.bind(this),
                );
                gridElem.shape.on(
                  "mouseup",
                  function () {
                    this.mouseIsDown = false;

                    if (gridElem.shape.fill() != "magenta" && !this.newWall.find((elem) => elem.pos == gridElem.pos)) {
                      gridElem.shape.fill("magenta");
                      gridElem.shape.draw();
                      gridElem.type = ElementType.Wall;
                      this.newWall.push(gridElem.pos);
                    }

                    if (this.newWall) {
                      var str = "";
                      var prev_x = 0;
                      var prev_y = 0;

                      var start_x = 0;
                      var start_y = 0;

                      var dir = 0; // 1 = hor, 2 = ver
                      var prev_dir = 0;
                      if (this.newWall.length == 1) {
                        str = str + "cord(" + this.newWall[0].x + "," + this.newWall[0].y + ")";
                      } else {
                        for (var i = 0; i < this.newWall.length; i++) {
                          var current = this.newWall[i];
                          if (
                            (current.x == prev_x && current.y == prev_y + 1) ||
                            (current.x == prev_x && current.y == prev_y - 1)
                          ) {
                            dir = 2;
                          } else if (
                            (current.x == prev_x - 1 && current.y == prev_y) ||
                            (current.x == prev_x + 1 && current.y == prev_y)
                          ) {
                            dir = 1;
                          } else {
                            start_x = current.x;
                            start_y = current.y;
                            str = str + "cord(" + current.x + "," + current.y + "),";
                          }
                          if (dir != prev_dir && prev_dir != 0) {
                            start_x = prev_x;
                            start_y = prev_y;
                            str = str + "cord(" + prev_x + "," + prev_y + "),";
                          }
                          prev_x = current.x;
                          prev_y = current.y;
                          prev_dir = dir;
                        }
                        str = str + "cord(" + prev_x + "," + prev_y + "),";
                      }

                      /*this.newWall.forEach((c) => {
                      str = str + "cord(" + c.x + "," + c.y + "),";
                    });*/
                      mapExport.innerHTML = mapExport.innerHTML + "\n[" + str + "],";
                    }
                  }.bind(this),
                );
                gridElem.shape.on(
                  "mousemove",
                  function (xit, yit) {
                    if (gridElem.shape.fill() != "magenta" && this.mouseIsDown) {
                      gridElem.shape.fill("magenta");
                      gridElem.shape.draw();
                      gridElem.type = ElementType.Wall;
                      this.newWall.push(gridElem.pos);
                    }
                  }.bind(this),
                );
              } else {
                mapExport.style.display = "none";
              }
            });
          });
        }
        if (!this.editMode) this.shadowRoot.getElementById("map-export").innerHTML = "";
        this.showPopup("Edit mode " + (this.editMode ? "enabled!" : "disabled!"));
      }
      //player.redraw();
    }
  }

  /**
   * End the game by drawing a ring around the winning player and stopping all other players sprites.
   * @param winnerID The ID of the winning player.
   */
  async endGame(winnerID: number) {
    var winningPlayer: Player;

    if (this.player.playerID == winnerID) {
      winningPlayer = this.player;
    } else if (this.foreignPlayers) {
      this.player.model.stop();
      this.player.model.opacity(0.5);
      this.player.tooltip.opacity(0.5);
      this.player.tooltipShape.opacity(0.5);
      winningPlayer = this.foreignPlayers.find((element) => element.playerID == winnerID);
    }
    if (winningPlayer) {
      var ring: Konva.Ring;
      ring = new Konva.Ring({
        x: winningPlayer.x * gridSize + gridSize / 2,
        y: winningPlayer.y * gridSize + gridSize / 2,
        innerRadius: gridSize * 4,
        outerRadius: this.stage.width() > this.stage.height() ? this.stage.width() * 2 : this.stage.height() * 2,
        fill: "rgba(0,0,0,0.85)",
        stroke: "black",
      });
      this.baseLayer.add(ring);
      this.baseLayer.batchDraw();

      var s = 20;
      ring.scaleX(s);
      ring.scaleY(s);

      await ring.to({ scaleX: 1, scaleY: 1 });

      var winnerText = new Konva.Text({
        x: 0,
        y: 0,
        text: modInstance.getString().in_game.winner,
        fontFamily: "Roboto",
        fontSize: gridSize * 3,
        fill: "white",
        fontStyle: "bold",
        opacity: 0,
      });
      winnerText.x(
        winningPlayer.x < gridLength / 2
          ? ring.x() + ring.innerRadius() - 30
          : ring.x() - ring.innerRadius() + 30 - winnerText.width(),
      );
      winnerText.y((winningPlayer.y - 1) * gridSize);

      this.baseLayer.add(winnerText);
      winnerText.to({
        opacity: 1,
        x:
          winningPlayer.x < gridLength / 2
            ? ring.x() + ring.innerRadius() + 30
            : ring.x() - ring.innerRadius() - 30 - winnerText.width(),
      });
      winningPlayer.model.frameRate(8);
      this.endGameScreen = true;
      this.showPopup(modInstance.getString().in_game.playAgain, -1, 20);
    }

    if (this.foreignPlayers) {
      this.foreignPlayers.forEach((pl) => {
        if (pl.playerID != winnerID) {
          pl.model.stop();
          pl.model.opacity(0.5);
          pl.tooltip.opacity(0.5);
          pl.tooltipShape.opacity(0.5);
        }
      });
    }
  }

  /**
   * Sends the MOVE command to the server for the current player.
   * @param x
   * @param y
   */
  sendMyPlayerMoved(x: number, y: number) {
    modInstance.serverSession.sendRPC(CommandOp.MOVE, { position: { x, y } });
  }

  /**
   * MOVE event for foreign players.
   * @param event
   */
  foreignPlayerMoved(event: Event<GameEventOp.PLAYER_MOVED>) {
    const { id, position } = event.payload;
    this.foreignPlayers.forEach((fp) => {
      if (fp.playerID == id) {
        fp.moveTo(position.x, position.y);
      }
    });
  }

  /**
   * PLAYER_JOINED event for foreign players.
   * @param event
   */
  foreignPlayerJoined(event: Event<GameEventOp.PLAYER_JOINED>) {
    const foreignPlayer = event.payload;
    this.addForeignPlayer(foreignPlayer);

    this.showPopup(foreignPlayer.name + " " + modInstance.getString().in_game.joined);
  }

  /**
   * PLAYER_LEFT event for foreign players.
   * @param event
   */
  foreignPlayerLeft(event: Event<GameEventOp.PLAYER_LEFT>) {
    const { id } = event.payload;
    this.removeForeignPlayer(id);
  }

  disconnectedCallback() {
    this.stage.clear();
    this.stage.destroy();
  }

  /**
   * Add a foreign player to the in-game and keep a reference to the object.
   *
   * @param fpl Player information
   */
  addForeignPlayer(fpl: PlayerInGameI): Player {
    if (!this.foreignPlayerLayer || !this.foreignPlayers) {
      this.foreignPlayerLayer = new Konva.Layer({ listening: false });
      this.foreignPlayers = new Array();
    }
    const newPlayer = new Player(
      fpl.position.x,
      fpl.position.y,
      fpl.color,
      this.foreignPlayerLayer,
      this.stage,
      this,
      fpl.id,
      fpl.bibNumber,
    );
    newPlayer.refreshTooltip(fpl.name);
    this.foreignPlayers.push(newPlayer);
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
    for (let i = 0; i < this.foreignPlayers.length; i++) {
      if (this.foreignPlayers[i].playerID == fpl) {
        this.showPopup(this.foreignPlayers[i].playerName + " " + modInstance.getString().in_game.left);
        this.foreignPlayers.splice(i, 1);
        this.foreignPlayerLayer
          .find("." + fpl)
          .toArray()
          .forEach((node) => {
            node.destroy();
          });
        foundElem = true;
      }
    }
    this.foreignPlayerLayer.batchDraw();

    return foundElem;
  }

  /**
   * Set the current "main" player (myPlayer).
   *
   * @param mpl Player information
   * @param cb Callback that is to be executed when the player executes a move command
   */
  setMyPlayer(mpl: PlayerInGameI, cb: IPlayerMovedCB): Player {
    var playerLayer = new Konva.Layer({ listening: false });
    this.player = new Player(
      mpl.position.x,
      mpl.position.y,
      mpl.color,
      playerLayer,
      this.stage,
      this,
      mpl.id,
      mpl.bibNumber,
    );
    playerLayer
      .getChildren()
      .toArray()
      .forEach((node) => {
        node.moveToTop();
      });
    this.player.attachCallback(cb);
    return this.player;
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
   * Load all necessary sprites.
   */
  async loadSprites() {
    this.sprites = [];
    const imageObj = new Image();
    imageObj.src = "/assets/img/sprite1.png";
    await imageObj.decode();
    this.sprites.push(imageObj);

    const imageObj2 = new Image();
    imageObj2.src = "/assets/img/sprite2.png";
    await imageObj2.decode();
    this.sprites.push(imageObj2);

    const imageObj3 = new Image();
    imageObj3.src = "/assets/img/sprite3.png";
    await imageObj3.decode();
    this.sprites.push(imageObj3);

    const imageObj4 = new Image();
    imageObj4.src = "/assets/img/sprite4.png";
    await imageObj4.decode();
    this.sprites.push(imageObj4);

    const imageObj5 = new Image();
    imageObj5.src = "/assets/img/sprite5.png";
    await imageObj5.decode();
    this.sprites.push(imageObj5);

    const imageObj6 = new Image();
    imageObj6.src = "/assets/img/sprite6.png";
    await imageObj6.decode();
    this.sprites.push(imageObj6);

    this.questionMarkSprite = new Image();
    this.questionMarkSprite.src = "/assets/img/questionMarkSprite.png";
    await this.questionMarkSprite.decode();

    this.questionMarkDone = new Image();
    this.questionMarkDone.src = "/assets/img/questionMarkDone.png";
  }

  /**
   * Initializes the grid by creating a new layer (baseLayer) and looping
   * through the user defined map to draw and populate the grid structure.
   * Finally, creates the player layer and the player element.
   */
  setupGrid() {
    /* Initial setup (stage) */

    var containerDiv: HTMLDivElement = this.shadowRoot.getElementById("container") as HTMLDivElement;
    this.grid = [];
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

    this.baseLayer = new Konva.Layer({ listening: false });

    /* Attach keybaord events */
    //document.onkeydown = this.keyDown;

    /* Loop through map and draw the grid */
    var x: number = 0;
    var y: number = 0;

    var gridRow: GridObject[];

    /**
     * Parse the map.
     */
    MasterOfDisaster.log("Empty map mode - width: " + this.map.width + ", height: " + this.map.height);
    for (let h = 0; h < this.map.height; h++) {
      gridRow = new Array();
      for (let w = 0; w < this.map.width; w++) {
        if (w != 0 && h != 0 && w != this.map.width - 1 && h != this.map.height - 1) {
          gridRow.push(
            new GridObject(
              ElementType.OpenSpace,
              this.drawRect(this.baseLayer, this.stage, w * gridSize, y * gridSize, ElementType.OpenSpace),
              undefined,
              cord(w, h),
            ),
          );
        } else {
          /* Automatically place walls around the specified size */
          gridRow.push(
            new GridObject(
              ElementType.Wall,
              this.drawRect(this.baseLayer, this.stage, w * gridSize, y * gridSize, ElementType.Wall),
              undefined,
              cord(w, h),
            ),
          );
        }
        /* Debug grid indicators */
        if (w == 0 && DEBUG_MODE)
          this.drawText(this.baseLayer, this.stage, w * gridSize + 1, y * gridSize + 1, h.toString());
        if (h == 0 && DEBUG_MODE)
          this.drawText(this.baseLayer, this.stage, w * gridSize + 1, y * gridSize + 1, w.toString());
      }

      this.grid.push(gridRow);
      y += 1;
      //this.stage.height(this.stage.height() + gridSize);
    }

    this.stage.add(this.baseLayer);

    /* Draw all the specified walls */
    this.map.walls.forEach((wall) => {
      this.addWall(wall);
    });

    /* DEMO - Adding tasks in all possible locations */

    for (var key in this.map.taskPositions) {
      MasterOfDisaster.log(
        "Adding task [" +
          key +
          "] on coordinates (X,Y) [" +
          this.map.taskPositions[key].x +
          ", " +
          this.map.taskPositions[key].y +
          "]",
      );
      var newPos = this.grid[this.map.taskPositions[key].y][this.map.taskPositions[key].x];
      if (newPos !== undefined) {
        //newPos.shape.fill("purple");
        var npx = newPos.shape.x();
        var npy = newPos.shape.y();
        newPos.shape.destroy();
        var alreadyComplete: boolean = false;
        if (this.tasks !== undefined) {
          var t = this.tasks.find((element) => element.id == key);
          if (t) {
            MasterOfDisaster.log(t);
            if (t.isCompleted) {
              newPos.shape = new Konva.Image({
                x: npx,
                y: npy,
                image: this.questionMarkDone,
                width: 16,
                height: 16,
                scaleX: gridSize / 16.0,
                scaleY: gridSize / 16.0,
              });
              this.baseLayer.add(newPos.shape);
              this.baseLayer.batchDraw();
              alreadyComplete = true;
            }
          }
        }
        if (!alreadyComplete) {
          var spr: Konva.Sprite;
          spr = new Konva.Sprite({
            x: npx,
            y: npy,
            image: this.questionMarkSprite,
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
          this.baseLayer.add(spr);
          spr.start();
          newPos.shape = spr;
        }

        newPos.type = ElementType.Task;
        newPos.task = key;
        if (this.tasks === undefined) this.tasks = new Array();
        this.tasks.push(new Task(key, cord(this.map.taskPositions[key].x, this.map.taskPositions[key].y), false));
      }
      this.baseLayer.batchDraw();
    }
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
      opacity: 1,
      perfectDrawEnabled: false,
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
      listening: false,
    });
    layer.add(elem);
  }

  /* Show a popup on the screen for 3 seconds. */
  showPopup(text: string, time?: number, fontSize?: number) {
    if (this.popupLayer !== undefined) {
      this.popupLayer
        .getChildren()
        .toArray()
        .forEach((child) => {
          child.remove();
        });
    } else {
      this.popupLayer = new Konva.Layer({ listening: false, opacity: 0 });
    }
    var textObject = new Konva.Text({
      x: 0,
      y: 0,
      text: text,
      fontFamily: "Roboto",
      fontStyle: "bold",
      fontSize: fontSize ? fontSize : 13,
      padding: 5,
      fill: "white",
      visible: true,
      name: "popup",
      listening: false,
      opacity: 1,
    });
    textObject.x(this.stage.width() / 2 - textObject.width() / 2);
    textObject.y(this.stage.height() / 2 - textObject.height() / 2);

    /* Add a shape to draw the tooltip on */
    var backgroundObject = new Konva.Rect({
      x: textObject.x() - 10,
      y: textObject.y() - 10,
      width: textObject.width() + 20,
      height: textObject.height() + 20,
      fill: "black",
      cornerRadius: 5,
      opacity: 0.6,
      strokeWidth: 2,
      name: "popup",
      listening: false,
    });

    this.popupLayer.add(backgroundObject);
    this.popupLayer.add(textObject);
    this.popupLayerText = textObject;
    this.popupLayerBackground = backgroundObject;
    this.stage.add(this.popupLayer);

    this.stage.batchDraw();

    this.popupLayer.to({ opacity: 1 });

    if (time) {
      if (time != -1) setTimeout(this.clearPopup.bind(this), time ? time : 2000);
    } else setTimeout(this.clearPopup.bind(this), time ? time : 2000);
  }

  async clearPopup() {
    this.popupLayer.to({ opacity: 0 });

    //this.popupLayer.destroy();
    //this.stage.batchDraw();
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
    if (coord.length == 1) {
      this.grid[coord[0].y][coord[0].x].shape.destroy();
      (this.grid[coord[0].y][coord[0].x].shape = this.drawRect(
        this.baseLayer,
        this.stage,
        coord[0].x * gridSize,
        coord[0].y * gridSize,
        elemType,
      )),
        (this.grid[coord[0].y][coord[0].x].type = elemType);
    } else {
      coord.forEach((c) => {
        if (this.grid[c.y] !== undefined) {
          if (this.grid[c.y][c.x] !== undefined) {
            if (previousCoord !== undefined) {
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
              for (let i = start_y; i <= end_y; i++) {
                for (let j = start_x; j <= end_x; j++) {
                  this.grid[i][j].shape.destroy();
                  (this.grid[i][j].shape = this.drawRect(
                    this.baseLayer,
                    this.stage,
                    j * gridSize,
                    i * gridSize,
                    elemType,
                  )),
                    (this.grid[i][j].type = elemType);
                }
              }
            }
            previousCoord = c;
          }
        }
      });
    }
    this.baseLayer.batchDraw();
  }

  getCurrentPlayer() {
    return this.player;
  }
}

customElements.define("game-playground", GamePlayground);
