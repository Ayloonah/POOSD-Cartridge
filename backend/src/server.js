require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./src/routes/auth");

const app = express();

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
app.use("/api", apiRouter);

// Mount auth routes to API router
apiRouter.use("/auth", authRoutes);

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
