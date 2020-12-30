# Web_Technology

##### Environment Requirements

Should work on Windows / macOS and Linux as long as the following requirements are installed. 

-   Runtime [`Node.js`](https://nodejs.org/en/)
    Version v12.13.1 or higher (v13.X , v14.X should work as well)

-   Package Manager [`yarn`](https://yarnpkg.com/)
    Version 1.22.5 or higher

-   IDE: `WebStorm` (should work with `VS Code` as well)


##### Structure 

As this project contains multiple packages code is split into `./packages/server` and `./packages/client`.
Each package as well as the root folder contain a `package.json` to define dependencies and declare script-tasks.


##### Dependencies

To install all the required dependencies execute `yarn install` in the root folder on first use and **whenever any package.json file changes**.

##### How to run

To start both server and client just execute `yarn run start` in the root folder. Any changes to the client will 
recompile the client and refresh the browser. Changes to the server-code will restart the server but not refresh the client.
After starting the client can be accessed via `http://localhost:9000`. The server binds to `http://localhost:3000`.

##### How to run `tests`

Testcases (specified in packages/client/tests) can be run by executing `yarn run test` inside the packages/client directory.

##### Code Styling

This repo is equipped with a configured [`prettier`](https://prettier.io/) configuration. In the root folder just run 

`yarn run check-codestyle` to check for errors 

`yarn run fix-codestyle` to auto-fix issues if possible

In `WebStorm` code-styling is applied automatically each time a file is saved


#Web Componnts
