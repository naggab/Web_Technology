import "./components/button";
import "./components/container";

import { router, navigateTo } from "./router";
import { MasterOfDisaster } from "./masterOfDisaster";
import "./components/taskOpener";
import { TaskOpener } from "./components/taskOpener";
import "./components/slider_switch/index"

function main() {
  document.body.style.backgroundImage = "/assets/img/bg.png";
}

window.addEventListener("load", () => {
  main();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLAnchorElement;

    if (target.matches("[data-link]")) {
      e.preventDefault();
      navigateTo(target.href);
    }
  });
  MasterOfDisaster.setup().then(() => {
    (<any>window).MOD = MasterOfDisaster.getInstance();
    document.body.appendChild(new TaskOpener());
    router("welcome-start");
  });
});

// window.addEventListener("popstate", router);
