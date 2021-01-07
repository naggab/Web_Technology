import express from "express";
import expressWSWrapper, { Application } from "express-ws";
const app: Application = expressWSWrapper(express(), undefined, { wsOptions: { clientTracking: true } }).app;
import { Broker } from "./broker";
import path from "path";
import { GameMaster } from "./gameMaster";

const port = 3000;

app.use(express.static("public"));

app.get("/api/test", (req, res) => {
  res.send("Hello World!");
  console.log("client requested", req.originalUrl);
});

const gameMaster = new GameMaster();
const broker = new Broker(gameMaster);

app.ws("/ws", function (ws, req) {
  broker.onConnected(ws);
});

//Gabriel start
app.use("/screens", express.static(path.resolve(__dirname, "client", "screens")));
app.get("/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "index.html"));
});

//Gabriel end

const cleanup = async (eventType) => {
  console.log("cleanup", eventType);
  await broker.terminate();
  console.log("exit");
  process.exit(0);
};

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanup.bind(this, eventType));
});

process.on("SIGINT", async () => {});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
