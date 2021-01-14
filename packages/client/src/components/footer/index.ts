import templateHTML from "./template.html";
import { Languages, MasterOfDisaster } from "../../masterOfDisaster";

type footerType = "dark" | "light";

export class Footer extends HTMLElement {
  _footer: HTMLElement;
  _changeLanguage: any;
  _mod: MasterOfDisaster;
  _shadowRoot: ShadowRoot;
  _camera: HTMLDivElement;
  _geolocation: HTMLDivElement;

  constructor() {
    super();
    this.checkCameraCapabilities = this.checkCameraCapabilities.bind(this);
    this.checkGeolocationCapabilities = this.checkGeolocationCapabilities.bind(this);
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = templateHTML;

    this._footer = this._shadowRoot.querySelector("#footer");
    this._changeLanguage = this._shadowRoot.querySelector("#change-language");
    this._camera = this._shadowRoot.querySelector(".camera");
    this._geolocation = this._shadowRoot.querySelector(".geolocation");
    this._changeLanguage.onclick = this.changeLanguage.bind(this, false);
  }

  checkCameraCapabilities() {
    if (this._mod.capabilities.cameraAvailable && !this._camera.classList.contains("ok")) {
      this._camera.classList.add("ok");
    } else if (!this._mod.capabilities.cameraAvailable) {
      this._camera.classList.remove("ok");
    }
  }

  checkGeolocationCapabilities() {
    if (this._mod.capabilities.geolocationAvailable && !this._geolocation.classList.contains("ok")) {
      this._geolocation.classList.add("ok");
    } else if (!this._mod.capabilities.geolocationAvailable) {
      this._geolocation.classList.remove("ok");
    }
  }

  static get observedAttributes() {
    return ["styletype"];
  }

  get styletype(): footerType[] {
    const styleList = this.getAttribute("styletype");
    return (styleList.split(",") as footerType[]) || ["light"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "styletype":
        this._footer.className = "";
        this._footer.classList.add(...this.styletype);
        break;
      default:
        break;
    }
  }
  public initMOD() {
    this._mod = MasterOfDisaster.getInstance();
    this.checkCameraCapabilities();
    this.checkGeolocationCapabilities();
    this._mod.capabilities.addEventListener("camera", this.checkCameraCapabilities);
    this._mod.capabilities.addEventListener("geolocation", this.checkGeolocationCapabilities);
  }

  public changeLanguage(firstLaunch: boolean) {
    if (!firstLaunch) {
      if (this._mod.getLanguage() == "English") {
        this._mod.setLanguage("German");
      } else {
        this._mod.setLanguage("English");
      }
    }

    this._changeLanguage.innerHTML = this._mod.getString().general.changeLanguage;
  }
  connectedCallback() {
    this._footer.classList.add(...this.styletype);
  }

  disconnectedCallback() {
    if (this._mod) {
      this._mod.capabilities.removeEventListener("camera", this.checkCameraCapabilities);
      this._mod.capabilities.removeEventListener("geolocation", this.checkGeolocationCapabilities);
    }
  }
}

customElements.define("out-footer", Footer);
