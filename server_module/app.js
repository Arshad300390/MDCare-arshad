const express = require("express");
const http = require("http");
const socketIo = require('socket.io');
const cors = require("cors");
require("dotenv").config();
require("./models/db");

// Route imports
const userRouter = require("./routes/user");
const schoolRouter = require("./routes/school");
const articleRouter = require("./routes/article");
const consultantRoutes = require("./routes/consultant");
const videoRoutes = require("./routes/video");
const kidsRoutes = require("./routes/kidRoutes");
const consultantChatRoutes = require("./routes/consultantChatRoutes");
const schoolChatRoutes = require("./routes/schoolChatRoutes");
const { activeUsers} = require('./socketManager');
const eventsRoutes = require("./routes/eventRoutes");
const countRoute = require("./routes/adminCountRoute");
const { initializeSocket } = require("./socket");
const app = express();
//new code

const server = http.createServer(app);
const io = initializeSocket(server);




// io.on("connection", (socket) => {
//   console.log("🔌 New client connected:", socket.id);

//   socket.on("joinChat", ({ userId }) => {
//     if (!activeUsers.has(userId)) {
//       activeUsers.set(userId, new Set());  // Store multiple sockets
//     }
//     activeUsers.get(userId).add(socket.id);
//     console.log(`✅ User ${userId} joined. Socket ID: ${socket.id}`);
//   });

//   socket.on("disconnect", () => {
//     for (let [userId, socketId] of activeUsers) {
//       if (socketId === socket.id) {
//         activeUsers.delete(userId);
//         console.log(`❌ User ${userId} disconnected.`);
//         break;
//       }
//     }
//   });
// });

// Export io instance
//module.exports = {app, server, io };



// Middleware to parse JSON
app.use(express.json());
app.use(cors());

// Register API routes
app.use("/api/auth", userRouter);
app.use("/api/school", schoolRouter);
app.use("/api/article", articleRouter);
app.use("/api/consultant", consultantRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/kid", kidsRoutes);
app.use("/api/consultantChat", consultantChatRoutes);
app.use("/api/schoolChat", schoolChatRoutes);
app.use("/api/event", eventsRoutes);
app.use("/api/admin", countRoute);
// Test route
app.get("/test", (req, res) => {
  res.send("Hello world");
});

// Default route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to backend zone!" });
});

// ✅ Start the server
const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server is listening on port ${PORT}`);
// });
server.listen(PORT, '0.0.0.0',() => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});

module.exports = { app, server, io };