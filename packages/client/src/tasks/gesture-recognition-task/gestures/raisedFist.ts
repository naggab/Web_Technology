import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
import { Gesture } from "./constants";

//  ✊
const raisedFistDescription = new GestureDescription(Gesture.RaisedFist);

// all fingers are curled in a fist
for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  raisedFistDescription.addCurl(finger, FingerCurl.FullCurl, 1.0);
  raisedFistDescription.addCurl(finger, FingerCurl.HalfCurl, 0.5);
  raisedFistDescription.addCurl(finger, FingerCurl.NoCurl, -2.0);
}

export default raisedFistDescription;
