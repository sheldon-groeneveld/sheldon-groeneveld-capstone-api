import express from "express";
import cors from "cors";
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
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.get("/", (_req, res) => {
  res.send("<h1>Hello World</h1>");
});

io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log("a user joined room: ", data);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("recieve_message", data);
  });
});

server.listen(PORT, () => {
  console.log(`app running at ${BACKEND_URL}${PORT}`);
});
