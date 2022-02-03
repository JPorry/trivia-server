const createSockets = require("./vendor/multi-client/sockets");
const { server } = require("./server");

const io = createSockets({
  server,
  debug: true,
  options: {
    cors: {
      origin: "*",
    },
  },
});

// Arbitrary data about each room.
const roomState = {};

function incrementCount(roomName, countKey = "count") {
  if (roomState[roomName] === undefined) {
    roomState[roomName] = {
      [countKey]: 0,
    };
  }

  if (
    roomState[roomName][countKey] === undefined ||
    Number.isNaN(roomState[roomName][countKey])
  ) {
    roomState[roomName][countKey] = 1;
  } else {
    roomState[roomName][countKey] += 1;
  }
}

function decrementCount(roomName, countKey = "count") {
  if (roomState[roomName] === undefined) {
    roomState[roomName] = {
      [countKey]: 0,
    };
  }

  if (
    roomState[roomName][countKey] === undefined ||
    Number.isNaN(roomState[roomName][countKey])
  ) {
    roomState[roomName][countKey] = 0;
  } else {
    roomState[roomName][countKey] = Math.max(
      0,
      roomState[roomName][countKey] - 1
    );
  }
}

// TODO: handle disconnects more robustly.
// If the mobile device disconnects, that is a bigger deal
// than if the TV disconnects.
//
// ALSO: store state here on whether or not the mobile phone is connected.
//
// LASTLY: maybe have an idea of a "primary" mobile phone (representing the
// qual participant). That way, if someone else signs in accidentally it
// doesn't mess things up? Not sure...worth thinking more about.
//

io.on("connection", (socket) => {
  let currentRoom;
  let isController = false;
  let isClient = false;

  socket.on("joinRoom", ({ room }) => {
    currentRoom = room;
    incrementCount(currentRoom);

    console.log("updated room1", currentRoom, roomState[currentRoom]);

    io.to(room).emit("roomUpdate", roomState[room]);
  });

  socket.on("leaveRoom", ({ room }) => {
    if (currentRoom) {
      decrementCount(currentRoom);

      if (isController) {
        decrementCount(currentRoom, "controllerCount");
      } else if (isClient) {
        decrementCount(currentRoom, "clientCount");
      }

      console.log("updated room2", currentRoom, roomState[currentRoom]);

      io.to(currentRoom).emit("roomUpdate", roomState[currentRoom]);
    }

    currentRoom = null;
  });

  // TODO: should the room be cleared here?
  socket.on("disconnecting", () => {
    if (currentRoom) {
      decrementCount(currentRoom);
      if (isController) {
        decrementCount(currentRoom, "controllerCount");
      } else if (isClient) {
        decrementCount(currentRoom, "clientCount");
      }

      console.log("updated room3", currentRoom, roomState[currentRoom]);

      io.to(currentRoom).emit("roomUpdate", roomState[currentRoom]);
    }

    io.to(currentRoom).emit("userDisconnected");
  });

  socket.on("sendMessage", (msg) => {
    const roomName = msg.room;

    console.log("[msg received]", msg);

    if (msg.room && msg.message.type === "controllerConnection") {
      isController = true;
      incrementCount(roomName, "controllerCount");

      console.log("updated room4", roomName, roomState[roomName]);

      io.to(roomName).emit("roomUpdate", roomState[roomName]);
    }

    if (msg.room && msg.message.type === "clientConnected") {
      isClient = true;
      incrementCount(roomName, "clientCount");

      console.log("updated room4", roomName, roomState[roomName]);

      io.to(roomName).emit("roomUpdate", roomState[roomName]);
    }
  });
});
