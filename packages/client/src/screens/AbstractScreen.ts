export default class extends HTMLElement {
  constructor() {
    super();
  }

  onMounted?(): void | Promise<void>;
  onUnmounting?(): void | Promise<void>;

  setTitle(title) {
    document.title = title;
  }

  async getHtml() {
    return "";
  }
  setProperties() {}

  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = await this.getHtml();
    if (this.onMounted) {
      await this.onMounted();
    }
  }

  async disconnectedCallback() {
    if (this.onUnmounting) {
      await this.onUnmounting();
    }
  }
}
