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

const {
  Server,
} = require("socket.io");

/* CONFIG */

dotenv.config();

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
  require("./routes/uploadRoutes");

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
    "MongoDB Connected"
  );

})

.catch((err) => {

  console.log(err);
});

/* MODEL */

const Message =
  require("./models/Message");

/* ONLINE USERS */

let onlineUsers = [];

/* SOCKET CONNECTION */

io.on(
  "connection",

  async (socket) => {

    console.log(
      "User Connected"
    );

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

        socket.username =
          username;

        if (
          !onlineUsers.includes(
            username
          )
        ) {

          onlineUsers.push(
            username
          );
        }

        io.emit(
          "online_users",
          onlineUsers
        );
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

    /* DISCONNECT */

    socket.on(
      "disconnect",

      () => {

        console.log(
          "User Disconnected"
        );

        onlineUsers =
          onlineUsers.filter(
            (user) =>
              user !==
              socket.username
          );

        io.emit(
          "online_users",
          onlineUsers
        );
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