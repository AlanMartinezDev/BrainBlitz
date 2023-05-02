const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);
const fs = require("fs");

app.use(express.static("public"));

const players = new Map();
let preguntas = [];

fs.readFile("preguntas.json", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  preguntas = JSON.parse(data);
  console.log("Preguntas cargadas:", preguntas);
});

io.on("connection", (socket) => {
  console.log(`Jugador anónimo ${socket.id} conectado.`);

  socket.on("join", ({ nickname }, callback) => {
    console.log(`El jugador ${nickname} se ha unido.`);

    if (players.has(nickname)) {
      callback({
        status: "error",
        message: "El nombre de usuario ya está en uso.",
      });
    } else {
      players.set(nickname, { id: socket.id, name: nickname, score: 0 });
      io.emit("players", Array.from(players.values()));
      if (players.size === 1) {
        startGame();
      }
      callback({ status: "success" });
    }
  });

  socket.on("answer", ({ nickname, question, answer }) => {
    const player = players.get(nickname);
    if (player) {
      const questionObj = preguntas[question];
      const answerObj = questionObj.answers[answer];
      if (answerObj.correct) {
        player.score += questionObj.time;
        io.emit("players", Array.from(players.values())); // Emit the players event to update the score
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`El jugador anónimo ${socket.id} se ha desconectado.`);
    players.forEach((player, nickname) => {
      if (player.id === socket.id) {
        players.delete(nickname);
        io.emit("players", Array.from(players.values()));
      }
    });
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
    const questionObj = preguntas[questionIndex];
    remainingTime = questionObj.time;
    io.emit("question", {
      index: questionIndex,
      text: questionObj.text,
      answers: questionObj.answers,
      time: remainingTime,
    });
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
  const sortedPlayers = Array.from(players.values()).sort(
    (a, b) => b.score - a.score
  );
  const winners = [];
  let maxScore = sortedPlayers[0].score;
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (sortedPlayers[i].score === maxScore) {
      winners.push(sortedPlayers[i].name);
    } else {
      break;
    }
  }
  io.emit("winners", winners);
}
httpServer.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});
