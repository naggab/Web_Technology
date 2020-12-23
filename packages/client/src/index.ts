import "./components/button";
import viewHtml from "./tasks/sample-task/view.html";
import { Button } from "./components/button";

import Welcome from "./screens/welcome/index";
import EnterExistingGame from "./screens/enterExistingGame/index";
import CreateNewGame from "./screens/createNewGame/index";
import ShowTasks from "./screens/listAllTasks/index";

const navigateTo = (url) => {
  history.pushState(null, null, url);
  router();
};
const router = async () => {
  const routes = [
    { path: "/", view: () => new Welcome() },
    { path: "/joinGame", view: () => new EnterExistingGame() },
    { path: "/newGame", view: () => new CreateNewGame() },
    { path: "/showTasks", view: () => new ShowTasks() },
  ];

  const potentialMatches = routes.map((route) => {
    return {
      route: route,
      isMatch: location.pathname === route.path,
    };
  });

  let match = potentialMatches.find((potentialMatch) => potentialMatch.isMatch);

  if (!match) {
    match = {
      route: routes[0],
      isMatch: true,
    };
  }
  const screen = match.route.view();
  let wrapper = document.querySelector("#wrapper");
  if (wrapper !== null) {
    wrapper.remove();
  }
  if (match.route === routes[0]) {
    document.querySelector("#app").innerHTML = await screen.getHtml();
    screen.setProperties();
  } else {
    //document.querySelector("#app").innerHTML = await screen.getHtml();

    wrapper = document.createElement("div");
    wrapper.setAttribute("id", "wrapper");
    wrapper.setAttribute(
      "style",
      `            width: 70%;
            height: 80vh;
            padding: 50px;

            margin: auto;
            border: 3px solid black;
            border-radius: 50px;
            background: rgba(255, 255, 255, 0.4);`,
    );
    wrapper.innerHTML = await screen.getHtml();
    document.querySelector("#app").innerHTML = wrapper.outerHTML;
  }
};

function main() {
  document.body.style.backgroundImage = "/assets/img/bg.png";
}

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

window.addEventListener("load", () => {
  main();
});
