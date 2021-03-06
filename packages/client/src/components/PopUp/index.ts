import templateHTML from "./template.html";
import { MasterOfDisaster } from "../../masterOfDisaster";

export type PopUpType = "warning" | "error" | "info" | "debug";

export class PopUp extends HTMLElement {
  _modal: any;
  _close: HTMLParagraphElement;
  _text: any;
  _title: any;
  _mod: MasterOfDisaster;

  static get observedAttributes() {
    return ["type", "text"];
  }

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
    this._modal = shadowRoot.querySelector(".modal");
    this._close = shadowRoot.querySelector(".close");
    this._text = shadowRoot.querySelector(".text");
    this._title = shadowRoot.querySelector(".title");

    this._close.onclick = this.closeModal.bind(this);
    this._mod = MasterOfDisaster.getInstance();
  }

  public openModal(type: PopUpType, content: any) {
    this._mod = MasterOfDisaster.getInstance();
    this.shadowRoot.querySelector(".text").innerHTML = content;
    this._modal.style.display = "block";
    this._modal.id = type;
    switch (type) {
      case "warning":
        this._title.innerHTML = this._mod.getString().general.warning;
        break;
      case "error":
        this._title.innerHTML = this._mod.getString().general.error;
        break;
      case "debug":
        if (MasterOfDisaster.getInstance().getMode()) {
          this._title.innerHTML = this._mod.getString().general.debug;
        } else {
          this.closeModal();
        }
        break;
      default:
        this._title.innerHTML = this._mod.getString().general.info;
        break;
    }
  }

  private closeModal() {
    this._modal.style.display = "none";
  }

  get text() {
    return this.getAttribute("text");
  }

  get title() {
    return this.getAttribute("type");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "text":
        this._text.innerHTML = newValue;
        break;
      case "type":
        this._title.innerHTML = newValue;
        break;
      default:
        break;
    }
  }

  connectedCallback() {
    this._text.innerHTML = this.text;
  }

  disconnectedCallback() {
    this.closeModal();
  }
}

customElements.define("apirush-popup", PopUp);
