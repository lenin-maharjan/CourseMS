const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./src/routes/user.routes");
const { PORT, DB_URL } = require("./src/config/config");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Content Management Backend API");
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
