import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import {
  FiSearch,
  FiSun,
  FiMoon,
  FiLogOut,
  FiPaperclip,
  FiSmile,
  FiMic,
  FiSquare,
  FiSend,
  FiMessageSquare,
  FiCheck,
  FiEye,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { socket } from "../socket/socket";
import { BACKEND_URL } from "../config";

function Chat() {
  const navigate = useNavigate();

  const [currentUsername] = useState(() => localStorage.getItem("username") || "");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /* FETCH ALL REGISTERED USERS FROM DB */
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/users`);
      setAllUsers(res.data);
    } catch (err) {
      console.log("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* NOTIFICATION PERMISSION */
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* SOCKET CONNECT & EVENTS */
  useEffect(() => {
    if (!currentUsername) return;

    const emitJoin = () => {
      socket.emit("join", currentUsername);
    };

    // If socket is already connected when component mounts
    if (socket.connected) {
      emitJoin();
    }

    // Re-emit join on socket connect / auto-reconnect
    socket.on("connect", emitJoin);

    /* RECEIVE MESSAGE */
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);

      if (
        Notification.permission === "granted" &&
        data.username !== currentUsername
      ) {
        new Notification(`${data.username}`, {
          body: data.message || "Sent an attachment / voice message",
        });
      }
    });

    /* ONLINE USERS LIST */
    socket.on("online_users", (users) => {
      setOnlineUsers(users || []);
    });

    /* TYPING */
    socket.on("typing", (username) => {
      if (username !== currentUsername) {
        setTypingUser(`${username} is typing...`);
        setTimeout(() => {
          setTypingUser("");
        }, 2000);
      }
    });

    /* OLD MESSAGES */
    socket.on("old_messages", (msgs) => {
      setMessages(msgs || []);
    });

    /* SEEN STATUS */
    socket.on("message_seen_update", (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "seen" } : msg
        )
      );
    });

    /* REACTION UPDATE */
    socket.on("reaction_updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return () => {
      socket.off("connect", emitJoin);
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("typing");
      socket.off("old_messages");
      socket.off("message_seen_update");
      socket.off("reaction_updated");
    };
  }, [currentUsername]);

  /* AUTO SCROLL */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* AUTO SEEN */
  useEffect(() => {
    if (!currentUsername) return;

    messages.forEach((msg) => {
      if (
        msg.to === currentUsername &&
        msg.status !== "seen"
      ) {
        socket.emit("message_seen", msg._id);
      }
    });
  }, [messages, currentUsername]);

  /* SEND MESSAGE */
  const sendMessage = async () => {
    if (message.trim() === "" && !selectedFile) return;

    if (!selectedUser) {
      alert("Please select a contact from the left sidebar to start chatting.");
      return;
    }

    let fileUrl = "";

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const res = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        fileUrl = data.fileUrl;
      } catch (error) {
        console.log(error);
        alert("File upload failed. Please try again.");
        return;
      }
    }

    socket.emit("send_message", {
      username: currentUsername,
      message,
      to: selectedUser,
      fileUrl,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setMessage("");
    setSelectedFile(null);
    setShowEmoji(false);
  };

  /* EMOJI CLICK */
  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  /* AUDIO RECORDING */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        try {
          const res = await fetch(`${BACKEND_URL}/api/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          socket.emit("send_message", {
            username: currentUsername,
            message: "🎤 Voice Message",
            to: selectedUser,
            audioUrl: data.fileUrl,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        } catch (err) {
          console.log(err);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not supported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  // Filter out current logged in user from all registered users list
  const otherUsers = allUsers.filter((u) => u.username !== currentUsername);
  const activeOnlineCount = onlineUsers.filter((u) => u !== currentUsername).length;

  return (
    <div className={`chat-container ${darkMode ? "dark-theme" : ""}`}>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {currentUsername ? currentUsername.charAt(0).toUpperCase() : "?"}
              <span className="online-dot" />
            </div>
            <div className="user-info">
              <span className="username">{currentUsername}</span>
              <span className="user-status">Online</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              title="Toggle Theme"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <button
              className="icon-btn logout-btn"
              title="Log Out"
              onClick={handleLogout}
            >
              <FiLogOut />
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* USERS LIST HEADER */}
        <div className="sidebar-users-header">
          <span className="section-title">Contacts</span>
          <span className="online-badge-count">
            {activeOnlineCount} Online
          </span>
        </div>

        <div className="users-list">
          {otherUsers.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              No other contacts registered yet. Create another user account to start chatting!
            </div>
          ) : (
            otherUsers
              .filter((u) => u.username.toLowerCase().includes(searchText.toLowerCase()))
              .map((u) => {
                const isOnline = onlineUsers.includes(u.username);
                return (
                  <div
                    key={u._id || u.username}
                    className={`user-item ${selectedUser === u.username ? "active" : ""}`}
                    onClick={() => setSelectedUser(u.username)}
                  >
                    <div className={`user-item-avatar ${!isOnline ? "offline-avatar" : ""}`}>
                      {u.username.charAt(0).toUpperCase()}
                      <span
                        className="online-dot"
                        style={{ backgroundColor: isOnline ? "var(--online-color)" : "var(--offline-color)" }}
                      />
                    </div>
                    <div className="user-item-info">
                      <div className="user-item-name">{u.username}</div>
                      <div className={`user-item-status-text ${isOnline ? "online-text" : ""}`}>
                        {isOnline ? "Active Now" : "Offline"}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* MAIN CHAT WINDOW */}
      <div className="chat-main">
        {!selectedUser ? (
          <div className="no-chat-selected">
            <div className="empty-chat-illustration">
              <FiMessageSquare />
            </div>
            <h3>Your Messages</h3>
            <p>Select a contact from the sidebar on the left to start a real-time conversation.</p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <div className="chat-header">
              <div className="chat-header-user">
                <div className="avatar-circle">
                  {selectedUser.charAt(0).toUpperCase()}
                  <span
                    className="online-dot"
                    style={{
                      backgroundColor: onlineUsers.includes(selectedUser)
                        ? "var(--online-color)"
                        : "var(--offline-color)",
                    }}
                  />
                </div>
                <div className="chat-header-info">
                  <h3>{selectedUser}</h3>
                  <p>
                    <span
                      className="online-dot"
                      style={{
                        position: "static",
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        backgroundColor: onlineUsers.includes(selectedUser)
                          ? "var(--online-color)"
                          : "var(--offline-color)",
                      }}
                    />{" "}
                    {onlineUsers.includes(selectedUser) ? "Active Now" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="chat-header-actions">
                <input
                  type="text"
                  className="chat-search-input"
                  placeholder="Filter messages..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {/* MESSAGES */}
            <div className="messages-container">
              {messages
                .filter(
                  (msg) =>
                    ((msg.username === selectedUser && msg.to === currentUsername) ||
                      (msg.username === currentUsername && msg.to === selectedUser)) &&
                    (!searchText || msg.message?.toLowerCase().includes(searchText.toLowerCase()))
                )
                .map((msg, index) => {
                  const isMine = msg.username === currentUsername;
                  return (
                    <div
                      key={msg._id || index}
                      className={`message-group ${isMine ? "my-message" : "other-message"}`}
                    >
                      <span className="sender-name">{isMine ? "You" : msg.username}</span>

                      <div className="message-bubble">
                        {msg.message}

                        {/* FILE ATTACHMENT */}
                        {msg.fileUrl && (
                          <div className="message-attachment">
                            {msg.fileUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                              <img
                                src={msg.fileUrl}
                                alt="attachment"
                                className="message-image-preview"
                                onClick={() => window.open(msg.fileUrl, "_blank")}
                              />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="message-file-card"
                              >
                                <FiFileText size={18} /> Open Shared File
                              </a>
                            )}
                          </div>
                        )}

                        {/* AUDIO MESSAGE */}
                        {msg.audioUrl && (
                          <audio controls className="message-audio-player">
                            <source src={msg.audioUrl} type="audio/webm" />
                          </audio>
                        )}
                      </div>

                      {/* QUICK EMOJI REACTIONS */}
                      <div className="message-actions-bar">
                        {["❤️", "😂", "👍", "🔥"].map((emoji) => (
                          <button
                            key={emoji}
                            className="reaction-btn-quick"
                            onClick={() =>
                              socket.emit("add_reaction", {
                                messageId: msg._id,
                                reaction: emoji,
                              })
                            }
                          >
                            {emoji}
                          </button>
                        ))}
                        {msg.reaction && (
                          <span className="applied-reaction-badge">{msg.reaction}</span>
                        )}
                      </div>

                      {/* MESSAGE META / STATUS */}
                      <div className="message-meta">
                        <span>{msg.time}</span>
                        {isMine && (
                          <span>
                            {msg.status === "seen" ? (
                              <span className="status-seen" title="Seen"><FiEye /> Seen</span>
                            ) : (
                              <span className="status-sent" title="Sent"><FiCheck /> Sent</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* TYPING INDICATOR */}
            {typingUser && <div className="typing-indicator-bar">{typingUser}</div>}

            {/* EMOJI PICKER OVERLAY */}
            {showEmoji && (
              <div className="emoji-picker-container">
                <EmojiPicker onEmojiClick={onEmojiClick} theme={darkMode ? "dark" : "light"} />
              </div>
            )}

            {/* CHAT INPUT AREA */}
            <div className="chat-input-container">
              {selectedFile && (
                <div className="file-preview-chip">
                  <FiFileText /> {selectedFile.name}
                  <button onClick={() => setSelectedFile(null)}><FiX /></button>
                </div>
              )}

              <div className="chat-input-bar">
                <button
                  type="button"
                  className="input-action-btn"
                  title="Add Attachment"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiPaperclip />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />

                <button
                  type="button"
                  className="input-action-btn"
                  title="Emoji"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <FiSmile />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${selectedUser}...`}
                  value={message}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    socket.emit("typing", currentUsername);
                  }}
                />

                {isRecording ? (
                  <button
                    type="button"
                    className="input-action-btn recording-active-btn"
                    title="Stop Recording"
                    onClick={stopRecording}
                  >
                    <FiSquare />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="input-action-btn"
                    title="Record Voice Note"
                    onClick={startRecording}
                  >
                    <FiMic />
                  </button>
                )}

                <button
                  type="button"
                  className="send-message-btn"
                  onClick={sendMessage}
                >
                  <FiSend /> Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;