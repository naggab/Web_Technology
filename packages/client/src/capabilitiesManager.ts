export class CapabilitiesManager {
  private cameraPermissionStatus: PermissionStatus;
  private geolocationPermissionStatus: PermissionStatus;

  private cameraSubscribers: Array<() => void> = [];
  private geolocationSubscribers: Array<() => void> = [];

  private userHasCamera: boolean = false;
  private geolocationWorked: boolean = false;

  constructor() {
    this.receiveCameraPermissionCallback = this.receiveCameraPermissionCallback.bind(this);
    this.receiveGeolocationPermissionCallback = this.receiveGeolocationPermissionCallback.bind(this);

    navigator.permissions.query({ name: "camera" }).then(this.receiveCameraPermissionCallback);
    navigator.permissions.query({ name: "geolocation" }).then(this.receiveGeolocationPermissionCallback);
    this.testCapabilities();
  }

  async testCapabilities() {
    const didUpdateCam = await this.testWebcamExistence();
    if (didUpdateCam) {
      this.onUpdate("camera");
    }
    const didUpdateGeo = await this.testGeolocationPermission();
    if (didUpdateGeo) {
      this.onUpdate("geolocation");
    }
  }

  get cameraAvailable() {
    return this.cameraPermissionStatus && this.cameraPermissionStatus.state === "granted" && this.userHasCamera;
  }

  get geolocationAvailable() {
    return (
      this.geolocationPermissionStatus && this.geolocationPermissionStatus.state === "granted" && this.geolocationWorked
    );
  }

  addEventListener(target: "camera" | "geolocation", cb: () => void) {
    if (target === "camera") {
      this.cameraSubscribers.push(cb);
    } else if (target === "geolocation") {
      this.geolocationSubscribers.push(cb);
    }
  }

  removeEventListener(target: "camera" | "geolocation", cb: () => void) {
    if (target === "camera") {
      this.cameraSubscribers = this.cameraSubscribers.filter((cb_) => cb_ != cb);
    } else if (target === "geolocation") {
      this.geolocationSubscribers = this.geolocationSubscribers.filter((cb_) => cb_ != cb);
    }
  }

  private async onUpdate(target: "camera" | "geolocation") {
    let receivers = [];
    if (target === "camera") {
      await this.testWebcamExistence();
      receivers.push(...this.cameraSubscribers);
    } else if (target === "geolocation") {
      await this.testGeolocationPermission();
      receivers.push(...this.geolocationSubscribers);
    }
    receivers.forEach((r) => r());
  }

  log(...data: any) {
    console.log(`[CapabilitiesManager]:`, ...data);
  }

  private receiveCameraPermissionCallback(p: PermissionStatus) {
    this.cameraPermissionStatus = p;
    this.cameraPermissionStatus.onchange = this.onUpdate.bind(this, "camera");
    this.onUpdate("camera");
  }

  private receiveGeolocationPermissionCallback(p: PermissionStatus) {
    this.geolocationPermissionStatus = p;
    this.geolocationPermissionStatus.onchange = this.onUpdate.bind(this, "geolocation");
    this.onUpdate("geolocation");
  }

  async testGeolocationPermission() {
    let oldValue = this.geolocationWorked;
    this.geolocationWorked = await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          this.log("was able to use geolocation");
          resolve(true);
        },
        () => {
          this.log("was unable to use geolocation");
          resolve(false);
        },
      );
    });
    return oldValue !== this.geolocationWorked;
  }

  async testWebcamExistence() {
    let oldValue = this.userHasCamera;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user" } });
      if (stream.getVideoTracks().length > 0) {
        stream.getVideoTracks().forEach((t) => t.stop());
        this.log("was able to use camera");
        this.userHasCamera = true;
      } else {
        this.log("was unable to use camera");
        this.userHasCamera = false;
      }
    } catch (e) {
      this.log("failed to access camera");
      this.userHasCamera = false;
    }
    return this.userHasCamera !== oldValue;
  }
}
