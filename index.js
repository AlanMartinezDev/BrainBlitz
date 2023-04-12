const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const fs = require("fs");

app.use(express.static("public"));

let preguntas = [];

fs.readFile("preguntas.json", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  preguntas = JSON.parse(data);
  console.log("Preguntas cargadas:", preguntas);
});

let players = [];

io.on("connection", (socket) => {
  console.log(`Jugador anónimo ${socket.id} conectado.`);

  socket.on("join", ({ nickname }, callback) => {
    console.log(`El jugador ${nickname} se ha unido.`);

    if (players.some((player) => player.name === nickname)) {
      callback({ status: "error", message: "El nombre de usuario ya está en uso." });
    } else {
      players.push({ id: socket.id, name: nickname, score: 0 });
      io.emit("players", players);
      if (players.length === 1) {
        startGame();
      }
      callback({ status: "success" });
    }
  });

  socket.on("answer", (data) => {
    //console.log(`${data.nickname} ha respondido: ${data.answer}.`);
    let player = players.find((p) => p.name === data.nickname);
    if (player) {
      let question = preguntas[data.question];
      let answer = question.answers[data.answer];
      if (answer.correct) {
        player.score += question.time;
        io.emit("players", players); // Emit the players event to update the score
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`El jugador anónimo ${socket.id} se ha desconectado.`);
    players = players.filter((p) => p.id !== socket.id);
    io.emit("players", players);
  });
});

function startGame() {
  let questionIndex = 0;
  let remainingTime = 0;
  let intervalId = setInterval(() => {
    if (questionIndex >= preguntas.length) {
      clearInterval(intervalId);
      endGame();
      return;
    }
    let question = preguntas[questionIndex];
    remainingTime = question.time;
    io.emit("question", { index: questionIndex, text: question.text, answers: question.answers, time: remainingTime });
    questionIndex++;
    let questionTimerId = setInterval(() => {
      if (remainingTime <= 0) {
        clearInterval(questionTimerId);
        io.emit("questionEnd", {});
        return;
      }
      remainingTime--;
    }, 1000);
  }, 11000);
}

function endGame() {
  console.log("Juego finalizado.");
  players.sort((a, b) => b.score - a.score);
  let winners = players.filter((p) => p.score === players[0].score);
  let winnerNames = winners.map((w) => w.name);
  io.emit("winners", winnerNames);
}

httpServer.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});