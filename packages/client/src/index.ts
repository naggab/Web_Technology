import "./components/button";
import "./components/container";

import { router } from "./router";
import { MasterOfDisaster } from "./masterOfDisaster";
import "./components/taskOpener";
import { TaskOpener } from "./components/taskOpener";
import "./components/slider_switch/index";
import { Footer } from "./components/footer";

function main() {
  document.body.style.backgroundImage = "/assets/img/bg.png";
  let _footer: Footer = document.querySelector("footer") as Footer;
}

window.addEventListener("load", () => {
  main();
});

document.addEventListener("DOMContentLoaded", () => {
  MasterOfDisaster.setup().then(() => {
    (<any>window).MOD = MasterOfDisaster.getInstance();
    document.body.appendChild(new TaskOpener());
    router("welcome-start");
  });
});
