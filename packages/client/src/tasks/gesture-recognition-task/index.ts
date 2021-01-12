import viewHtml from "./view.html";
import { Task } from "../../task";
import "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import fp from "fingerpose";

import "./gestures/victory";
import victory from "./gestures/victory";
import raisedFist from "./gestures/raisedFist";
import thumbsUp from "./gestures/thumbsUp";
import horns from "./gestures/horns";
import raisedHand from "./gestures/raisedHand";
import indexUp from "./gestures/indexUp";
import Gestures, { Gesture } from "./gestures";
import { MasterOfDisaster } from "../../masterOfDisaster";

const config = {
  video: { width: 640, height: 480, fps: 10 },
};

const GestureGoals: Array<Gesture[]> = [
  [Gesture.RaisedFist, Gesture.Victory, Gesture.ThumbsUp],
  [Gesture.RaisedFist, Gesture.Horns, Gesture.RaisedHand],
];

export default class GestureRecognitionTask extends Task {
  stopped: boolean;

  gestureGoalsContainer_: HTMLDivElement;
  gestureGoalEntryTemplate_: HTMLTemplateElement;
  loadingOverlay_: HTMLDivElement;
  video_: HTMLVideoElement;

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

  nextGoal() {
    const currentGoal = this.currentGoal;
    currentGoal.done = true;
    currentGoal.el.classList.add("inactive");
    const newGoal = this.currentGoal;
    if (newGoal) {
      newGoal.el.classList.remove("inactive");
    } else {
      this.finish(true, 0);
    }
  }

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;
    const seed = MasterOfDisaster.getInstance().getGameSeed();

    const gestureGoal = GestureGoals[seed % GestureGoals.length];

    this.gestureGoalsContainer_ = this.shadowRoot.querySelector("#gesture-goals") as HTMLDivElement;
    this.loadingOverlay_ = this.shadowRoot.querySelector(".loading-overlay") as HTMLDivElement;
    this.gestureGoalEntryTemplate_ = this.shadowRoot.querySelector(
      "#gesture-goal-entry-template",
    ) as HTMLTemplateElement;

    this.goal_ = gestureGoal.map((g) => ({ gesture: g, done: false, el: this.addGoal(g) }));

    this.goal_[0].el.classList.remove("inactive");

    this.video_ = this.shadowRoot.querySelector("#video-element");

    this.initCamera(config.video.width, config.video.height, config.video.fps).then((video) => {
      this.video_.play();
      this.video_.addEventListener("loadeddata", (event) => {
        console.log("Camera is ready");
        this.startPredictions();
      });
    });
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
    const knownGestures = this.goal_.map((g) => Gestures[g.gesture].description);
    const GE = new fp.GestureEstimator(knownGestures);

    // load handpose model
    const model = await handpose.load();
    this.loadingOverlay_.classList.remove("open");

    let lastDetected = "";

    // main estimation loop
    const estimateHands = async () => {
      if (this.stopped) {
        return;
      }

      // get hand landmarks from video
      // Note: Handpose currently only detects one hand at a time
      // Therefore the maximum number of predictions is 1
      const predictions = await model.estimateHands(this.video_, true);

      for (let i = 0; i < predictions.length; i++) {
        // now estimate gestures based on landmarks
        // using a minimum confidence of 7.5 (out of 10)
        const est = GE.estimate(predictions[i].landmarks, 7.5);

        if (est.gestures.length > 0) {
          // find gesture with highest confidence
          let result = est.gestures.reduce((p, c) => {
            return p.confidence > c.confidence ? p : c;
          });

          if (lastDetected !== result.name) {
            console.log("Detected", result.name);
          }
          if (lastDetected === result.name && this.currentGoal?.gesture === result.name) {
            console.log("detected goal, next!");
            this.nextGoal();
            setTimeout(() => {
              estimateHands();
            }, 500);
            return;
          }
          lastDetected = result.name;
        }
      }

      // ...and so on
      setTimeout(() => {
        estimateHands();
      }, 1000 / config.video.fps);
    };
    await estimateHands();
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
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video_.srcObject = stream;

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
    this.stopped = true;
    const src: MediaStream = this.video_.srcObject as any;
    if (src.getTracks) {
      src.getTracks().forEach((track) => track.stop());
    }
  }
}

customElements.define("gesture-recognition-task", GestureRecognitionTask);
