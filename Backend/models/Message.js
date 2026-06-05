const mongoose =
  require("mongoose");

const messageSchema =
  new mongoose.Schema({

    username: String,

    message: String,

    to: String,

    fileUrl: String,

    audioUrl: String,

    time: String,

    status: {
      type: String,
      default: "sent",
    },

    reaction: {
      type: String,
      default: "",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

module.exports =
  mongoose.model(
    "Message",
    messageSchema
  );