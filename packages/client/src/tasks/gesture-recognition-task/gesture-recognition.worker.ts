import { WorkerRequest, WorkerRequestTypes, WorkerResponse } from "./protocol";
import Gestures, { Gesture } from "./gestures";

let DEBUG_MODE = location.host.indexOf("localhost") !== -1;

const log = (...params: any) => {
  if (DEBUG_MODE) {
    console.log(...params);
  }
};

interface HandposeLib {
  load: (data?: any) => Promise<HandposeModel>;
}

interface FingerposeEstimator {
  estimate: (landmarks: any, confidence: number) => any;
}

interface FingerposeLib {
  GestureEstimator: new (descriptions: any[]) => FingerposeEstimator;
}

interface HandposeModel {
  estimateHands: (video: any, v: boolean) => Promise<any>;
}

declare var handpose: HandposeLib;
declare var fp: FingerposeLib;

let model: HandposeModel | null = null;
const ctx: Worker = self as any;

const loadDeps = async () => {
  log("[gr-worker]: loading deps");
  importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
  log("[gr-worker]: tfjs loaded");
  importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose");
  model = await handpose.load({
    maxContinuousChecks: 7,
  });
  log("[gr-worker]: handpose.js loaded");

  importScripts("/assets/fingerpose.js");
  log("[gr-worker]: fingerpose.js loaded");
};

let GE: any = null;

const configureEstimator = (gestures: Gesture[]) => {
  const knownGestures = gestures.map((g) => Gestures[g].description);
  GE = new fp.GestureEstimator(knownGestures);
};

let lastDetected: string = "";

const analyseImage = async (imageData: ImageData): Promise<Gesture | null> => {
  if (!GE) {
    return null;
  }
  const predictions = await model.estimateHands(imageData, true);

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
        log("[gr-worker]: Detected", result.name);
      }
      if (lastDetected === result.name) {
        return result.name as Gesture;
      }
      lastDetected = result.name;
    } else {
      lastDetected = "";
    }
  }
  return null;
};

const handleMessage = async (req: WorkerRequest): Promise<WorkerResponse> => {
  switch (req.type) {
    case WorkerRequestTypes.CHECK_IS_READY:
      DEBUG_MODE = !!req.debugMode;
      return {
        ...req,
        ready: typeof handpose !== "undefined" && typeof fp !== "undefined" && typeof model !== "undefined",
      };

    case WorkerRequestTypes.CONFIGURE_ESTIMATOR:
      configureEstimator(req.gestures);
      return {
        type: WorkerRequestTypes.CONFIGURE_ESTIMATOR,
        ok: true,
      };

    case WorkerRequestTypes.ANALYZE_IMAGE:
      let imageData = new ImageData(new Uint8ClampedArray(req.image), req.width, req.height);
      return {
        type: req.type,
        gesture: await analyseImage(imageData),
      };
  }
};

ctx.onmessage = async (e) => {
  const req = e.data as WorkerRequest;
  const resp = await handleMessage(req);
  ctx.postMessage(resp);
};

loadDeps();

export default {} as typeof Worker & { new (): Worker };
