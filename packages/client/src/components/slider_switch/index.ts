import templateHTML from "./template.html";
import { MasterOfDisaster } from "../../masterOfDisaster";

export class ToggleSwitch extends HTMLElement {
  _checkBox: HTMLInputElement;
  _switch: HTMLInputElement;
  _mod: MasterOfDisaster;

  constructor() {
    super();
  }

  connectedCallback() {
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._checkBox = shadowRoot.querySelector("#checkbox") as HTMLInputElement;
    this._switch = shadowRoot.querySelector("#checkbox") as HTMLInputElement;
    this._switch.onclick = this.modeChanged.bind(this);
  }
  public initMOD() {
    this._mod = MasterOfDisaster.getInstance();
  }

  private modeChanged() {
    if (!this._switch.checked) {
      this._mod.setMode(true);
    } else {
      this._mod.setMode(false);
    }
  }
}

window.customElements.define("toggle-switch", ToggleSwitch);
