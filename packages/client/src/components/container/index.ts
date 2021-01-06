import viewHtml from "./template.html";

class Container extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const tempInnerHTML = this.innerHTML;
    this.innerHTML = viewHtml;
    this.querySelector(".container").innerHTML = tempInnerHTML;
  }

  disconnectedCallback() {}
}

customElements.define("apirush-container", Container);
