import viewHtml from "./view.html";
import { default as GamePlayground, Player } from "../../screens/in-game/game-playground";
import { ServerSession } from "../../serverSession";
import { Task, TaskOpts } from "../../task";
import { Event, EventOp } from "@apirush/common";
import { CommandOp, GameEventOp, PlayerInGameI, Coordinate } from "@apirush/common/src";

export default class POCTask extends Task {
  gamePlayground: GamePlayground;
  gameSession: ServerSession;

  currentPlayerId: number;

  otherPlayers: Map<number, Player>;

  constructor(opts: TaskOpts) {
    super(opts);
    this.otherPlayers = new Map();
    this.gamePlayground = new GamePlayground({ finishCb: () => {} });
    this.gameSession = new ServerSession();
    this.onPlayerMoveReceived = this.onPlayerMoveReceived.bind(this);
    this.sendPlayerMove = this.sendPlayerMove.bind(this);
    this.onPlayerJoined = this.onPlayerJoined.bind(this);
    this.onPlayerLeave = this.onPlayerLeave.bind(this);
  }

  onMounted() {
    console.log(POCTask.name, "connected to DOM");
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    this.shadowRoot.appendChild(this.gamePlayground);
    let pig: PlayerInGameI = {
      id: 0,
      name: "test",
      color: "orange",
      position: { x: 20, y: 20 },
      bibNumber: 0,
    };
    this.gamePlayground.setMyPlayer(pig, this.sendPlayerMove);
    //this.gamePlayground.getCurrentPlayer().attachCallback(this.sendPlayerMove);

    this.gameSession.subscribe(GameEventOp.PLAYER_MOVED, this.onPlayerMoveReceived);
    this.gameSession.subscribe(GameEventOp.PLAYER_JOINED, this.onPlayerJoined);
    this.gameSession.subscribe(GameEventOp.PLAYER_LEFT, this.onPlayerLeave);
    (<any>window).srvSession = this.gameSession;
    this.gameSession
      .connect()
      .then(() => {
        console.log("connected!");
      })
      .catch((err) => {
        alert("unable to create a GameSession");
        console.error(err);
      });
  }

  addForeignPlayer(id: number, x: number = 5, y: number = 5, color: string = "#EFEFEF") {
    let pig: PlayerInGameI = {
      id: id,
      name: "test",
      color: color,
      position: { x, y },
      bibNumber: 0,
    };
    const newPlayer = this.gamePlayground.addForeignPlayer(pig);
    this.otherPlayers.set(id, newPlayer);
  }

  onPlayerLeave(event: Event<GameEventOp.PLAYER_LEFT>) {
    console.log("received other player leave", event.payload);
    const { id } = event.payload;
    if (!this.otherPlayers.has(id)) {
      return;
    }
    const player = this.otherPlayers.get(id);
    const layer = player.layer;
    player.model.remove();
    player.model.destroy();
    layer.batchDraw();
    this.otherPlayers.delete(id);
  }

  onPlayerJoined(event: Event<GameEventOp.PLAYER_JOINED>) {
    console.log("received other player join", event.payload);
    const { id, color, position = { x: 5, y: 5 } } = event.payload;
    this.addForeignPlayer(id, position.x, position.y, color);
  }

  onPlayerMoveReceived(event: Event<GameEventOp.PLAYER_MOVED>) {
    console.log("received other player move", event.payload);
    const { id, position } = event.payload;
    if (!this.otherPlayers.has(id)) {
      return;
    }
    const player = this.otherPlayers.get(id);
    player.moveTo(position.x, position.y);
  }

  sendPlayerMove(x: number, y: number) {
    this.gameSession.sendRPC(CommandOp.MOVE, { position: { x, y } });
  }

  onUnmounting() {
    console.log(POCTask.name, "disconnected from DOM");
    this.gameSession.disconnect();
  }
}

customElements.define("poc-task", POCTask);
