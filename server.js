const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sequelize = require("./config/db");
const client = require("./config/grpc_setup");
const dotenv = require("dotenv");
const User = require("./models/User");
const ProfileImg = require("./models/ProfileImg");
require("./rfid");
dotenv.config();

app.use(express.json());
app.use(cors());
const publicKey = fs.readFileSync("public.key");
const port = 8887;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const entry = async (token) => {
  const decoded = jwt.decode(token, publicKey);
  console.log("decoded :", decoded);
  const request = {
    prn: decoded.prn,
    pin: decoded.pin,
    access: req.body.access,
  };
  // Make the gRPC call
  console.log("gRPC client found");
  client.CardEntry(request, async (error, response) => {
    if (error) {
      console.error("Error in gRPC call:");
      // res.status(500).send("Internal Server Error");
      const user = await User.findOne({ where: { prn: decoded.prn } });
      console.log(request.access, user.access[request.access]);
      if (user.pin === decoded.pin && user.access[request.access] === true) {
        // res.send({ access: true });
        console.log("access granted");
      } else {
        // res.send({ access: false });
        console.log("access denied");
      }
    } else {
      console.log(response);
      const image = await ProfileImg.findOne({ where: { id: response.image } });
      console.log("image :", image);
      response.image = image.img;
      // res.send(response);
    }
  });
};
module.exports = entry;
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