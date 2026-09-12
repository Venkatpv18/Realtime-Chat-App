const express =
  require("express");

const http =
  require("http");

const cors =
  require("cors");

const mongoose =
  require("mongoose");

const dotenv =
  require("dotenv");

const dns =
  require("dns");

const {
  Server,
} = require("socket.io");

/* CONFIG */

dotenv.config();

// Set public DNS servers to resolve MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  console.warn("Could not set custom DNS servers:", err.message);
}

/* EXPRESS */

const app =
  express();

const server =
  http.createServer(app);

/* SOCKET.IO */

const io =
  new Server(server, {

    cors: {
      origin:
        "http://localhost:5173",

      methods: [
        "GET",
        "POST",
      ],
    },
  });

/* MIDDLEWARE */

app.use(cors());

app.use(express.json());

/* STATIC FILES */

app.use(
  "/uploads",
  express.static("uploads")
);

/* ROUTES */

const authRoutes =
  require("./routes/authRoutes");

const uploadRoutes =
  require("./routes/UploadRoutes");

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/upload",
  uploadRoutes
);

/* MONGODB */

mongoose.connect(
  process.env.MONGO_URI
)
.then(() => {
  console.log(
    "✅ MongoDB Connected"
  );
})
.catch((err) => {
  if (err.code === 8000 || err.message?.includes("bad auth")) {
    console.error("❌ MongoDB Authentication Failed: Invalid username or password in MONGO_URI.");
    console.error("👉 Please update the password in backend/.env to your correct MongoDB Atlas password.");
  } else if (err.code === "ECONNREFUSED" || err.syscall === "querySrv") {
    console.error("❌ MongoDB DNS Error: Unable to resolve cluster DNS.");
  } else {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
});

/* MODEL */

const Message =
  require("./models/Message");

/* ONLINE USERS TRACKER (Map username => socket count) */

let onlineUsers = new Map();

/* SOCKET CONNECTION */

io.on(
  "connection",

  async (socket) => {

    console.log(
      "User Connected:", socket.id
    );

    // Send current list of unique online usernames
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    /* LOAD OLD MESSAGES */

    try {

      const oldMessages =
        await Message.find()
        .sort({
          createdAt: 1,
        });

      socket.emit(
        "old_messages",
        oldMessages
      );

    } catch (error) {

      console.log(error);
    }

    /* JOIN */

    socket.on(
      "join",

      (username) => {

        if (username) {

          socket.username = username;

          const count = onlineUsers.get(username) || 0;

          onlineUsers.set(username, count + 1);

          io.emit(
            "online_users",
            Array.from(onlineUsers.keys())
          );

        }
      }
    );

    /* DISCONNECT */

    socket.on(
      "disconnect",

      () => {

        if (socket.username) {

          const count = onlineUsers.get(socket.username) || 1;

          if (count <= 1) {

            onlineUsers.delete(socket.username);

          } else {

            onlineUsers.set(socket.username, count - 1);

          }

          io.emit(
            "online_users",
            Array.from(onlineUsers.keys())
          );

        }
      }
    );

    /* SEND MESSAGE */

    socket.on(
      "send_message",

      async (data) => {

        try {

          const newMessage =
            new Message({

              username:
                data.username,

              message:
                data.message,

              to:
                data.to,

              fileUrl:
                data.fileUrl,

              audioUrl:

                data.audioUrl,

              time:
                data.time,

              status:
                "sent",

              reaction:
                "",
            });

          const savedMessage =
            await newMessage.save();

          io.emit(
            "receive_message",
            savedMessage
          );

        } catch (error) {

          console.log(error);
        }
      }
    );

    /* TYPING */

    socket.on(
      "typing",

      (username) => {

        socket.broadcast.emit(
          "typing",
          username
        );
      }
    );

    /* MESSAGE SEEN */

    socket.on(
      "message_seen",

      async (messageId) => {

        try {

          const updatedMessage =
            await Message.findByIdAndUpdate(

              messageId,

              {
                status: "seen",
              },

              {
                new: true,
              }
            );

          if (updatedMessage) {

            io.emit(
              "message_seen_update",
              updatedMessage._id
            );
          }

        } catch (error) {

          console.log(error);
        }
      }
    );

    /* MESSAGE REACTION */

    socket.on(
      "add_reaction",

      async ({
        messageId,
        reaction,
      }) => {

        try {

          const updatedMessage =
            await Message.findByIdAndUpdate(

              messageId,

              {
                reaction,
              },

              {
                new: true,
              }
            );

          if (updatedMessage) {

            io.emit(
              "reaction_updated",
              updatedMessage
            );
          }

        } catch (error) {

          console.log(error);
        }
      }
    );

  }
);

/* PORT */

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,

  () => {

    console.log(
      `Server running on port ${PORT}`
    );
  }
);