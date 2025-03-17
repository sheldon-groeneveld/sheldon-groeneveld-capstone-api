import express from "express";
import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5050;
const BACKEND_URL = process.env.BACKEND_URL;

app.get("/", (_req, res) => {
  res.send("<h1>Hello World</h1>");
});

let users = [];
let openRooms = [];

io.on("connection", (socket) => {
  socket.on("create_room", (room) => {
    openRooms.push(room);
  });

  socket.on("check_room", (room) => {
    let roomExists = openRooms.includes(room);
    socket.emit("room_verified", roomExists);
  });

  socket.on("join_room", ({ room, nickname, id }) => {
    if (users.find((user) => user.id === id)) {
      users.splice(
        users.findIndex((user) => user.id === id),
        1
      );
    }

    socket.join(room);
    users.push({ nickname: nickname, id: id, room: room });
    let usersInRoom = users.filter((user) => user.room === room);
    io.to(room).emit("lobby_list", usersInRoom);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("recieve_message", data);
  });

  socket.on("disconnect", () => {
    users = users.filter((id) => id === socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`app running at ${BACKEND_URL}${PORT}`);
});
