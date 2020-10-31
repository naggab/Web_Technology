type PlayerInfo = {
  id: number;
  name: string;
  color: string;
};

export enum GameEventOp {
  GAME_START = "GAME_START",
  GAME_END = "GAME_END",
  SERVER_SHUTDOWN = "SERVER_SHUTDOWN",

  PLAYER_JOIN = "PLAYER_JOIN",
  PLAYER_LEAVE = "PLAYER_LEAVE",
  PLAYER_MOVE = "PLAYER_MOVE",
  PLAYER_TASK_START = "PLAYER_TASK_START",
  PLAYER_TASK_FINISH = "PLAYER_TASK_FINISH",
  PLAYER_TASK_FAIL = "PLAYER_TASK_FAIL",

  CURRENT_STATE = "CURRENT_STATE",
}

type GameEventOpPayloadMap = {
  [GameEventOp.GAME_START]: {};
  [GameEventOp.GAME_END]: {};
  [GameEventOp.SERVER_SHUTDOWN]: {};
  [GameEventOp.PLAYER_JOIN]: PlayerInfo;
  [GameEventOp.PLAYER_LEAVE]: PlayerInfo;
  [GameEventOp.PLAYER_MOVE]: { location: string };
  [GameEventOp.PLAYER_TASK_START]: {};
  [GameEventOp.PLAYER_TASK_FINISH]: {};
  [GameEventOp.PLAYER_TASK_FAIL]: {};
  [GameEventOp.CURRENT_STATE]: {
    players: Array<PlayerInfo>;
  };
};

export type GameEvent<T extends GameEventOp = GameEventOp> = {
  op: T;
  payload: GameEventOpPayloadMap[T];
};

type SubscriberCallback<T extends GameEventOp> = (evt: GameEvent<T>) => void;

type SubscriberEntry<T extends GameEventOp> = SubscriberCallback<T>;

const BroadcastSymbol = Symbol("broadcast_all");

type SubscriberList = { [topic in GameEventOp | typeof BroadcastSymbol]?: SubscriberEntry<GameEventOp>[] };

export class GameSession {
  ws: WebSocket | null = null;
  playerName: string;

  private subscribers: SubscriberList = {};

  constructor(playerName: string) {
    this.playerName = playerName;
    this.OnMessageReceived = this.OnMessageReceived.bind(this);
    this.OnErrorOccurred = this.OnErrorOccurred.bind(this);
    this.OnClosed = this.OnClosed.bind(this);
  }

  private OnMessageReceived(ev: MessageEvent) {
    let gameEvent: GameEvent | undefined = undefined;
    try {
      gameEvent = JSON.parse(ev.data);
    } catch (e) {
      console.error("received game event which is not a valid json, someone messed up ._.");
      return;
    }
    if (!gameEvent.op) {
      console.error("received game event has no op-code, someone messed up ._.");
      return;
    }
    const subs = this.lookupSubscribers(gameEvent.op);

    subs.forEach((callback) => {
      callback(gameEvent);
    });
  }

  private OnErrorOccurred(ev: Event) {
    console.error("WebSocket failed", ev);
  }

  private OnClosed(ev: CloseEvent) {
    console.log("WebSocket closed", ev);
  }

  connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = new URL(`/ws?gameId=1&name=${this.playerName}`, window.location.href);
      url.protocol = url.protocol.replace("http", "ws");
      this.ws = new WebSocket(url.href);
      this.ws.onmessage = this.OnMessageReceived;
      this.ws.onerror = () => {
        reject();
      };
      this.ws.onopen = (event) => {
        this.ws.onerror = this.OnErrorOccurred;
        this.ws.onclose = this.OnClosed;
        resolve();
      };
    });
  }

  disconnect() {
    if (!this.ws) return;
    this.ws.close();
  }

  send(ev: GameEvent) {
    if (!this.ws) return;
    this.ws.send(JSON.stringify(ev));
  }

  private lookupSubscribers(op: GameEventOp): SubscriberEntry<GameEventOp>[] {
    const result = [];
    if (this.subscribers[op]) {
      result.push(...this.subscribers[op]);
    }
    if (this.subscribers[BroadcastSymbol]) {
      result.push(...this.subscribers[BroadcastSymbol]);
    }
    return result;
  }

  private addSubscriber(key: keyof SubscriberList, cb: SubscriberEntry<GameEventOp>) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(cb);
  }

  private removeSubscriber(key: keyof SubscriberList, cb: SubscriberEntry<GameEventOp>) {
    if (!this.subscribers[key]) {
      return;
    }
    this.subscribers[key] = this.subscribers[key].filter((currentCb) => currentCb !== cb);
    if (this.subscribers[key].length === 0) {
      delete this.subscribers[key];
    }
  }

  subscribeToAll(cb: SubscriberCallback<GameEventOp>): void {
    this.addSubscriber(BroadcastSymbol, cb);
  }

  unsubscribeFromAll(cb: SubscriberCallback<GameEventOp>): void {
    this.removeSubscriber(BroadcastSymbol, cb);
  }

  subscribe<T extends GameEventOp>(op: T, cb: SubscriberCallback<T>): void {
    this.addSubscriber(op, cb);
  }

  public unsubscribe<T extends GameEventOp>(op: T, cb: SubscriberCallback<T>) {
    this.removeSubscriber(op, cb);
  }
}
