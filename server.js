const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const sequelize = require("./config/db");
const dotenv = require("dotenv");
const { processCard } = require("./exports");
const {initializeWebSocket}=require("./wsServer");
initializeWebSocket(server);
// require("./rfid");
require("./espNow");
dotenv.config();

app.use(express.json());
app.use(cors());
const port = 8887;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.post("/entry", async (req, res) => {
  const token = req.body.token;
  const entry=req.body.entry;
  console.log(token);
  processCard(entry, token);
  res.send("done");
});

sequelize
  .sync({ force: false })
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Unable to connect to the database:");
    console.log(err);
  });
