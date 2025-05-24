const socketIo = require("socket.io");
const { sendFCMMessage } = require("./services/firebaseMessaging");

let io; // global Socket.IO instance
const users = {}; // Maps userId to { socketId, fcmToken }

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Replace with your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const callerId = socket.handshake.query?.callerId;
    const fcmToken = socket.handshake.query?.fcmToken;

    if (callerId) {
      users[callerId] = {
        socketId: socket.id,
        fcmToken,
      };
      socket.data.userId = callerId; // Save to socket context
      console.log(`✅ User connected: ${callerId}, Socket ID: ${socket.id}`);
    } else {
      console.warn("⚠️ Connection attempt without callerId");
      socket.disconnect(true);
      return;
    }

    // 📞 Call initiated
    socket.on("call", async ({ calleeId, rtcMessage, roomId }) => {
      console.log(`📞 ${callerId} is calling ${calleeId} for room ${roomId}`);

      const callee = users[calleeId];
      if (callee?.socketId) {
        io.to(callee.socketId).emit("newCall", {
          callerId,
          rtcMessage,
          roomId,
        });
        console.log(`➡️ Emitted newCall to ${calleeId}`);
      }

      // 🔔 Send FCM notification if user is not connected
      if (callee?.fcmToken) {
        try {
          await sendFCMMessage(callee.fcmToken, {
            title: "Incoming Call",
            body: `You have a call from ${callerId}`,
            callerId,
            roomId,
            type: "call",
            rtcMessage: JSON.stringify(rtcMessage),
          });
          console.log(`✅ FCM notification sent to ${calleeId}`);
        } catch (err) {
          console.error("❌ FCM error:", err.message);
        }
      }
    });

    // ✅ Answer call
    socket.on("answerCall", ({ callerId, rtcMessage, roomId }) => {
      const caller = users[callerId];
      if (caller?.socketId) {
        io.to(caller.socketId).emit("callAnswered", { rtcMessage, roomId });
        console.log(`✅ ${callerId} received callAnswered`);
      }
    });

    // ❄️ ICE Candidate
    socket.on("ICEcandidate", ({ calleeId, rtcMessage }) => {
      const callee = users[calleeId];
      if (callee?.socketId) {
        io.to(callee.socketId).emit("ICEcandidate", { rtcMessage });
      }
    });

    // 🚫 End Call
    socket.on("endCall", ({ calleeId, roomId }) => {
      const callerId = socket.data.userId;
      const callerSocketId = users[callerId]?.socketId;
      const calleeSocketId = users[calleeId]?.socketId;

      console.log(`🚫 Ending call between ${callerId} and ${calleeId} for room ${roomId}`);

      if (calleeSocketId) {
        io.to(calleeSocketId).emit("callEnded", { roomId });
      }
      if (callerSocketId) {
        io.to(callerSocketId).emit("callEnded", { roomId });
      }
    });

    // ❌ Disconnect
    socket.on("disconnect", () => {
      const disconnectedUserId = socket.data.userId;
      if (disconnectedUserId && users[disconnectedUserId]) {
        delete users[disconnectedUserId];
        console.log(`❌ User disconnected: ${disconnectedUserId}`);
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initializeSocket first.");
  }
  return io;
};

module.exports = { initializeSocket, getIo };
