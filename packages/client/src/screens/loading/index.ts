import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";

class LoadingScreen extends AbstractScreen {
  constructor() {
    super();
    document.title = "Loading";
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("loading-screen", LoadingScreen);

export default LoadingScreen;
