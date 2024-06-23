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
const Entry = require("./models/Entry");
require("./rfid");
require("./espNow");
dotenv.config();

app.use(express.json());
app.use(cors());
const publicKey = fs.readFileSync("public.key");
const port = 8887;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
const processCard = async (token) => {
  const decoded = jwt.decode(token, publicKey);
  const type = "Out";
  const gate = "mainGate";
  const request = {
    entryId: 0,
    prn: decoded.prn,
    pin: decoded.pin,
    gate: gate,
    type: type,
    presentAuthority: "security",
  };
  console.log("decoded :", decoded);
  // const pTime = new Date().getTime();
  // console.log("Time elapsed before user: ", pTime - currentTime, "ms");
  const user = await User.findOne({
    where: { prn: decoded.prn },
    include: [{ model: ProfileImg }],
  });
  // console.log("user :", user);
  console.log(request.gate, user.access[request.gate]);
  if (user.pin === decoded.pin && user.access[request.gate] === true) {
    const entry = await Entry.findOne({
      where: { prn: decoded.prn, gate: gate },
      order: [["createdAt", "DESC"]],
    });
    console.log(entry);
    if (entry) {
      console.log("Entry found");
      // request.entryId = entry.id;
      if (type === "In") {
        if (entry.entry !== null && entry.exit === null) {
          console.log("Already in");
        } else {
          // client.CardEntry(request);
          // console.log("Entry created");
          // newEntry = await Entry.create({
          //   prn: decoded.prn,
          //   gate: gate,
          //   entry: {time:new Date(),presentAuthority:"security"},
          //   exit: null
          // });
          console.log(request);
          client.CardEntry(request, async (error, response) => {
            if (error) {
              console.error("Error in gRPC call:");
              console.log(error);
            } else {
              console.log(response);
            }
          });
          // console.log(newEntry)
        }
      }
      if (type === "Out") {
        if (entry.entry !== null && entry.exit === null) {
          // client.CardEntry(request);
          // console.log("Entry updated")
          // entry.exit = {time:new Date(),presentAuthority:"security"};
          // await entry.save();
          client.CardEntry(request, async (error, response) => {
            if (error) {
              console.error("Error in gRPC call:");
              console.log(error);
            } else {
              console.log(response);
            }
          });
        } else {
          console.log("Already out");
        }
      }
    } else {
      // client.CardEntry(request);
      // console.log("Entry created")
      // newEntry = await Entry.create({
      //   prn: decoded.prn,
      //   gate: gate,
      //   entry: {time:new Date(),presentAuthority:"security"},
      //   exit: null
      // });
      client.CardEntry(request, async (error, response) => {
        if (error) {
          console.error("Error in gRPC call:");
          console.log(error);
        } else {
          console.log(response);
        }
      });
      // console.log(newEntry)
    }
  } else {
    console.log("access denied");
  }
  // const Time = new Date().getTime();
  // console.log("Time elapsed : ", Time - currentTime, "ms");
};
app.post("/entry", async (req, res) => {
  const token = req.body.token;
  console.log(token);
  processCard(token);
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