const socket = io();

const sendButton = document.querySelector("#sendButton");
const nicknameInput = document.querySelector("#nicknameInput");
const game = document.querySelector("#game");
const questionElement = document.querySelector("#question");
const answersElement = document.querySelector("#answers");
const leaderboardTableContainer = document.querySelector(
  "#leaderboardTableContainer"
);
const tiempoRestante = document.querySelector("#tiempoRestante");
const startContainer = document.querySelector("#startContainer");
const timerElement = document.querySelector("#timer");
const pointsElement = document.querySelector("#points");
const leaderboardTableBody = document.querySelector("#leaderboardTable tbody");

sendButton.addEventListener("click", () => {
  const nickname = nicknameInput.value;
  if (!nickname) {
    return;
  }

  socket.emit("join", { nickname }, ({ status, message }) => {
    if (status === "error") {
      alert(message);
    } else {
      sendButton.disabled = true;
      nicknameInput.disabled = true;
      leaderboardTableContainer.style.display = "inline-table";
      game.style.display = "block";
      tiempoRestante.style.display = "block";
      startContainer.style.display = "none";
    }
  });
});

const disableAnswerButtons = () => {
  const buttons = answersElement.querySelectorAll("button");
  for (const button of buttons) {
    button.disabled = true;
  }
};

const enableAnswerButtons = () => {
  const buttons = answersElement.querySelectorAll("button");
  for (const button of buttons) {
    button.disabled = false;
  }
};

const displayQuestion = (question) => {
  questionElement.textContent = question.text;
  answersElement.textContent = "";

  let remainingTime = question.time;
  timerElement.textContent = remainingTime;
  const intervalId = setInterval(() => {
    remainingTime--;
    if (remainingTime < 0) {
      clearInterval(intervalId);
      disableAnswerButtons();
    } else {
      timerElement.textContent = remainingTime;
    }
  }, 1000);

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.className = "btn btn-danger btn-lg my-2 w-100";
    button.onclick = () => {
      socket.emit("answer", {
        nickname: nicknameInput.value,
        question: question.index,
        answer: index,
      });
      clearInterval(intervalId);
      disableAnswerButtons();
    };
    answersElement.appendChild(button);
  });
};

socket.on("question", (data) => {
  if (data.allAnswered) {
    displayNextQuestion(data);
  } else {
    displayQuestion(data);
    enableAnswerButtons();
  }
});

socket.on("players", (players) => {
  leaderboardTableBody.innerHTML = ""; // Limpiar tabla de clasificación

  players.sort((a, b) => b.score - a.score);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const row = document.createElement("tr");
    row.innerHTML = `<th scope="row">${i + 1}</th><td>${player.name}</td><td>${
      player.score
    }</td>`;
    leaderboardTableBody.appendChild(row);
  }

  const player = players.find((p) => p.name === nicknameInput.value);
  if (player) {
    pointsElement.textContent = player.score;
  } else {
    pointsElement.textContent = "0";
  }

  socket.on("winners", (winners) => {
    questionElement.textContent =
      "Juego finalizado. Espero que hayáis disfrutado del juego y aprendido algo nuevo en el camino.";
    const winnerText = winners.length === 1 ? "Ganador: " : "Ganadores: ";
    answersElement.textContent = winnerText + winners.join(", ");
    tiempoRestante.style.display = "none";
  });
});
