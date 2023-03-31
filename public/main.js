const socket = io();

const sendButton = document.getElementById("sendButton");
const nicknameInput = document.getElementById("nicknameInput");
const game = document.getElementById("game");
const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");
const restartButton = document.getElementById("restartButton");

sendButton.addEventListener("click", () => {
  const nickname = nicknameInput.value;
  if (!nickname) {
    return;
  }

  socket.emit("join", { nickname }, (response) => {
    if (response.status === "error") {
      alert(response.message);
    } else {
      sendButton.disabled = true;
      nicknameInput.disabled = true;
      game.style.display = "block";
    }
  });
});

function displayQuestion(question) {
  questionElement.textContent = question.text;
  answersElement.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.onclick = () => {
      socket.emit("answer", { nickname: nicknameInput.value, question: question.index, answer: index });
      disableAnswerButtons();
    };
    answersElement.appendChild(button);
  });
}

socket.on("question", (data) => {
  displayQuestion(data);
  enableAnswerButtons();
});

const pointsElement = document.getElementById("points");

socket.on("players", (players) => {
  const player = players.find((p) => p.name === nicknameInput.value);
  if (player) {
    pointsElement.textContent = player.score;
  }
});

socket.on("winners", (winners) => {
  questionElement.textContent = "El juego ha terminado";
  answersElement.innerHTML = "Ganadores: " + winners.join(", ");
  restartButton.style.display = "block";
});

restartButton.addEventListener("click", () => {
  socket.emit("restart");
  restartButton.style.display = "none";
});

function disableAnswerButtons() {
  const buttons = answersElement.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = true;
  }
}

function enableAnswerButtons() {
  const buttons = answersElement.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = false;
  }
}