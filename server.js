import express from "express";
import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { shuffle } from "./shuffle.js";

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
  res.send("<h1>Welcome to the 'Balderdash - Beyond Pen and Paper' API</h1>");
});

let game = {};
let activeUsers = [];

io.on("connection", (socket) => {
  let newUser = { id: socket.id, username: "", room: "" };
  socket.on("create_room", (room) => {
    if (!game[room]) {
      game[room] = { users: [], answers: [], voteCount: 0, isOpen: true };
    }
  });

  socket.on("check_room", (room) => {
    let roomExists = `${room}` in game;
    if (roomExists) {
      socket.emit("room_verified", {
        roomExists: roomExists,
        roomIsOpen: game[room].isOpen,
      });
    } else {
      socket.emit("room_verified", {
        roomExists: roomExists,
        roomIsOpen: false,
      });
    }
  });

  socket.on("join_room", ({ room, nickname }) => {
    if (!game[room].users.includes(nickname) && game[room].users.length < 6) {
      socket.join(room);
      newUser = { ...newUser, username: nickname, room: room };
      activeUsers.push(newUser);
      game[room].users.push(nickname);
      io.to(room).emit("lobby_list", game[room].users);
    }
  });

  socket.on("start_game", (room) => {
    game[room].isOpen = false;
    io.to(room).emit("game_start");
  });

  socket.on("get_users", (room) => {
    io.to(room).emit("users_get", game[room].users);
  });

  socket.on("send_answer", ({ room, payload }) => {
    game[room].answers.push(payload);
    if (game[room].answers.length === game[room].users.length) {
      io.to(room).emit("recieve_answer", shuffle(game[room].answers));
    }
  });

  socket.on("send_vote", ({ room, nickname, vote }) => {
    game[room].answers
      .find((answer) => answer.answer === vote)
      .voters.push(nickname);
    game[room].voteCount++;
    if (game[room].voteCount === game[room].users.length) {
      io.to(room).emit("show_results", game[room].answers);
    }
  });

  socket.on("reset_room", ({ room }) => {
    game[room].answers = [];
    game[room].voteCount = 0;
    io.to(room).emit("room_reset", game[room].answers);
  });

  socket.on("disconnect", () => {
    let disconnectedUser = activeUsers.find((user) => user.id === socket.id);
    activeUsers = activeUsers.filter((user) => user.id !== socket.id);
    if (disconnectedUser && disconnectedUser.room) {
      game[disconnectedUser.room].users.splice(
        game[disconnectedUser.room].users.indexOf(disconnectedUser.username),
        1
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(`app running at ${BACKEND_URL}${PORT}`);
});
