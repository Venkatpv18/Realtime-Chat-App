require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {}

console.log("URI:", process.env.MONGO_URI?.replace(/:(.*?)@/, ":********@"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:");
    console.error(err);
    process.exit(1);
  });