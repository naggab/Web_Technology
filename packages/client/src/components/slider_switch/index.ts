import templateHTML from "./template.html";
import { MasterOfDisaster } from "../../masterOfDisaster";

export class ToggleSwitch extends HTMLElement {
  _checkBox: HTMLInputElement;
  _slider: HTMLLabelElement;
  _mod: MasterOfDisaster;

  constructor() {
    super();
  }

  connectedCallback() {
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._checkBox = shadowRoot.querySelector("#checkbox") as HTMLInputElement;
    this._slider = shadowRoot.querySelector("#switch") as HTMLLabelElement;
    this._slider.onclick = this.modeChanged.bind(this);
  }
  public initMOD() {
    this._mod = MasterOfDisaster.getInstance();
    if (this._mod.getMode()) {
      this._slider.click();
    }
  }

  private modeChanged() {
    this._mod.setMode(this._checkBox.checked);
  }
}

window.customElements.define("toggle-switch", ToggleSwitch);
