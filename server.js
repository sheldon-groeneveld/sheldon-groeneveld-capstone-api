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
  users.push(socket.id);

  socket.on("create_room", (room) => {
    openRooms.push(room);
  });

  socket.on("check_room", ({ room, id }) => {
    let roomExists = openRooms.includes(room);
    socket.emit("room_verified", roomExists);
  });

  socket.on("join_room", ({ room, id }) => {
    socket.join(room);
    io.to(room).emit("lobby_list", id);
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
