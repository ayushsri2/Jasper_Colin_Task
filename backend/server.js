const cluster = require("cluster");
const os = require("os");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process setting up ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new one.`);
    cluster.fork();
  });
} else {
  const app = express();

  // Rate Limiter Middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: "Too many requests from this IP, please try again later."
  });
  app.use(limiter);

  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
  }));
  
  app.use(express.json());

  // Mount routes
  const productsRoutes = require("./routes/products");
  app.use("/api/products", productsRoutes);

  const authRoutes = require("./routes/auth");
  app.use("/api/auth", authRoutes);

  app.get("/", (req, res) => {
    res.send("Hello from Express Backend!");
  });

  // Connecting to MongoDB and starting the server
  const PORT = process.env.PORT || 5000;
  mongoose
    .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mydatabase", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("✅ Connected to MongoDB");
      app.listen(PORT, () =>
        console.log(`🚀 Worker ${process.pid} running on port ${PORT}`)
      );
    })
    .catch((err) => console.log("MongoDB Connection Error:", err));
}
