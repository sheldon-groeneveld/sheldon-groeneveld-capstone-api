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
  res.send("<h1>Hello World</h1>");
});

// let users = [];
// let openRooms = [];
let game = {};

io.on("connection", (socket) => {
  socket.on("create_room", (room) => {
    // openRooms.push(room);
    if (!game[room]) {
      game[room] = { users: [], answers: [], voteCount: 0 };
      // console.log(game);
    }
  });

  socket.on("check_room", (room) => {
    let roomExists = `${room}` in game;
    socket.emit("room_verified", roomExists);
  });

  socket.on("join_room", ({ room, nickname, id }) => {
    // if (users.find((user) => user.id === id)) {
    //   const oldRoom = users.find((user) => {
    //     return user.id === id;
    //   }).room;
    //   users.splice(
    //     users.findIndex((user) => user.id === id),
    //     1
    //   );
    //   const usersInOldRoom = users.filter((user) => user.room === oldRoom);
    //   io.to(oldRoom).emit("lobby_list", usersInOldRoom);
    // }
    if (!game[room].users.includes(nickname) && game[room].users.length < 6) {
      socket.join(room);
      // users.push({ nickname: nickname, id: id, room: room });
      game[room].users.push(nickname);
      // console.log(game);
      // const usersInRoom = users.filter((user) => user.room === room);
      io.to(room).emit("lobby_list", game[room].users);
    }
  });

  socket.on("start_game", (room) => {
    io.to(room).emit("game_start");
  });

  socket.on("get_users", (room) => {
    io.to(room).emit("users_get", game[room].users);
  });

  socket.on("send_answer", ({ room, payload }) => {
    // console.log("answer from client: ", answer);
    game[room].answers.push(payload);
    // console.log(game[room].answers);
    if (game[room].answers.length === game[room].users.length) {
      io.to(room).emit("recieve_answer", shuffle(game[room].answers));
    }
  });

  socket.on("send_vote", ({ room, nickname, vote }) => {
    game[room].answers
      .find((answer) => answer.answer === vote)
      .voters.push(nickname);
    // console.log(game[room].answers);
    game[room].voteCount++;
    if (game[room].voteCount === game[room].users.length) {
      io.to(room).emit("show_results", game[room].answers);
    }
  });

  // socket.on("request_answers", (room) =>
  //   io.to(room).emit("recieve_answer", shuffle(game[room].answers))
  // );

  // socket.on("disconnect", () => {
  //   users = users.filter((id) => id === socket.id);
  // });
});

server.listen(PORT, () => {
  console.log(`app running at ${BACKEND_URL}${PORT}`);
});
