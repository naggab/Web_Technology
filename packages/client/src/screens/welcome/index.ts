import templateHTML from "./template.html";
import { Button } from "../../components/button";
import AbstractScreen from "../AbstractScreen";

class WelcomeScreen extends AbstractScreen {
  constructor() {
    super();
    document.title = "Welcome";
  }

  async getHtml() {
    return templateHTML;
  }
}
customElements.define("welcome-screen", WelcomeScreen);

export default WelcomeScreen;
