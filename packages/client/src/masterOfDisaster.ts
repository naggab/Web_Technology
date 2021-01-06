import { GameDetails, PlayerInGameI, GameIdType } from "@apirush/common";
import { Player } from "./screens/game/game-playground";
import { ServerSession } from "./serverSession";
import { CommandOp } from "@apirush/common/src";
import { router } from "./router";

export type ClientState =
  | "loading"
  | "error"
  | "welcome-start"
  | "welcome-stats"
  | "welcome-join-game"
  | "welcome-create-game"
  | "pre-game"
  | "in-game"
  | "post-game";

export class MasterOfDisaster {
  private static instance_: MasterOfDisaster;
  private state_: ClientState = "welcome-start";
  activeGame: GameDetails | null = null;
  myPlayerId: number | null = null;
  myPlayer: PlayerInGameI | null = null;
  readonly serverSession: ServerSession;

  constructor(sess: ServerSession) {
    this.serverSession = sess;
  }

  static getInstance() {
    return this.instance_;
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
  }

  get helloSent() {
    return this.myPlayerId != null;
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
    if (!this.playerIsInGame !== v) {
      throw new Error("ensureInGame state not as expected");
    }
  }

  private async sendHello(playerName: string) {
    this.ensureHelloSent(false);
    const { id } = await this.serverSession.sendRPC(CommandOp.HELLO, { name: playerName });
    this.myPlayerId = id;
  }

  async userWantsToJoin(playerName: string) {
    this.setState("loading");
    try {
      await this.sendHello(playerName);
      this.setState("welcome-join-game");
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

      this.setState("pre-game");
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
      this.setState("in-game");
    } catch (e) {
      console.error(e);
    }
    this.setState("error");
  }

  async openTask(id: string): Promise<boolean> {
    this.ensureHelloSent();
    this.ensureInGame();
    throw new Error("not implemented");
    // taskManger -> get task
    // display task
    // count time elapsed
    // store time in StatsStorage
    // check if all tasks finished
  }
}
