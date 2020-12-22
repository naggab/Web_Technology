import "./components/button";
import viewHtml from "./tasks/sample-task/view.html";
import {Button} from "./components/button";



import Welcome from "./screens/welcome/index";
import EnterExistingGame from "./screens/enterExistingGame/index";
import CreateNewGame from "./screens/createNewGame/index";
import ShowTasks  from "./screens/listAllTasks/index";
const navigateTo = url => {
    history.pushState(null, null, url);
    router();
}
const router = async () => {
    const routes = [
        {path: "/", view: () => new Welcome},
        {path: "/joinGame", view: () => new EnterExistingGame},
        {path: "/newGame", view: () => new CreateNewGame},
        {path: "/showTasks", view: () => new ShowTasks},

    ];

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        }
    })

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    if (!match) {
        match = {
            route: routes[0],
            isMatch: true
        };
    }
    const screen = match.route.view();
    document.querySelector("#app").innerHTML = await screen.getHtml();
    console.log(match.route.view());
}

function main() {
    document.body.style.backgroundImage = require('./assets/img/bg.png');
    //const welcome_screen = this.shadowRoot.getElementById("welcome-screen") as Welcome;


}

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
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

