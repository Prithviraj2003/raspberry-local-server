const jwt = require("jsonwebtoken");
const client = require("./config/grpc_setup");
const User = require("./models/User");
const ProfileImg = require("./models/ProfileImg");
const fs = require("fs");
const publicKey = fs.readFileSync("public.key");
const Entry = require("./models/Entry");
const { broadcast } = require("./wsServer");

const processCard = async (type, token) => {
  const start = Date.now();
  const decoded = jwt.decode(token, publicKey);
  console.log("decoded :", decoded);
  const gate = "mainGate";
  let request = {
    entryId: 0,
    prn: decoded.prn,
    pin: decoded.pin,
    gate: gate,
    type: type,
    presentAuthority: "security",
    time: new Date(),
  };
  const time = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  }).split(",")[1];
  console.log("time : ", time);
  const user = await User.findOne({
    where: { prn: decoded.prn },
    include: [{ model: ProfileImg }],
  });
  console.log("time elapsed after user: ", Date.now() - start, "ms");
  console.log("user :", user);
  console.log(request.gate, user.access[request.gate]);
  if (user.pin === decoded.pin && user.access[request.gate] === true) {
    const entry = await Entry.findOne({
      where: { prn: decoded.prn, gate: gate },
      order: [["createdAt", "DESC"]],
    });
    console.log("time elapsed after entry: ", Date.now() - start, "ms");
    if (entry) {
      request.entryId = entry.id;
      if (type === "entry") {
        if (entry.entry !== null && entry.exit === null) {
          console.log("Already in");
          broadcast(JSON.stringify({ user,time, message: "Already in" }));
        } else {
          await client.CardEntry(request, async (error, response) => {
            if (error) {
              console.error("Error in gRPC call:");
              console.log(error);
              broadcast(
                JSON.stringify({ user, error,time, message: "Error in gRPC call" })
              );
            } else {
              console.log(response);
              console.log(
                "time elapsed at response: ",
                Date.now() - start,
                "ms"
              );
              broadcast(JSON.stringify({ user,time, response }));
            }
          });
        }
      }
      if (type === "exit") {
        if (entry.entry !== null && entry.exit === null) {
          await client.CardEntry(request, async (error, response) => {
            if (error) {
              console.error("Error in gRPC call:");
              console.log(error);
              broadcast(
                JSON.stringify({ user, error,time, message: "Error in gRPC call" })
              );
            } else {
              console.log(response);
              console.log(
                "time elapsed at response: ",
                Date.now() - start,
                "ms"
              );
              broadcast(JSON.stringify({ user,time, response }));
            }
          });
        } else {
          console.log("Already out");

          broadcast(JSON.stringify({ user,time, message: "Already out" }));
        }
      }
    } else {
      await client.CardEntry(request, async (error, response) => {
        if (error) {
          console.error("Error in gRPC call:");
          console.log(error);
          broadcast(
            JSON.stringify({ user, error,time, message: "Error in gRPC call" })
          );
        } else {
          console.log("time elapsed at response: ", Date.now() - start, "ms");
          console.log(response);
          broadcast(JSON.stringify({ user,time, response }));
        }
      });
    }
    console.log("time elapsed at access: ", Date.now() - start, "ms");
  } else {
    console.log("access denied");
    broadcast(JSON.stringify({ user,time, message: "access denied" }));
  }
};

module.exports = { processCard };
