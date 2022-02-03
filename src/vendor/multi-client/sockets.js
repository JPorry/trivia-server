const { Server } = require("socket.io");

module.exports = function createSockets({ server, options, debug = false }) {
  const io = new Server(server, options);

  io.on("connection", (socket) => {
    if (debug) {
      console.log("[Socket.io] Client connection");
    }

    socket.on("sendMessage", ({ room, message } = {}) => {
      if (debug) {
        console.log(`[Socket.io] "sendMessage" on ${room}`, message);
      }

      io.to(room).emit("receiveMessage", message);
    });

    socket.on("joinRoom", ({ room }) => {
      console.log(`[Socket.io] "joinRoom"`, room);

      socket.join(room);
    });

    socket.on("leaveRoom", ({ room }) => {
      console.log(`[Socket.io] "leaveRoom"`, room);

      socket.leave(room);
    });
  });

  return io;
};
