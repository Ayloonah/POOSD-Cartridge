require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./src/routes/auth");
const listRoutes = require("./src/routes/listRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const userGameEntryRoutes = require("./routes/userGameEntryRoutes");
const app = express();
app.use(cors());
// Allows your backend to read JSON request bodies
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// API routes
const apiRouter = express.Router();
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// Mount auth routes to API router
apiRouter.use("/auth", authRoutes);
apiRouter.use("/lists", listRoutes)
apiRouter.use("/games", gameRoutes);
apiRouter.use("user-game-entries", userGameEntryRoutes);
app.use("/api", apiRouter);
// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

  module.exports = app;
