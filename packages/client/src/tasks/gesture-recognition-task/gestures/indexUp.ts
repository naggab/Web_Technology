import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
import { Gesture } from "./constants";

// ☝️
const indexUpDescription = new GestureDescription(Gesture.IndexUp);

// thumb:
indexUpDescription.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
indexUpDescription.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.5);
indexUpDescription.addCurl(Finger.Thumb, FingerCurl.NoCurl, -1.0);
// index:
indexUpDescription.addCurl(Finger.Index, FingerCurl.FullCurl, -2.0);
indexUpDescription.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);

for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky, Finger.Thumb]) {
  indexUpDescription.addCurl(finger, FingerCurl.FullCurl, 1.0);
  indexUpDescription.addCurl(finger, FingerCurl.NoCurl, -1.0);
}

indexUpDescription.setWeight(Finger.Index, 2);

export default indexUpDescription;
