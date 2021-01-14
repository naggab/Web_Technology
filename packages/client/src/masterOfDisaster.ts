import { GameDetails, GameIdType, PlayerInGameI } from "@apirush/common";
import { ServerSession } from "./serverSession";
import { CommandOp, Event, GameEventOp } from "@apirush/common/src";
import { router } from "./router";
import { TaskIdentifier, TaskManger } from "./taskManager";
import { StatsStorage } from "./statsStorage";
import { TaskOpener } from "./components/taskOpener";
import { english, german } from "./language";
import { PopUp } from "./components/PopUp";
import { CapabilitiesManager } from "./capabilitiesManager";
import { MapStorage } from "@apirush/common/src/maps";
import { IGameDidFinishCB } from "./screens/in-game/game-playground/index";

export type ClientState =
  | "loading"
  | "error"
  | "welcome-start"
  | "welcome-stats"
  | "welcome-join-game"
  | "welcome-create-game"
  | "pre-game"
  | "in-game"
  | "post-game"
  | "all-tasks";
export type Languages = "English" | "German";

export class MasterOfDisaster {
  capabilities: CapabilitiesManager = new CapabilitiesManager();
  private watchingForGameStart: boolean = false;
  private watchingForGameEnd: boolean = false;
  private static instance_: MasterOfDisaster;
  private state_: ClientState = "welcome-start";
  activeGame: GameDetails | null = null;
  myPlayerId: number | null = null;
  myPlayer: PlayerInGameI | null = null;
  gameWinner: PlayerInGameI | null = null;
  readonly serverSession: ServerSession;
  readonly statsStorage: StatsStorage = new StatsStorage();
  private language: Languages = "English";
  private debugMode: boolean = localStorage.getItem("debugMode") == "true";
  private gameDidFinishCB: IGameDidFinishCB;

  constructor(sess: ServerSession) {
    this.serverSession = sess;
    this.onGameDidStart = this.onGameDidStart.bind(this);
    this.onGameAborted = this.onGameAborted.bind(this);
    this.onGameDidFinish = this.onGameDidFinish.bind(this);

    this.language = localStorage.getItem("language") as Languages;
  }
  //--------------------------------------------------------------------------------------------------------------------

  //Debug mode
  //START
  public getMode() {
    return this.debugMode;
  }

  public setMode(mode: boolean) {
    this.debugMode = mode;
    localStorage.setItem("debugMode", String(this.debugMode));
    router(this.state);
  }
  //END
  //--------------------------------------------------------------------------------------------------------------------
  //Language settings
  //START

  public getString() {
    switch (this.language) {
      case "English":
        return english;

      case "German":
        return german;
      default:
        return english;
    }
  }

  public getLanguage() {
    return this.language;
  }

  public setLanguage(language: Languages) {
    if (language != (localStorage.getItem("language") as Languages)) {
      this.language = language;
      localStorage.setItem("language", this.language);
      router(this.state);
    }
  }
  //END
  //--------------------------------------------------------------------------------------------------------------------

  static getInstance() {
    return this.instance_;
  }

  getGameSeed() {
    if (!this.activeGame) {
      return 0;
    }
    return this.activeGame.seed;
  }

  static async setup() {
    const conn = new ServerSession();
    return conn
      .connect()
      .then(() => {
        MasterOfDisaster.instance_ = new MasterOfDisaster(conn);
        return true;
      })
      .catch((e) => {
        console.error("unable to connect to server");
        throw new Error("unable to connect");
      });
  }

  get state() {
    return this.state_;
  }

  private setState(newState: ClientState) {
    this.state_ = newState;
    router(this.state_);

    if (newState === "pre-game" && !this.watchingForGameStart) {
      this.watchForGameStart();
    }
    if (newState === "in-game" && !this.watchingForGameEnd) {
      this.watchForGameEnd();
    }
  }

  public getState() {
    return this.state;
  }

  get helloSent() {
    return this.myPlayerId != null;
  }

  private watchForGameStart() {
    this.serverSession.subscribe(GameEventOp.GAME_STARTED, this.onGameDidStart);
  }

  private onGameDidStart() {
    this.prepareGameStart();
    this.setState("in-game");
    this.serverSession.unsubscribe(GameEventOp.GAME_STARTED, this.onGameDidStart);
  }

  private watchForGameEnd() {
    this.watchingForGameEnd = true;
    this.serverSession.subscribe(GameEventOp.GAME_FINISHED, this.onGameDidFinish);
    this.serverSession.subscribe(GameEventOp.GAME_ABORTED, this.onGameAborted);
  }

  private stopWatchingForGameEnd() {
    this.watchingForGameEnd = false;
    this.serverSession.unsubscribe(GameEventOp.GAME_FINISHED, this.onGameDidFinish);
    this.serverSession.unsubscribe(GameEventOp.GAME_ABORTED, this.onGameAborted);
  }

  private onGameAborted() {
    this.setState("post-game");
    console.log("Game was aborted");
    this.stopWatchingForGameEnd();
  }

