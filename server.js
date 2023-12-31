const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"], // Add the necessary methods
  },
});

app.use(cors({ origin: "http://localhost:3001" }));

app.use(express.static(path.join(__dirname, "public")));

const users = {}; // Maintain a list of users

// Run when client connects
io.on("connection", (socket) => {
  // Assign a user ID to the socket
  users[socket.id] = { id: socket.id };

  // Welcome current user
  socket.emit("message", "Welcome to ChatCord!");

  // Notify everyone in the chat room when a user joins
  io.emit("message", "A user has joined the chat");

  // Send a list of users to everyone
  io.emit("users", Object.values(users));

  // Handle messages
  socket.on("chatMessage", (msg) => {
    io.emit("message", { user: socket.id, text: msg });
  });

  // Function to generate a random color
  const generateRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Function to emit a valid color every 10 seconds
  const sendValidColor = () => {
    const validColor = generateRandomColor();
    io.emit("validColor", validColor); // Emit the color to all connected clients
  };

  // Set an interval to update the valid color every 10 seconds
  const interval = setInterval(() => {
    sendValidColor();
  }, 3000); // 10 seconds interval

  // Handle disconnect
  socket.on("disconnect", () => {
    // Remove the user from the list when they disconnect
    delete users[socket.id];
    // Notify everyone that a user has left the chat
    io.emit("message", "A user has left the chat");
    // Update the user list for everyone
    io.emit("users", Object.values(users));

    // Stop the interval when the socket disconnects

    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
