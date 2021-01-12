import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";

import { Gesture } from "./constants";

// ✌️
const victoryDescription = new GestureDescription(Gesture.Victory);

// thumb:
victoryDescription.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
victoryDescription.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
victoryDescription.addCurl(Finger.Thumb, FingerCurl.NoCurl, -0.5);

// index:
victoryDescription.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
victoryDescription.addCurl(Finger.Index, FingerCurl.FullCurl, -1.0);
victoryDescription.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.75);
victoryDescription.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 1.0);

// middle:
victoryDescription.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
victoryDescription.addCurl(Finger.Middle, FingerCurl.FullCurl, -1.0);
victoryDescription.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
victoryDescription.addDirection(Finger.Middle, FingerDirection.DiagonalUpLeft, 0.75);

// ring:
victoryDescription.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
victoryDescription.addCurl(Finger.Ring, FingerCurl.NoCurl, -1.0);

// pinky:
victoryDescription.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
victoryDescription.addCurl(Finger.Pinky, FingerCurl.NoCurl, -1.0);

// give additional weight to index and ring fingers
victoryDescription.setWeight(Finger.Index, 2);
victoryDescription.setWeight(Finger.Middle, 2);

export default victoryDescription;
