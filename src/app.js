const express = require("express");
const connectDB = require("./config/database.js");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

dotenv.config(); // Load environment variables

const app = express();

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

// Import and use the message router
const messageRouter = require("./routes/messages.js");
const authRouter=require("./routes/auth.js")
const profileRouter = require("./routes/profile.js");
const timeLineRouter = require("./routes/timeLine.js");
const softwareApplicationRouter = require("./routes/softwareApplication.js"); // Import the software application router
const skillRouter = require("./routes/skill.js"); // Import the skill router
const projectRouter = require("./routes/projects.js"); // Import the project router
app.use("/", messageRouter); // Mount router at /api/messages
app.use("/", authRouter); // Mount router at /api/messages
app.use("/", profileRouter); // Mount router at /api/messages
app.use("/", timeLineRouter); // Mount router at /api/messages
app.use("/", softwareApplicationRouter); // Mount router at /api/messages
app.use("/", skillRouter); // Mount router at /api/messages
app.use("/", projectRouter); // Mount router at /api/messages

// Connect to the database and start the server
connectDB()
  .then(() => {
    console.log("Database connection successful");

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB cannot connect: " + err.message);
  });