import express from "express";
const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/api/test", (req, res) => {
  res.send("Hello World!");
  console.log("client requested", req.originalUrl);
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
