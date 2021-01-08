import "./components/button";
import "./components/container";

import {router} from "./router";
import {MasterOfDisaster} from "./masterOfDisaster";
import "./components/taskOpener";
import {TaskOpener} from "./components/taskOpener";
import "./components/slider_switch/index";
import {Button} from "./components/button";

function main() {
    document.body.style.backgroundImage = "/assets/img/bg.png";
    let _showAllTasks = document.querySelector("#show-all-tasks");
    _showAllTasks.onclick = showAllTasks;
}
async function showAllTasks(){
  router("all-tasks");
}
window.addEventListener("load", () => {
    main();
});

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
        const target = e.target as HTMLAnchorElement;

    });
    MasterOfDisaster.setup().then(() => {
        (<any>window).MOD = MasterOfDisaster.getInstance();
        document.body.appendChild(new TaskOpener());
        router("welcome-start");
    });
});
