import "./components/button";
import "./components/container";

import { router } from "./router";
import { MasterOfDisaster } from "./masterOfDisaster";
import "./components/taskOpener";
import { TaskOpener } from "./components/taskOpener";
import "./components/slider_switch/index";
import "./components/footer";
import { Footer } from "./components/footer";
import { ToggleSwitch } from "./components/slider_switch";

function main() {
  document.body.style.backgroundImage = "/assets/img/bg.png";
}

window.addEventListener("load", () => {
  main();
});

document.addEventListener("DOMContentLoaded", () => {
  MasterOfDisaster.setup().then(() => {
    const footer = document.querySelector("out-footer") as Footer;
    const slider = document.querySelector("toggle-switch") as ToggleSwitch;
    footer.initMOD();
    footer.changeLanguage(true);
    slider.initMOD();

    (<any>window).MOD = MasterOfDisaster.getInstance();
    const taskOpener = new TaskOpener();
    document.body.appendChild(taskOpener);
    router("welcome-start");
    history.pushState("welcome-start", "welcome-start", null);
    MasterOfDisaster.getInstance().registerTaskOpener(taskOpener);
  });
});
window.addEventListener("popstate", (event) => {
  if (event.state) {
    MasterOfDisaster.getInstance().goBack(event.state);
  }
});
