import templateHTML from "./template.html";
import AbstractScreen from "../AbstractScreen";

class StatsScreen extends AbstractScreen {
  constructor() {
    super();
    document.title = "Stats";
  }

  async getHtml() {
    return templateHTML;
  }
}

customElements.define("stats-screen", StatsScreen);

export default StatsScreen;
