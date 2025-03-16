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
  console.log(`a user connected: ${socket.id}`);
  users.push(socket.id);
  console.log(users);

  socket.on("create_room", (roomCode) => {
    openRooms.push(roomCode);
    console.log(openRooms);
  });

  socket.on("check_room", ({ room, id }) => {
    console.log(room, id);
    roomExists = openRooms.includes(room);
    socket.emit("room_verified", roomExists);
  });

  socket.on("join_room", (roomCode) => {
    socket.join(roomCode);
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
