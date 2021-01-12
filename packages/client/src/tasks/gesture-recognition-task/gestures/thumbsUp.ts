import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
import { Gesture } from "./constants";

//  👍
const thumbsUpDescription = new GestureDescription(Gesture.ThumbsUp);

// thumb:
// - not curled
// - vertical up (best) or diagonal up left / right
thumbsUpDescription.addCurl(Finger.Thumb, FingerCurl.NoCurl, 2.0);
thumbsUpDescription.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
thumbsUpDescription.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.25);
thumbsUpDescription.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.25);

// all other fingers:
// - curled
// - horizontal left or right
for (let finger of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  thumbsUpDescription.addCurl(finger, FingerCurl.FullCurl, 1.0);
  thumbsUpDescription.addDirection(finger, FingerDirection.HorizontalLeft, 1.0);
  thumbsUpDescription.addDirection(finger, FingerDirection.HorizontalRight, 1.0);
}

thumbsUpDescription.setWeight(Finger.Thumb, 2);

export default thumbsUpDescription;
