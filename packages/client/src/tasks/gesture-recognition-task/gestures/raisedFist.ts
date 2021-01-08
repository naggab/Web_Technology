import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";

// describe gesture ✊
const raisedFistDescription = new GestureDescription("raisedfist");

// thumb:
raisedFistDescription.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);

// index:
raisedFistDescription.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);

// middle:
raisedFistDescription.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);

// ring:
raisedFistDescription.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);

// pinky:
raisedFistDescription.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

export default raisedFistDescription;