  private onGameDidFinish(ev: Event<GameEventOp.GAME_FINISHED>) {
    console.log("Game did finish, winner is:", ev.payload.winner);
    this.gameWinner = ev.payload.winner;
    //this.setState("post-game");

    if (this.gameDidFinishCB) {
      this.gameDidFinishCB(ev.payload.winner.id);
    }

    this.stopWatchingForGameEnd();
  }

  registerGameFinishCB(cb: IGameDidFinishCB) {
    this.gameDidFinishCB = cb;
  }

  private ensureHelloSent(v: boolean = true) {
    if (this.helloSent !== v) {
      throw new Error("ensureHelloSent state not as expected");
    }
  }

  get playerIsInGame() {
    return this.activeGame != null;
  }

  private ensureInGame(v: boolean = true) {
    if (this.playerIsInGame !== v) {
      throw new Error("ensureInGame state not as expected");
    }
  }

  private async sendHello(playerName: string) {
    this.ensureHelloSent(false);
    const { id } = await this.serverSession.sendRPC(CommandOp.HELLO, { name: playerName });
    this.myPlayerId = id;
  }

  async showStats() {
    this.setState("welcome-stats");
  }

  async userWantsToJoin(playerName: string) {
    this.setState("loading");
    try {
      await this.sendHello(playerName);
      this.setState("welcome-join-game");
      return;
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  async userWantsToCreate(playerName: string) {
    this.setState("loading");
    try {
      await this.sendHello(playerName);
      this.setState("welcome-create-game");
      return;
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  async joinGame(gameId: GameIdType) {
    this.ensureHelloSent();
    this.setState("loading");
    try {
      const { player, game } = await this.serverSession.sendRPC(CommandOp.JOIN_GAME, { id: gameId });
      this.myPlayer = player;
      this.activeGame = game;
      if (this.activeGame.state === "in-game") {
        this.prepareGameStart();
      }
      this.setState(this.activeGame.state);
      return;
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  async createGame(gameName: string) {
    this.ensureHelloSent();
    this.setState("loading");
    try {
      const { player, game } = await this.serverSession.sendRPC(CommandOp.CREATE_GAME, { name: gameName });
      this.myPlayer = player;
      this.activeGame = game;
      this.setState("pre-game");
      return;
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  async startGame() {
    this.ensureHelloSent();
    this.ensureInGame();
    this.setState("loading");
    try {
      await this.serverSession.sendRPC(CommandOp.START_GAME, {});
      return;
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  registerTaskOpener(to: TaskOpener) {
    this.onTaskNeedsToBeOpened = to.openTask;

    const hash = window.location.hash.replace("#", "");
    if (hash && TaskManger.getTaskIdentifiers().indexOf(hash as any) !== -1) {
      console.log("hash", hash);
      this.setState("all-tasks");
    }
  }

  onTaskNeedsToBeOpened?: (taskId: TaskIdentifier) => Promise<{ duration: number; success: boolean }>;

  taskState: Map<string, boolean> = new Map<string, boolean>();

  get allTasksCompleted() {
    return Array.from(this.taskState.values()).every((finished) => finished === true);
  }

  async openTaskByIdentifier(id: TaskIdentifier) {
    if (!this.onTaskNeedsToBeOpened) {
      throw new Error("TaskOpener did not register itself");
    }
    return this.onTaskNeedsToBeOpened(id);
  }

  prepareGameStart() {
    const taskIds = Object.keys(MapStorage[this.activeGame.map].taskPositions);
    taskIds.forEach((taskId) => this.taskState.set(taskId, false));
  }

  getTaskIdentifierForId(taskId: string): TaskIdentifier {
    const taskIdNumber = parseInt(taskId);
    const taskIds = Object.keys(MapStorage[this.activeGame.map].taskPositions);
    const seed = this.getGameSeed();
    let taskIdentifiers = TaskManger.getTaskIdentifiers();
    const numRotations = seed % taskIdentifiers.length;
    console.log("using numRotations", numRotations);
    for (var i = 0; i < numRotations; i++) {
      const firstObject = taskIdentifiers[0];
      taskIdentifiers = [...taskIdentifiers.slice(1), firstObject];
    }

    const index = taskIdNumber % taskIdentifiers.length;
    console.log("random task idents", taskIdentifiers);

    return taskIdentifiers[index];
  }

  async openTask(id: string): Promise<boolean> {
    this.ensureHelloSent();
    this.ensureInGame();

    const taskId = this.getTaskIdentifierForId(id);

    const result = await this.openTaskByIdentifier(taskId);
    if (!result.success) {
      return false;
    }

    this.statsStorage.taskCompleted(taskId, result.duration);
    this.taskState.set(id, true);

    if (this.allTasksCompleted) {
      try {
        await this.serverSession.sendRPC(CommandOp.DECLARE_WIN, {});
      } catch (e) {
        console.error(e);
        this.setState("error");
        return;
      }
    }
    return true;
  }
}
