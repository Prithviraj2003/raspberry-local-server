const { SerialPortStream } = require("@serialport/stream");
const { autoDetect } = require("@serialport/bindings-cpp");
const { ReadlineParser } = require("@serialport/parser-readline");
const { processCard } = require("./exports");
const DetectedBinding = autoDetect();

// Create a new instance of SerialPortStream using the detected binding
const port = new SerialPortStream({
  path: "/dev/ttyS0",
  baudRate: 115200,
  binding: DetectedBinding,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

port.on("open", () => {
  console.log("Serial port is open");
});

parser.on("data", (data) => {
  console.log(data);
  try {
    const newData = JSON.parse(data);
    processCard(newData.entryType, newData.token);
  } catch (error) {
    console.log(error);
  }
});

port.on("error", (err) => {
  console.error("Error: ", err.message);
});
