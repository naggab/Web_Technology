import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
import { Gesture } from "./constants";

const raisedHandDescription = new GestureDescription(Gesture.RaisedHand);

for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  raisedHandDescription.addCurl(finger, FingerCurl.NoCurl, 1.0);
  raisedHandDescription.addCurl(finger, FingerCurl.HalfCurl, 0.5);
  raisedHandDescription.addCurl(finger, FingerCurl.NoCurl, -2.0);
}

export default raisedHandDescription;
