import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
const raisedHandDescription = new GestureDescription("raisedhand");

// thumb:
raisedHandDescription.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);

// index:
raisedHandDescription.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);

// middle:
raisedHandDescription.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);

// ring:
raisedHandDescription.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);

// pinky:
raisedHandDescription.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

raisedHandDescription.setWeight(Finger.Middle, 2);
raisedHandDescription.setWeight(Finger.Ring, 2);

export default raisedHandDescription;
