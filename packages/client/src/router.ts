import Welcome from "./screens/welcome";
import EnterExistingGame from "./screens/enterExistingGame";
import CreateNewGame from "./screens/createNewGame";
import ShowTasks from "./screens/listAllTasks";
import { Game } from "./screens/game";

export function navigateTo(url) {
  history.pushState(null, null, url);
  router();
}

export async function router() {
  console.debug("Router in action!!!!");
  const routes = [
    { path: "/", view: () => new Welcome() },
    { path: "/joinGame", view: () => new EnterExistingGame() },
    { path: "/newGame", view: () => new CreateNewGame() },
    { path: "/showTasks", view: () => new ShowTasks() },
    { path: "/game", view: () => new Game() },
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

  document.querySelector("#app").innerHTML = await screen.getHtml();
}
