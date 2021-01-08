import viewHtml from "./view.html";
import { Task } from "../../task";
import "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import fp from "fingerpose";

import "./gestures/victory";
import victory from "./gestures/victory";
import raisedFist from "./gestures/raisedFist";
import thumbsup from "./gestures/thumbsup";
import horns from "./gestures/horns";
import raisedHand from "./gestures/raisedHand";

const landmarkColors = {
  thumb: "red",
  indexFinger: "blue",
  middleFinger: "yellow",
  ringFinger: "green",
  pinky: "pink",
  palmBase: "white",
};

const gestureStrings = {
  thumbs_up: "👍",
  victory: "✌🏻",
  raisedfist: "✊",
  horns: "🤘",
  raisedhand: "✋",
};

const config = {
  video: { width: 640, height: 480, fps: 30 },
};

export default class GestureRecognitionTask extends Task {
  stopped: boolean;

  async onMounted() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = viewHtml;

    this.initCamera(config.video.width, config.video.height, config.video.fps).then((video) => {
      video.play();
      video.addEventListener("loadeddata", (event) => {
        console.log("Camera is ready");
        this.startPredictions();
      });
    });

    const canvas = this.shadowRoot.querySelector("#pose-canvas") as HTMLCanvasElement;
    canvas.width = config.video.width;
    canvas.height = config.video.height;
    console.log("Canvas initialized");
    console.log("Starting predictions");
  }

  async startPredictions() {
    const video = this.shadowRoot.querySelector("#pose-video");
    const canvas = this.shadowRoot.querySelector("#pose-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    const resultLayer = this.shadowRoot.querySelector("#pose-result") as HTMLDivElement;
    const knownGestures = [victory, raisedFist, thumbsup, raisedHand, horns];
    const GE = new fp.GestureEstimator(knownGestures);

    // load handpose model
    const model = await handpose.load();
    console.log("Handpose model loaded");

    // main estimation loop
    const estimateHands = async () => {
      if (this.stopped) {
        return;
      }
      // clear canvas overlay
      ctx.clearRect(0, 0, config.video.width, config.video.height);
      resultLayer.innerText = "";

      // get hand landmarks from video
      // Note: Handpose currently only detects one hand at a time
      // Therefore the maximum number of predictions is 1
      const predictions = await model.estimateHands(video, true);

      for (let i = 0; i < predictions.length; i++) {
        // now estimate gestures based on landmarks
        // using a minimum confidence of 7.5 (out of 10)
        const est = GE.estimate(predictions[i].landmarks, 7.0);

        if (est.gestures.length > 0) {
          // find gesture with highest confidence
          let result = est.gestures.reduce((p, c) => {
            return p.confidence > c.confidence ? p : c;
          });

          resultLayer.innerText = gestureStrings[result.name];
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

    const video = this.shadowRoot.querySelector("#pose-video") as HTMLVideoElement;
    video.width = width;
    video.height = height;

    // get video stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video);
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
    const video = this.shadowRoot.querySelector("#pose-video") as HTMLVideoElement;
    const src: MediaStream = video.srcObject as any;
    if (src.getTracks) {
      src.getTracks().forEach((track) => track.stop());
    }
  }
}

customElements.define("gesture-recognition-task", GestureRecognitionTask);
