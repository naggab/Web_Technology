import WelcomeScreen from "./screens/welcome-start";
import JoinGameScreen from "./screens/welcome-join-game";
import CreateNewGameScreen from "./screens/welcome-create-game";
import { ClientState } from "./masterOfDisaster";
import ErrorScreen from "./screens/error";
import { InGameScreen } from "./screens/in-game";
import LoadingScreen from "./screens/loading";
import PostGameScreen from "./screens/post-game";
import PreGameScreen from "./screens/pre-game";
import StatsScreen from "./screens/welcome-stats";
import ListAllTasksScreen from "./screens/listAllTasks";

export async function router(state: ClientState) {
  let screen: Node = null;
  switch (state) {
    case "welcome-start":
      screen = new WelcomeScreen();
      break;
    case "welcome-join-game":
      screen = new JoinGameScreen();
      break;
    case "welcome-create-game":
      screen = new CreateNewGameScreen();
      break;
    case "in-game":
      screen = new InGameScreen();

      break;
    case "loading":
      screen = new LoadingScreen();

      break;
    case "post-game":
      screen = new PostGameScreen();

      break;
    case "pre-game":
      screen = new PreGameScreen();

      break;
    case "welcome-stats":
      screen = new StatsScreen();

      break;
    case "error":
      screen = new ErrorScreen();
      break;
    case "all-tasks":
      screen = new ListAllTasksScreen();
      break;
    default:
      screen = new WelcomeScreen();

      break;
  }
  document.querySelector("#app").innerHTML = "";
  document.querySelector("#app").appendChild(screen);
}
