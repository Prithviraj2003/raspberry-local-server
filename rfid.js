const SoftSPI = require("rpi-softspi");
const entry = require("./server");
console.log("Scanning...");
console.log("Please put chip or keycard in the antenna inductive zone!");
console.log("Press Ctrl-C to stop.");

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24 // pin number of CS
});

const Mfrc522 = require("mfrc522-rpi");
const mfrc522 = new Mfrc522(softSPI)
setInterval(function() {
  //# reset card
  mfrc522.reset();

  //# Scan for cards
  let response = mfrc522.findCard();
  if (!response.status) {
    // console.log("No Card");
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

  //# Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uid);
  console.log("Card Memory Capacity: " + memoryCapacity);

  //# This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  let combinedData = Buffer.alloc(0);

  for (let sector = 1; sector <= 8; sector++) {
    for (let blockWithinSector = 0; blockWithinSector < 3; blockWithinSector++) {
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
      entry(combinedData.toString('utf-8'));
    }
  }

  //# Stop
  mfrc522.stopCrypto();

  console.log("Combined Data: " + combinedData.toString('utf-8'));
}, 500);
