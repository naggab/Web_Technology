import express from "express";
import expressWSWrapper, { Application } from "express-ws";
const app: Application = expressWSWrapper(express(), undefined, { wsOptions: { clientTracking: true } }).app;
import WebSocket from "ws";
import { Broker } from "./broker";
import path from "path";

const port = 3000;

app.use(express.static("public"));

app.get("/api/test", (req, res) => {
  res.send("Hello World!");
  console.log("client requested", req.originalUrl);
});

const errorMsg = {
  op: "INVALID_GAME_ID",
  payload: {},
};

const broker = new Broker();

app.ws("/ws", function (ws, req) {
  const gameIdStr = req.query["gameId"];
  if (!gameIdStr || typeof gameIdStr !== "string" || isNaN(gameIdStr as any)) {
    ws.send(JSON.stringify(errorMsg));
    ws.close();
    return;
  }
  const gameId = parseInt(gameIdStr, 10);
  broker.onPlayerConnected(gameId, {
    ws,
    color: "red",
    name: req.query["name"]?.toString() || "Player",
  });
});

//Gabriel start
app.use("/screens", express.static(path.resolve(__dirname, "client", "screens")));
app.get("/*", (req, res)=>{
  res.sendFile(path.resolve(__dirname, "client", "index.html"));

});

//Gabriel end

const cleanup = async () => {
  console.log("cleanup");
  await broker.terminate();
  console.log("exit");
  process.exit(0);
};

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, cleanup.bind(this, eventType));
});

process.on("SIGINT", async () => {});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
