const socket = io();

const sendButton = document.getElementById("sendButton");
const nicknameInput = document.getElementById("nicknameInput");
const game = document.getElementById("game");
const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");

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
      leaderboardTableContainer.style.display = "inline-table";
      game.style.display = "block";
      tiempoRestante.style.display = "block";
      startContainer.style.display = "none";
    }
  });
});

function displayQuestion(question) {
  questionElement.textContent = question.text;
  answersElement.innerHTML = '<div class="row"></div>';

  let remainingTime = question.time;
  const timerElement = document.getElementById("timer");
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
    const buttonDiv = document.createElement("div");
    buttonDiv.className =
      "col-6 d-flex justify-content-center align-items-center";

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
    buttonDiv.appendChild(button);
    answersElement.firstElementChild.appendChild(buttonDiv);
  });
}

socket.on("question", (data) => {
  if (data.allAnswered) {
    displayNextQuestion(data);
  } else {
    displayQuestion(data);
    enableAnswerButtons();
  }
});

const pointsElement = document.getElementById("points");
const leaderboardTableBody = document.querySelector("#leaderboardTable tbody");

socket.on("players", (players) => {
  leaderboardTableBody.innerHTML = ""; // Limpiar tabla de clasificación

  players.sort((a, b) => b.score - a.score);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const row = document.createElement("tr");
    row.innerHTML = `
      <th scope="row">${i + 1}</th>
      <td>${player.name}</td>
      <td>${player.score}</td>
    `;
    leaderboardTableBody.appendChild(row);
  }

  const player = players.find((p) => p.name === nicknameInput.value);
  if (player) {
    pointsElement.textContent = player.score;
  }
});

socket.on("winners", (winners) => {
  questionElement.textContent =
    "Juego finalizado. Espero que hayáis disfrutado del juego y aprendido algo nuevo en el camino.";
  const winnerText = winners.length === 1 ? "Ganador: " : "Ganadores: ";
  answersElement.innerHTML = winnerText + winners.join(", ");
  tiempoRestante.style.display = "none";
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
