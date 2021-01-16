import viewHtml from "./template.html";
import { MasterOfDisaster } from "../../masterOfDisaster";

export default class Container extends HTMLElement {
  _backArrow: HTMLImageElement;
  _wrapper: HTMLDivElement;

  constructor() {
    super();
  }

  connectedCallback() {
    const tempInnerHTML = this.innerHTML;
    this.innerHTML = viewHtml;
    if (this.hasAttribute("class")) {
      this.querySelector(".container").classList.add(...this.getAttribute("classname").split(" "));
    }
    this.querySelector(".container").innerHTML = tempInnerHTML;
    this._wrapper = this.querySelector(".wrapper");
    this._backArrow = this.querySelector("#back_arrow");
  }

  public showArrow() {
    this._wrapper.classList.remove("no_arrow");
    this._backArrow.classList.remove("hidden");
    this._backArrow.onclick = function () {
      history.back();
    };
  }

  disconnectedCallback() {}
}

customElements.define("apirush-container", Container);
