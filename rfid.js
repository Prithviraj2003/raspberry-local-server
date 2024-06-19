"use strict";
const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");
const jwt = require("jsonwebtoken");
const client = require("./config/grpc_setup");
const User = require("./models/User");
const ProfileImg = require("./models/ProfileImg");
const fs = require("fs");
const publicKey = fs.readFileSync("public.key");
const Entry = require("./models/Entry");
console.log("scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24, // pin number of CS
});

const mfrc522 = new Mfrc522(softSPI).setResetPin(22).setBuzzerPin(18);

let lastCardUid = null;

setInterval(async function () {
  //# reset card
  mfrc522.reset();

  //# Scan for cards
  let response = mfrc522.findCard();
  if (!response.status) {
    // No Card detected
    return;
  }
  console.log("Card detected, CardType: " + response.bitSize);

  //# Get the UID of the card
  response = mfrc522.getUid();
  if (!response.status) {
    console.log("UID Scan Error");
    return;
  }
  //# If we have the UID, continue
  const uid = response.data;
  console.log(
    "Card read UID: %s %s %s %s",
    uid[0].toString(16),
    uid[1].toString(16),
    uid[2].toString(16),
    uid[3].toString(16)
  );

  const currentTime = new Date().getTime();
  if (lastCardUid && uid.join("") === lastCardUid.join("")) {
    console.log("Same Card Detected");
    return;
  }

  lastCardUid = uid;

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  console.log("Card Memory Capacity: " + memoryCapacity);

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  let combinedData = Buffer.alloc(0);

  for (let sector = 1; sector <= 8; sector++) {
    for (
      let blockWithinSector = 0;
      blockWithinSector < 3;
      blockWithinSector++
    ) {
      const block = sector * 4 + blockWithinSector;

      //# Authenticate with key and uid
      if (!mfrc522.authenticate(block, key, uid)) {
        console.log("Authentication Error at block " + block);
        break;
      }

      //# Read the block data
      const blockData = mfrc522.getDataForBlock(block);
      if (!blockData) {
        console.log("Failed to read block " + block);
        break;
      }

      console.log(`Block: ${block} Data: ${blockData}`);
      combinedData = Buffer.concat([combinedData, Buffer.from(blockData)]);
    }
  }

  //# Stop
  mfrc522.stopCrypto();

  const token = combinedData.toString("utf-8");
  console.log("Token: ", token);
  const decoded = jwt.decode(token, publicKey);
  console.log("decoded :", decoded);
  const type = "In";
  const gate = "library";
  let request = {
    entryId: 0,
    prn: decoded.prn,
    pin: decoded.pin,
    gate: gate,
    type: type,
    presentAuthority: "security",
  };

  const processCard = async () => {
    const pTime = new Date().getTime();
    console.log("Time elapsed before user: ", pTime - currentTime, "ms");
    const user = await User.findOne({
      where: { prn: decoded.prn },
      include: [{ model: ProfileImg }],
    });
    console.log("user :", user);
    console.log(request.access, user.access[request.access]);
    if (user.pin === decoded.pin && user.access[request.access] === true) {
      const entry = await Entry.findOne({
        where: { prn: decoded.prn, gate: gate },
        order: [["createdAt", "DESC"]],
      });
      if (entry) {
        request.entryId = entry.id;
        if (type === "In") {
          if (entry.entry !== null && entry.exit === null) {
            console.log("Already in");
          } else {
            client.CardEntry(request);
          }
        }
        if (type === "Out") {
          if (entry.entry !== null && entry.exit === null) {
            client.CardEntry(request);
          } else {
            console.log("Already out");
          }
        }
      } else {
        client.CardEntry(request);
      }
      console.log("access granted");
    } else {
      console.log("access denied");
    }
    const Time = new Date().getTime();
    console.log("Time elapsed : ", Time - currentTime, "ms");
  };

  processCard();
}, 500);
