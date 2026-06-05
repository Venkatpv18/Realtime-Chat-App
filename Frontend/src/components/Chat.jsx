import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import EmojiPicker
from "emoji-picker-react";

import {
  socket,
} from "../socket/socket";

function Chat() {

  const navigate =
    useNavigate();

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [onlineUsers,
    setOnlineUsers] =
    useState([]);

  const [typingUser,
    setTypingUser] =
    useState("");

  const [selectedUser,
    setSelectedUser] =
    useState("");

  const [showEmoji,
    setShowEmoji] =
    useState(false);

  const [darkMode,
    setDarkMode] =
    useState(true);

  const [selectedFile,
    setSelectedFile] =
    useState(null);

  const [searchText,
    setSearchText] =
    useState("");

  const [mediaRecorder,
    setMediaRecorder] =
    useState(null);

  const messagesEndRef =
    useRef(null);

  /* NOTIFICATION */

  useEffect(() => {

    if (
      Notification.permission !==
      "granted"
    ) {

      Notification.requestPermission();
    }

  }, []);

  /* SOCKETS */

  useEffect(() => {

    const username =
      localStorage.getItem(
        "username"
      );

    socket.emit(
      "join",
      username
    );

    /* RECEIVE MESSAGE */

    socket.on(
      "receive_message",

      (data) => {

        setMessages((prev) => [
          ...prev,
          data,
        ]);

        if (

          Notification.permission ===
          "granted"

          &&

          data.username !==
          localStorage.getItem(
            "username"
          )
        ) {

          new Notification(
            `${data.username}`,

            {
              body:
                data.message ||
                "Sent a file/audio",
            }
          );
        }
      }
    );

    /* ONLINE USERS */

    socket.on(
      "online_users",

      (users) => {

        setOnlineUsers(users);
      }
    );

    /* TYPING */

    socket.on(
      "typing",

      (username) => {

        setTypingUser(
          `${username} is typing...`
        );

        setTimeout(() => {

          setTypingUser("");

        }, 1000);
      }
    );

    /* OLD MESSAGES */

    socket.on(
      "old_messages",

      (msgs) => {

        setMessages(msgs);
      }
    );

    /* SEEN STATUS */

    socket.on(
      "message_seen_update",

      (messageId) => {

        setMessages((prev) =>

          prev.map((msg) =>

            msg._id === messageId

              ? {
                  ...msg,
                  status: "seen",
                }

              : msg
          )
        );
      }
    );

    /* REACTION UPDATE */

    socket.on(
      "reaction_updated",

      (updatedMessage) => {

        setMessages((prev) =>

          prev.map((msg) =>

            msg._id ===
            updatedMessage._id

              ? updatedMessage

              : msg
          )
        );
      }
    );

    return () => {

      socket.off(
        "receive_message"
      );

      socket.off(
        "online_users"
      );

      socket.off(
        "typing"
      );

      socket.off(
        "old_messages"
      );

      socket.off(
        "message_seen_update"
      );

      socket.off(
        "reaction_updated"
      );
    };

  }, []);

  /* AUTO SCROLL */

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);

  /* AUTO SEEN */

  useEffect(() => {

    messages.forEach((msg) => {

      if (

        msg.to ===
        localStorage.getItem(
          "username"
        )

        &&

        msg.status !==
        "seen"
      ) {

        socket.emit(
          "message_seen",
          msg._id
        );
      }
    });

  }, [messages]);

  /* SEND MESSAGE */

  const sendMessage =
    async () => {

    if (
      message.trim() === ""
      &&
      !selectedFile
    ) return;

    if (!selectedUser) {

      alert(
        "Select a user first"
      );

      return;
    }

    let fileUrl = "";

    if (selectedFile) {

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      try {

        const res =
          await fetch(
            "http://localhost:5000/api/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await res.json();

        fileUrl =
          data.fileUrl;

      } catch (error) {

        console.log(error);

        alert(
          "File Upload Failed"
        );

        return;
      }
    }

    const username =
      localStorage.getItem(
        "username"
      );

    socket.emit(
      "send_message",
      {
        username,
        message,
        to: selectedUser,
        fileUrl,

        time:
          new Date()
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
      }
    );

    setMessage("");

    setSelectedFile(null);
  };

  /* AUDIO RECORD */

  const startRecording =
    async () => {

    try {

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true,
          });

      const recorder =
        new MediaRecorder(
          stream
        );

      let chunks = [];

      recorder.ondataavailable =
        (event) => {

          if (
            event.data.size > 0
          ) {

            chunks.push(
              event.data
            );
          }
        };

      recorder.onstop =
        async () => {

          const audioBlob =
            new Blob(
              chunks,
              {
                type:
                  "audio/webm",
              }
            );

          const formData =
            new FormData();

          formData.append(
            "file",
            audioBlob,
            "voice.webm"
          );

          try {

            const res =
              await fetch(
                "http://localhost:5000/api/upload",
                {
                  method: "POST",
                  body: formData,
                }
              );

            const data =
              await res.json();

            socket.emit(
              "send_message",
              {
                username:
                  localStorage.getItem(
                    "username"
                  ),

                to:
                  selectedUser,

                audioUrl:
                  data.fileUrl,

                time:
                  new Date()
                  .toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  ),
              }
            );

          } catch (error) {

            console.log(error);
          }
        };

      recorder.start();

      setMediaRecorder(
        recorder
      );

    } catch (error) {

      console.log(error);
    }
  };

  /* STOP RECORD */

  const stopRecording =
    () => {

    if (mediaRecorder) {

      mediaRecorder.stop();
    }
  };

  /* LOGOUT */

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "username"
    );

    navigate("/");
  };

  /* EMOJI */

  const onEmojiClick =
    (emojiData) => {

      setMessage(
        (prev) =>
          prev +
          emojiData.emoji
      );
    };

  return (

    <div
      className={
        darkMode
          ? "main-chat-layout dark"
          : "main-chat-layout light"
      }
    >

      {/* SIDEBAR */}

      <div className="sidebar">

        <h2>Chats</h2>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>

        <button
          className="theme-btn"
          onClick={() =>
            setDarkMode(
              !darkMode
            )
          }
        >
          {
            darkMode
              ? "☀️ Light Mode"
              : "🌙 Dark Mode"
          }
        </button>

        {/* SEARCH */}

        <input
          type="text"

          placeholder="Search messages..."

          value={searchText}

          onChange={(e) =>
            setSearchText(
              e.target.value
            )
          }

          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            marginBottom: "15px",
          }}
        />

        {/* USERS */}

        <div className="user-list">

          {onlineUsers.map(
            (user, index) => (

              user !==
              localStorage.getItem(
                "username"
              ) && (

                <div
                  key={index}

                  className={
                    selectedUser === user
                      ? "user active-user"
                      : "user"
                  }

                  onClick={() =>
                    setSelectedUser(user)
                  }
                >

                  <div className="user-avatar">

                    {
                      user
                      .charAt(0)
                      .toUpperCase()
                    }

                  </div>

                  <div className="user-info">

                    <span>
                      {user}
                    </span>

                    <div className="online-status">

                      <span className="online-dot">
                      </span>

                      Online

                    </div>

                  </div>

                </div>
              )
            )
          )}

        </div>

      </div>

      {/* CHAT */}

      <div className="chat-section">

        {/* HEADER */}

        <div className="chat-header">

          {
            selectedUser ? (

              <>

                <div className="header-avatar">

                  {
                    selectedUser
                    .charAt(0)
                    .toUpperCase()
                  }

                </div>

                <div>

                  <h2>
                    {selectedUser}
                  </h2>

                  <p className="header-online">
                    Online
                  </p>

                </div>

              </>

            ) : (

              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                }}
              >

                <h2>
                  Realtime Chat App
                </h2>

                <p
                  style={{
                    color: "gray",
                    marginTop: "5px",
                  }}
                >
                  Select a user to start chatting
                </p>

              </div>
            )
          }

        </div>

        {/* MESSAGES */}

        <div className="messages">

          {messages

            .filter(

              (msg) =>

                (

                  (
                    msg.username ===
                    selectedUser

                    &&

                    msg.to ===
                    localStorage.getItem(
                      "username"
                    )
                  )

                  ||

                  (
                    msg.username ===
                    localStorage.getItem(
                      "username"
                    )

                    &&

                    msg.to ===
                    selectedUser
                  )
                )

                &&

                (
                  msg.message
                  ?.toLowerCase()

                  .includes(
                    searchText
                    .toLowerCase()
                  )
                )
            )

            .map((msg, index) => (

              <div
                key={index}

                className={
                  msg.username ===
                  localStorage.getItem(
                    "username"
                  )
                    ? "my-message"
                    : "other-message"
                }
              >

                <strong>
                  {msg.username}
                </strong>

                <p>
                  {msg.message}
                </p>

                {/* REACTIONS */}

                <div
                  style={{
                    marginTop: "8px",
                  }}
                >

                  {
                    ["❤️", "😂", "👍", "🔥"]
                    .map((emoji) => (

                      <button
                        key={emoji}

                        onClick={() => {

                          socket.emit(
                            "add_reaction",
                            {
                              messageId:
                                msg._id,

                              reaction:
                                emoji,
                            }
                          );
                        }}

                        style={{
                          marginRight: "5px",
                          border: "none",
                          cursor: "pointer",
                          background:
                            "transparent",

                          fontSize:
                            "18px",
                        }}
                      >
                        {emoji}
                      </button>
                    ))
                  }

                  {
                    msg.reaction && (

                      <span
                        style={{
                          marginLeft:
                            "10px",

                          fontSize:
                            "20px",
                        }}
                      >
                        {msg.reaction}
                      </span>
                    )
                  }

                </div>

                {/* FILE */}

                {
                  msg.fileUrl && (

                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >

                      {
                        msg.fileUrl.includes(".png")
                        ||
                        msg.fileUrl.includes(".jpg")
                        ||
                        msg.fileUrl.includes(".jpeg")

                        ? (

                          <img
                            src={msg.fileUrl}
                            alt="uploaded"
                            width="200"
                          />

                        ) : (

                          <div>
                            📁 Open File
                          </div>
                        )
                      }

                    </a>
                  )
                }

                {/* AUDIO */}

                {
                  msg.audioUrl && (

                    <audio
                      controls
                      style={{
                        marginTop: "10px",
                        width: "100%",
                      }}
                    >

                      <source
                        src={msg.audioUrl}
                        type="audio/webm"
                      />

                    </audio>
                  )
                }

                {/* STATUS */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",

                    marginTop: "8px",

                    fontSize: "12px",

                    opacity: 0.8,
                  }}
                >

                  <span>
                    {msg.time}
                  </span>

                  {
                    msg.username ===
                    localStorage.getItem(
                      "username"
                    ) && (

                      <span>

                        {
                          msg.status ===
                          "seen"

                            ? "👀 Seen"

                            : "✔ Sent"
                        }

                      </span>
                    )
                  }

                </div>

              </div>
            ))}

          <div ref={messagesEndRef}>
          </div>

        </div>

        {/* TYPING */}

        <p className="typing-text">
          {typingUser}
        </p>

        {/* EMOJI PICKER */}

        {
          showEmoji && (

            <div className="emoji-picker">

              <EmojiPicker
                onEmojiClick={
                  onEmojiClick
                }
              />

            </div>
          )
        }

        {/* INPUT AREA */}

        <div className="input-area">

          <button
            className="emoji-btn"

            onClick={() =>
              setShowEmoji(
                !showEmoji
              )
            }
          >
            😀
          </button>

          <input
            type="file"

            onChange={(e) =>
              setSelectedFile(
                e.target.files[0]
              )
            }
          />

          <input
            type="text"

            placeholder=
              "Type a message..."

            value={message}

            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {

                sendMessage();
              }
            }}

            onChange={(e) => {

              setMessage(
                e.target.value
              );

              socket.emit(
                "typing",

                localStorage.getItem(
                  "username"
                )
              );
            }}
          />

          <button
            onClick={
              startRecording
            }
          >
            🎤
          </button>

          <button
            onClick={
              stopRecording
            }
          >
            ⏹
          </button>

          <button
            onClick={sendMessage}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

export default Chat;