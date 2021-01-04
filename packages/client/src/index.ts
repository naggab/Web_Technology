import "./components/button";

import { router, navigateTo } from "./router";

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
  router();
});

window.addEventListener("popstate", router);
