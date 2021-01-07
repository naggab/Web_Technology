import viewHtml from "./template.html";

class Container extends HTMLElement {
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
  }

  disconnectedCallback() {}
}

customElements.define("apirush-container", Container);
