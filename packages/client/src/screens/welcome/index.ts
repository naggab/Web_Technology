import AbstractScreen from "../AbstractScreen";
import templateHTML from "./template.html";

export default class extends AbstractScreen{
  constructor() {
    super();
    this.setTitle("Welcome");
  }
  async getHtml(){
    return templateHTML;
  }
}

/*
import { Button } from "../../components/button";

export class Welcome extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = templateHTML;
  }

  connectedCallback() {}
}

customElements.define("welcome-screen", Welcome);
*/
