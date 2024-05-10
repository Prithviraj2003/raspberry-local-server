const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const formidable = require("express-formidable");
const fs = require("fs");
const WebSocket = require("ws");
app.use(express.json());
app.use(cors());
const port = 8888;
// Replace <connection_string> with your actual MongoDB connection string
const connectionString = "mongodb://localhost:27017/studentDB";
const wss = new WebSocket.Server({ server });
async function sendStudentInfo(message) {
  const student = await Student.findOne({ prn: message.prn });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(student));
    }
  });
}
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    console.log("Received message:", message);
    // Handle the received message here
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    // Handle the WebSocket connection closed event here
  });
});
const studentSchema = new mongoose.Schema({
  prn: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  DOB: { type: String, required: true },
  phoneNumber: { type: Number, required: true },
  address: { type: String, required: true },
  img: {
    type: mongoose.ObjectId,
    ref: "ProfileImg",
    required: false,
    default: null,
  },
});

const Student = mongoose.model("Student", studentSchema);
const AssetSchema = new mongoose.Schema({
  img: {
    data: Buffer,
    contentType: String,
  },
  prn: {
    type: String,
  },
});

const ProfileImg = mongoose.model("ProfileImg", AssetSchema);
const entrySchema = new mongoose.Schema({
  prn: { type: String, required: true },
  entryArray: [
    {
      entryTime: { type: Date, required: true },
      exitTime: { type: Date, required: false },
    },
  ],
});

const Entry = mongoose.model("Entry", entrySchema);
mongoose
  .connect(connectionString)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.post("/api/addId", (req, res) => {
  console.log(req.body);
  const studentData = req.body;
  const student = new Student(studentData);
  student
    .save()
    .then(() => {
      console.log("Student saved successfully");
      res.send("Student saved successfully");
    })
    .catch((error) => {
      console.error("Failed to save student:", error);
      res.status(500).send("Failed to save student");
    });
});
app.post("/api/AddImg", formidable(), async (req, res) => {
  console.log("img", req.files);
  const { img } = req.files;
  const { prn } = req.fields;
  const newimg = new ProfileImg({});
  if (img) {
    newimg.img.data = fs.readFileSync(img.path);
    newimg.img.contentType = img.type;
    newimg.prn = prn;
  }
  try {
    const savedimg = await newimg.save();
    console.log(savedimg);
    const student = await Student.findOne({ prn });
    student.img = savedimg._id;
    console.log("student", student);
    await student.save();
    res.status(200).send("Image saved successfully");
  } catch (error) {
    console.error("Failed to save image:", error);
    res.status(500).send("Failed to save image");
  }
});
app.get("/api/getImg/:prn", (req, res) => {
  const { prn } = req.params;
  console.log("prn", prn);
  ProfileImg.findOne({ prn })
    .then((img) => {
      res.contentType(img.img.contentType);
      res.send(img.img.data);
    })
    .catch((error) => {
      console.error("Failed to get image:", error);
      res.status(500).send("Failed to get image");
    });
});
app.get("/api/getImgById/:id", (req, res) => {
  const { id } = req.params;
  ProfileImg.findById(id)
    .then((img) => {
      res.contentType(img.img.contentType);
      res.send(img.img.data);
    })
    .catch((error) => {
      console.error("Failed to get image:", error);
      res.status(500).send("Failed to get image");
    });
});
app.post("/api/newEntry", async (req, res) => {
  console.log(req.body);
  const { prn, timestamp, type } = req.body;
  try {
    const entry = await Entry.findOne({ prn });
    if (entry) {
      if (type === "entry") {
        if (
          entry.entryArray.length > 0 &&
          entry.entryArray[entry.entryArray.length - 1].exitTime === undefined
        ) {
          sendStudentInfo({
            prn,
            timestamp,
            type,
            message: "Exit time not recorded",
          });
          return res.status(400).send("Exit time not recorded");
        }
        entry.entryArray.push({ entryTime: timestamp });
      } else {
        if (
          entry.entryArray.length === 0 ||
          entry.entryArray[entry.entryArray.length - 1].exitTime !== undefined
        ) {
          sendStudentInfo({
            prn,
            timestamp,
            type,
            message: "Entry time not recorded",
          });
          return res.status(400).send("Entry time not recorded");
        }
        entry.entryArray[entry.entryArray.length - 1].exitTime = timestamp;
      }
      await entry.save();
    } else {
      const newEntry = new Entry({
        prn,
        entryArray: [{ entryTime: timestamp }],
      });
      await newEntry.save();
    }
    sendStudentInfo({ prn, timestamp, type });
    res.status(200).send("Entry saved successfully");
  } catch (error) {
    console.error("Failed to save entry:", error);
    res.status(500).send("Failed to save entry");
  }
});
app.post("/api/submit", (req, res) => {
  console.log(req.body);
  res.send("Received your request!");
});
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
