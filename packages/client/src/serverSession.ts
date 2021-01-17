import { Event, EventOp } from "@apirush/common";
import _uniqueId from "lodash/uniqueId";
import { CommandOp, CommandOpParamsMap, CommandOpResultMap } from "@apirush/common";

export type SubscriberCallback<T extends EventOp> = (evt: Event<T>) => void;
type SubscriberEntry<T extends EventOp> = SubscriberCallback<T>;

type RpcResponseCallback<T extends CommandOp> = (resp: CommandOpResultMap[T]) => void;
type RpcErrorCallback = (err: string) => void;
type RpcResponseEntry<T extends CommandOp> = {
  resolve: RpcResponseCallback<T>;
  reject: RpcErrorCallback;
};

const BroadcastSymbol = Symbol("broadcast_all");

type SubscriberList = {
  [topic in EventOp | typeof BroadcastSymbol]?: SubscriberEntry<EventOp>[];
};

type RpcResponseList = {
  [id: string]: RpcResponseEntry<any>;
};

export class ServerSession {
  ws: WebSocket | null = null;

  private subscribers: SubscriberList = {};
  private rpcQueue: RpcResponseList = {};

  constructor() {
    this.OnMessageReceived = this.OnMessageReceived.bind(this);
    this.OnErrorOccurred = this.OnErrorOccurred.bind(this);
    this.OnClosed = this.OnClosed.bind(this);
  }

  private OnMessageReceived(ev: MessageEvent) {
    let msg: Record<string, any> | undefined = undefined;
    try {
      msg = JSON.parse(ev.data);
    } catch (e) {
      console.error("received in-game event which is not a valid json, someone messed up ._.");
      return;
    }
    if (msg.id) {
      // this is a response to a rpc command
      const { resolve, reject } = this.rpcQueue[msg.id];
      if (!resolve || !reject) {
        console.error("received rpc command response from unknown request", msg);
        return;
      }
      if (msg.result) {
        resolve(msg.result);
        return;
      } else if (msg.error) {
        reject(msg.error);
        return;
      }
      console.log("received rpc command response is neither success nor error?", msg);
    } else if (msg.payload && msg.op) {
      // this is a broadcast msg from the server
      const gameEvent: Event = msg as Event;
      const subs = this.lookupSubscribers(gameEvent.op);

      subs.forEach((callback) => {
        callback(gameEvent);
      });
    } else {
      console.error("received msg is neither rpc command response nor broadast msg, someone messed up ._.");
      return;
    }
  }

  private OnErrorOccurred(ev) {
    console.error("WebSocket failed", ev);
  }

  private OnClosed(ev: CloseEvent) {
    console.log("WebSocket closed", ev);
    location.reload();
  }

  connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = new URL(`/ws`, window.location.href);
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

  sendRPC<T extends CommandOp>(op: T, params: CommandOpParamsMap[T]): Promise<CommandOpResultMap[T]> {
    return new Promise<CommandOpResultMap[T]>((resolve, reject) => {
      const id = _uniqueId();
      const data = JSON.stringify({
        id,
        op,
        params,
      });
      this.rpcQueue[id] = { resolve, reject };
      this.ws.send(data);
    });
  }

  send(ev: Event) {
    if (!this.ws) return;
    this.ws.send(JSON.stringify(ev));
  }

  private lookupSubscribers(op: EventOp): SubscriberEntry<EventOp>[] {
    const result = [];
    if (this.subscribers[op]) {
      result.push(...this.subscribers[op]);
    }
    if (this.subscribers[BroadcastSymbol]) {
      result.push(...this.subscribers[BroadcastSymbol]);
    }
    return result;
  }

  private addSubscriber(key: keyof SubscriberList, cb: SubscriberEntry<EventOp>) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(cb);
  }

  private removeSubscriber(key: keyof SubscriberList, cb: SubscriberEntry<EventOp>) {
    if (!this.subscribers[key]) {
      return;
    }
    this.subscribers[key] = this.subscribers[key].filter((currentCb) => currentCb !== cb);
    if (this.subscribers[key].length === 0) {
      delete this.subscribers[key];
    }
  }

  subscribeToAll(cb: SubscriberCallback<EventOp>): void {
    this.addSubscriber(BroadcastSymbol, cb);
  }

  unsubscribeFromAll(cb: SubscriberCallback<EventOp>): void {
    this.removeSubscriber(BroadcastSymbol, cb);
  }

  subscribe<T extends EventOp>(op: T, cb: SubscriberCallback<T>): void {
    this.addSubscriber(op, cb);
  }

  public unsubscribe<T extends EventOp>(op: T, cb: SubscriberCallback<T>) {
    this.removeSubscriber(op, cb);
  }
}
