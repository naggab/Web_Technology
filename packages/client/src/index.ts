import "./components/button";
import "./components/container";

import { router } from "./router";
import { MasterOfDisaster } from "./masterOfDisaster";
import "./components/taskOpener";
import { TaskOpener } from "./components/taskOpener";
import "./components/slider_switch/index";
import "./components/footer";
import { Footer } from "./components/footer";

function main() {
  document.body.style.backgroundImage = "/assets/img/bg.png";
}

window.addEventListener("load", () => {
  main();
});

document.addEventListener("DOMContentLoaded", () => {
  MasterOfDisaster.setup().then(() => {
    const footer = document.querySelector("out-footer") as Footer;
    footer.changeLanguage(true);
    (<any>window).MOD = MasterOfDisaster.getInstance();
    const taskOpener = new TaskOpener();
    document.body.appendChild(taskOpener);
    router("welcome-start");
    MasterOfDisaster.getInstance().registerTaskOpener(taskOpener);
  });
});
