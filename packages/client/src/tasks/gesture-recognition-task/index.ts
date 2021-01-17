import viewHtml from "./view.html";
import { Task } from "../../task";

import Gestures, { Gesture } from "./gestures";
import { MasterOfDisaster } from "../../masterOfDisaster";

import GestureRecognitionWorker from "./gesture-recognition.worker";
import { WorkerRequestTypes, WorkerResponse } from "./protocol";

const grWorker = new GestureRecognitionWorker();

const config = {
  video: { width: 640, height: 480, fps: 30 },
};

const GestureGoals: Array<Gesture[]> = [
  [Gesture.RaisedFist, Gesture.Victory, Gesture.ThumbsUp, Gesture.RaisedHand, Gesture.Horns, Gesture.IndexUp],
  [Gesture.RaisedFist, Gesture.Victory, Gesture.ThumbsUp],
  [Gesture.RaisedFist, Gesture.Horns, Gesture.RaisedHand],
];

export default class GestureRecognitionTask extends Task {
  stopped: boolean;
  analyseRunning: boolean = false;
  failsaveTimeout: any;

  gestureGoalsContainer_: HTMLDivElement;
  gestureGoalEntryTemplate_: HTMLTemplateElement;
  loadingOverlay_: HTMLDivElement;
  video_: HTMLVideoElement;
  hiddenCanvas_: HTMLCanvasElement;

  goal_: Array<{ gesture: Gesture; done: boolean; el: HTMLElement }> = [];

  static checkCapabilities() {
    // TODO check user has webcam
    return true;
  }

  get currentGoal() {
    const index = this.goal_.findIndex((g) => !g.done);
    if (index === -1) {
      return null;
    }
    return this.goal_[index];
  }

  nextGoal(success: boolean = true) {
    if (this.failsaveTimeout) {
      clearTimeout(this.failsaveTimeout);
    }
    const currentGoal = this.currentGoal;
    currentGoal.done = true;
    currentGoal.el.classList.add("inactive");
    currentGoal.el.classList.add(success ? "success" : "fail");
    const newGoal = this.currentGoal;
    if (newGoal) {
      newGoal.el.classList.remove("inactive");
      this.failsaveTimeout = setTimeout(() => this.nextGoal(false), 30 * 1000);
    } else {
      this.finish(true);
    }
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    const mod = MasterOfDisaster.getInstance();
    const seed = mod.getGameSeed();

    const gestureGoal = GestureGoals[seed % GestureGoals.length];

    this.gestureGoalsContainer_ = this.shadowRoot.querySelector("#gesture-goals") as HTMLDivElement;
    this.loadingOverlay_ = this.shadowRoot.querySelector(".loading-overlay") as HTMLDivElement;
    this.loadingOverlay_.innerHTML = mod.getString().gesture_recognition_task.pleaseWait;
    this.hiddenCanvas_ = this.shadowRoot.querySelector("#hidden-canvas") as HTMLCanvasElement;
    this.gestureGoalEntryTemplate_ = this.shadowRoot.querySelector(
      "#gesture-goal-entry-template",
    ) as HTMLTemplateElement;

    this.goal_ = gestureGoal.map((g) => ({ gesture: g, done: false, el: this.addGoal(g) }));

    this.goal_[0].el.classList.remove("inactive");

    this.video_ = this.shadowRoot.querySelector("#video-element");
    grWorker.onmessage = this.handleMsgFromWorker.bind(this);
    grWorker.postMessage({
      type: WorkerRequestTypes.CHECK_IS_READY,
      debugMode: mod.getMode(),
    });
    this.initCamera(config.video.width, config.video.height, config.video.fps).then((video) => {
      this.video_.play();
      this.video_.addEventListener("loadeddata", (event) => {
        this.startPredictions();
      });
    });
    this.failsaveTimeout = setTimeout(() => this.nextGoal(false), 30 * 1000);
  }

  handleMsgFromWorker(e: MessageEvent) {
    const resp: WorkerResponse = e.data;
    if (resp.type === WorkerRequestTypes.CHECK_IS_READY && resp.ready) {
      grWorker.postMessage({
        type: WorkerRequestTypes.CONFIGURE_ESTIMATOR,
        gestures: this.goal_.map((goal) => goal.gesture),
      });
    } else if (resp.type === WorkerRequestTypes.CHECK_IS_READY && !resp.ready) {
      setTimeout(() => {
        grWorker.postMessage({
          type: WorkerRequestTypes.CHECK_IS_READY,
        });
      }, 250);
    } else if (resp.type === WorkerRequestTypes.CONFIGURE_ESTIMATOR && resp.ok) {
      this.startPredictions();
    } else if (resp.type === WorkerRequestTypes.ANALYZE_IMAGE) {
      if (this.loadingOverlay_.classList.contains("open")) {
        this.loadingOverlay_.classList.remove("open");
      }

      this.analyseRunning = false;
      if (this.currentGoal?.gesture === resp.gesture) {
        MasterOfDisaster.log("detected goal, next!");
        this.nextGoal(true);
      }
    }
  }

  addGoal(gesture: Gesture) {
    const newEntryHtml = this.gestureGoalEntryTemplate_.content.cloneNode(true) as HTMLElement;
    const entry = newEntryHtml.querySelector(".gesture-goal-entry") as HTMLElement;
    const emojiDiv = entry.querySelector(".emoji");
    emojiDiv.innerHTML = Gestures[gesture].emoji;
    this.gestureGoalsContainer_.appendChild(newEntryHtml);
    return entry;
  }

  async startPredictions() {
    let rerun: (cb: () => Promise<void>, timeout: number) => void = window.setTimeout;

    if ((<any>window).requestIdleCallback) {
      rerun = (cb, timeout) => (<any>window).requestIdleCallback(cb, { timeout });
    }
    // main estimation loop
    const sendImageToWorker = async () => {
      if (this.stopped) {
        return;
      }
      if (!this.analyseRunning) {
        this.analyseRunning = true;
        const ctx = this.hiddenCanvas_.getContext("2d");
        ctx.clearRect(0, 0, this.hiddenCanvas_.width, this.hiddenCanvas_.height);
        ctx.drawImage(this.video_, 0, 0, this.hiddenCanvas_.width, this.hiddenCanvas_.height);
        const imageData = ctx.getImageData(0, 0, this.hiddenCanvas_.width, this.hiddenCanvas_.height);

        grWorker.postMessage(
          {
            type: WorkerRequestTypes.ANALYZE_IMAGE,
            image: imageData.data.buffer,
            width: this.hiddenCanvas_.width,
            height: this.hiddenCanvas_.height,
          },
          [imageData.data.buffer],
        );
      }

      rerun(sendImageToWorker, 100);
    };
    sendImageToWorker();
  }

  async initCamera(width, height, fps): Promise<HTMLVideoElement> {
    const constraints = {
      audio: false,
      video: {
        facingMode: "user",
        width: width,
        height: height,
        frameRate: { max: fps },
      },
    };
    this.video_.width = width;
    this.video_.height = height;

    // get video stream
    this.video_.srcObject = await navigator.mediaDevices.getUserMedia(constraints);

    return new Promise((resolve) => {
      this.video_.onloadedmetadata = () => {
        resolve(this.video_);
      };
    });
  }

  drawPoint(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  onUnmounting(): void | Promise<void> {
    grWorker.onmessage = undefined;
    this.stopped = true;
    const src: MediaStream = this.video_.srcObject as any;
    if (src.getTracks) {
      src.getTracks().forEach((track) => track.stop());
    }
  }
}

customElements.define("gesture-recognition-task", GestureRecognitionTask);
