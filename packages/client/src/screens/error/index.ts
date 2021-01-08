import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";

class ErrorScreen extends AbstractScreen {
  constructor() {
    super();
    document.title = "Error";
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("error-screen", ErrorScreen);

export default ErrorScreen;
