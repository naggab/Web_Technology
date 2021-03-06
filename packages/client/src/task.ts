export type TaskFinishCallback = (duration: number, success: boolean) => void; // duration in milliseconds

export interface TaskOpts {
  finishCb: TaskFinishCallback;
}

export class Task extends HTMLElement {
  //abstract methods that need to be implemented by entities subclassing this class
  onMounted?(): void | Promise<void>;
  onUnmounting?(): void | Promise<void>;

  private startTime: number;
  private endTime: number;
  private opts: TaskOpts;

  constructor(opts: TaskOpts) {
    super();
    if (!this.onMounted || !this.onUnmounting) {
      throw new Error("Methods onMounted and onUnmounting need to be defined in each Task subclass");
    }
    this.opts = opts;
  }
  private async connectedCallback() {
    if (this.startTime) {
      return;
    }
    const mountResult = this.onMounted();
    if (mountResult) {
      await mountResult;
    }
    this.startTime = performance.now();
  }

  private async disconnectedCallback() {
    if (!this.endTime) {
      // Task unmounted even though not finished yet
      this.opts.finishCb(0, false);
    }
    const unmountResult = this.onUnmounting();
    if (unmountResult) {
      await unmountResult;
    }
  }

  protected finish(success: boolean, timeFactor: number = 1) {
    this.endTime = performance.now();
    const diff = (this.endTime - this.startTime) * timeFactor; //milliseconds
    this.opts.finishCb(diff, success);
  }
}
