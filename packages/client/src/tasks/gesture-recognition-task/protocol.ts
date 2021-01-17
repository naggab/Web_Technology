import { Gesture } from "./gestures";

export enum WorkerRequestTypes {
  CHECK_IS_READY = "CHECK_IS_READY",
  CONFIGURE_ESTIMATOR = "CONFIGURE_ESTIMATOR",
  ANALYZE_IMAGE = "ANALYZE_IMAGE",
}

export type WorkerRequest =
  | {
      type: WorkerRequestTypes.CHECK_IS_READY;
      debugMode?: boolean;
    }
  | {
      type: WorkerRequestTypes.CONFIGURE_ESTIMATOR;
      gestures: Gesture[];
    }
  | {
      type: WorkerRequestTypes.ANALYZE_IMAGE;
      image: ArrayBuffer | SharedArrayBuffer;
      width: number;
      height: number;
    };

export type WorkerResponse =
  | {
      type: WorkerRequestTypes.CHECK_IS_READY;
      ready: boolean;
    }
  | {
      type: WorkerRequestTypes.CONFIGURE_ESTIMATOR;
      ok: boolean;
    }
  | {
      type: WorkerRequestTypes.ANALYZE_IMAGE;
      gesture: Gesture | null;
    };
