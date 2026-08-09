"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const pageShell = document.querySelector(".page-shell");
const hero = document.querySelector(".hero");
const gameCard = document.querySelector(".game-card");
const gameToolbar = document.querySelector(".game-toolbar");
const gameLayout = document.querySelector(".game-layout");
const canvasColumn = document.querySelector(".canvas-column");
const canvasFrame = document.querySelector(".canvas-frame");
const controls = document.querySelector(".controls");
const sideColumn = document.querySelector(".side-column");
const projectPanel = document.querySelector("#project-panel");
const projectToken = document.querySelector("#project-token");
const projectList = document.querySelector("#project-list");
const continueButton = document.querySelector("#continue-button");
const panelBackLink = document.querySelector("#panel-back-link");
const footer = document.querySelector(".footer");
const scoreElement = document.querySelector("#score");
const statusLine = document.querySelector("#status-line");
const canvasStatus = document.querySelector("#canvas-status");
const statusTitle = document.querySelector("#status-title");
const statusCopy = document.querySelector("#status-copy");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const backLink = document.querySelector("#back-link");
const directionButtons = document.querySelectorAll("[data-direction]");
const joystick = document.querySelector("#joystick");

const GRID_SIZE = 20;
const GAME_INTERVAL = 195;
const START_GRACE_PERIOD = 250;
const JOYSTICK_THRESHOLD = 8;
const FALLBACK_RETURN_URL = "https://github.com/Andrehlb#easter-egg";

const TECH_TOKENS = [
  {
    key: "PY",
    name: "Python",
    color: "#d8a735",
    projects: [
      {
        title: "Auto Event Google Calendar",
        url: "https://github.com/Andrehlb/auto-event-google-calendar",
      },
      {
        title: "AI Naive Bayes Classifier",
        url: "https://github.com/Andrehlb/AI-NaiveBayes-Classifier",
      },
      {
        title: "Simple Banking System",
        url: "https://github.com/Andrehlb/SimpleBankingSystem-DB-Crypto-token",
      },
    ],
  },
  {
    key: "JS",
    name: "JavaScript",
    color: "#e0c34b",
    projects: [
      {
        title: "Portal de Venda de Ingressos Frontend",
        url: "https://github.com/Andrehlb/portal-ingressos-frontend",
      },
      {
        title: "Consumindo API",
        url: "https://github.com/Andrehlb/consumindoAPI",
      },
    ],
  },
  {
    key: "JAVA",
    name: "Java",
    color: "#d77843",
    projects: [
      {
        title: "Chat MultiGeração",
        url: "https://github.com/Andrehlb/chatMultiGeracao-API-REST-SpringBootSwagger",
      },
      {
        title: "Java RESTful API · League of Legends",
        url: "https://github.com/Andrehlb/Java-RestFul-API-SpringBoot-LeagueOfLegends-Santander",
      },
    ],
  },
  {
    key: "FLUTTER",
    name: "Flutter",
    color: "#73d5ed",
    projects: [
      {
        title: "Flutter/Dart projects in development",
        url: "https://github.com/Andrehlb/flutter-dart-labs",
      },
    ],
  },
  {
    key: "KOTLIN",
    name: "Kotlin",
    color: "#b67ad9",
    projects: [
      {
        title: "Kotlin Android",
        url: "https://github.com/Andrehlb/kotlin-android",
      },
      {
        title: "App Navigation · Venturus",
        url: "https://github.com/Andrehlb/AppNavigation-Estudo-Venturus",
      },
    ],
  },
  {
    key: "AWS",
    name: "AWS",
    color: "#e49b45",
    projects: [
      {
        title: "AWS EC2 Bastion & Webserver",
        url: "https://github.com/Andrehlb/AWS-EC2-Bastion-Webserver-Connect-CLI-Lab",
      },
      {
        title: "CafeteriaAppMigration · AWS RDS EC2 LAMP",
        url: "https://github.com/Andrehlb/CafeteriaAppMigration-AWS-RDS-EC2-LAMP",
      },
    ],
  },
];

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const KEY_DIRECTIONS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

let snake = [];
let food = { x: 14, y: 10 };
let currentToken = null;
let sparks = [];
let direction = DIRECTIONS.right;
let queuedDirection = DIRECTIONS.right;
let score = 0;
let gameState = "ready";
let lastStepTime = 0;
let animationFrame = 0;
let effectsAnimationFrame = 0;
let resizeFrame = 0;
let renderSize = 480;
let currentBoardSize = 0;
let joystickPointerId = null;
let joystickOrigin = { x: 0, y: 0 };
let lastJoystickDirection = null;

function resetGame(nextState = "ready", startingDirectionName = "right") {
  const startingDirection = DIRECTIONS[startingDirectionName] ?? DIRECTIONS.right;
  const startingHead = { x: 10, y: 10 };

  closeProjectPanel();
  cancelAnimationFrame(effectsAnimationFrame);
  sparks = [];
  snake = Array.from({ length: 4 }, (_, index) => ({
    x: startingHead.x - startingDirection.x * index,
    y: startingHead.y - startingDirection.y * index,
  }));
  direction = startingDirection;
  queuedDirection = startingDirection;
  score = 0;
  gameState = nextState;
  lastStepTime = 0;
  placeFood();
  updateInterface();
  draw();
}

function startGame() {
  if (gameState === "running" || gameState === "token-paused") {
    return;
  }

  if (gameState === "game-over" || gameState === "won") {
    resetGame("ready");
  }

  gameState = "running";
  updateInterface();
  lastStepTime = performance.now() + START_GRACE_PERIOD;
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (gameState === "running") {
    gameState = "paused";
    cancelAnimationFrame(animationFrame);
    updateInterface();
    draw();
    return;
  }

  if (gameState === "paused") {
    startGame();
  }
}

function restartGame() {
  cancelAnimationFrame(animationFrame);
  closeProjectPanel();
  resetGame("running");
  lastStepTime = performance.now() + START_GRACE_PERIOD;
  animationFrame = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (gameState !== "running") {
    return;
  }

  if (timestamp - lastStepTime >= GAME_INTERVAL) {
    advanceSnake();
    lastStepTime = timestamp;

    if (gameState !== "running") {
      draw();
      return;
    }
  }

  draw();
  animationFrame = requestAnimationFrame(gameLoop);
}

function advanceSnake() {
  direction = queuedDirection;

  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitsWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y >= GRID_SIZE;
  const eatsFood = nextHead.x === food.x && nextHead.y === food.y;
  const bodyToCheck = eatsFood ? snake : snake.slice(0, -1);
  const hitsSelf = bodyToCheck.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
  );

  if (hitsWall || hitsSelf) {
    finishGame("game-over");
    return;
  }

  snake.unshift(nextHead);

  if (eatsFood) {
    const collectedToken = currentToken;
    score += 1;
    scoreElement.textContent = String(score);
    createSpark(food.x, food.y, collectedToken.color);

    if (snake.length === GRID_SIZE * GRID_SIZE) {
      finishGame("won");
      return;
    }

    placeFood();
    openProjectPanel(collectedToken);
  } else {
    snake.pop();
  }
}

function finishGame(result) {
  gameState = result;
  cancelAnimationFrame(animationFrame);
  updateInterface();
  draw();
}

function placeFood() {
  const openCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const occupied = snake.some(
        (segment) => segment.x === x && segment.y === y,
      );

      if (!occupied) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length > 0) {
    food = openCells[Math.floor(Math.random() * openCells.length)];
    const tokenOptions = TECH_TOKENS.filter(
      (token) => token.key !== currentToken?.key,
    );
    currentToken =
      tokenOptions[Math.floor(Math.random() * tokenOptions.length)] ??
      TECH_TOKENS[0];
  }
}

function requestDirection(name) {
  const nextDirection = DIRECTIONS[name];

  if (!nextDirection) {
    return;
  }

  if (gameState === "ready") {
    resetGame("ready", name);
    startGame();
    return;
  }

  if (["token-paused", "game-over", "won"].includes(gameState)) {
    return;
  }

  const reversesDirection =
    nextDirection.x + queuedDirection.x === 0 &&
    nextDirection.y + queuedDirection.y === 0;

  if (!reversesDirection) {
    queuedDirection = nextDirection;
  }

}

function getJoystickDirection(deltaX, deltaY) {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < JOYSTICK_THRESHOLD) {
    return null;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "down" : "up";
}

function updateJoystick(event) {
  if (event.pointerId !== joystickPointerId) {
    return;
  }

  const deltaX = event.clientX - joystickOrigin.x;
  const deltaY = event.clientY - joystickOrigin.y;
  const distance = Math.hypot(deltaX, deltaY);
  const maxDistance = Math.max(10, joystick.clientWidth * 0.36);
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  const visualX = deltaX * scale;
  const visualY = deltaY * scale;
  const nextDirection = getJoystickDirection(deltaX, deltaY);

  joystick.style.setProperty("--joystick-x", `${visualX}px`);
  joystick.style.setProperty("--joystick-y", `${visualY}px`);

  if (nextDirection && nextDirection !== lastJoystickDirection) {
    lastJoystickDirection = nextDirection;
    requestDirection(nextDirection);
  }
}

function beginJoystick(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  event.preventDefault();
  joystickPointerId = event.pointerId;
  joystickOrigin = { x: event.clientX, y: event.clientY };
  lastJoystickDirection = null;
  joystick.classList.add("is-active");
  joystick.setPointerCapture?.(event.pointerId);
}

function releaseJoystick(event) {
  if (event.pointerId !== joystickPointerId) {
    return;
  }

  if (joystick.hasPointerCapture?.(event.pointerId)) {
    joystick.releasePointerCapture(event.pointerId);
  }

  joystickPointerId = null;
  lastJoystickDirection = null;
  joystick.classList.remove("is-active");
  joystick.style.setProperty("--joystick-x", "0px");
  joystick.style.setProperty("--joystick-y", "0px");
}

function renderProjectPanel(token) {
  projectToken.textContent = token.name;
  projectList.replaceChildren(
    ...token.projects.map((project) => {
      const item = document.createElement("li");
      const link = document.createElement("a");

      link.href = project.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = project.title;
      item.append(link);
      return item;
    }),
  );
}

function openProjectPanel(token) {
  gameState = "token-paused";
  cancelAnimationFrame(animationFrame);
  renderProjectPanel(token);
  projectPanel.setAttribute("aria-hidden", "false");
  projectPanel.inert = false;
  gameCard.classList.add("is-panel-open");
  updateInterface();
  scheduleCanvasResize();
}

function closeProjectPanel() {
  projectPanel.setAttribute("aria-hidden", "true");
  projectPanel.inert = true;
  gameCard.classList.remove("is-panel-open");
  scheduleCanvasResize();
}

function continueGame() {
  if (gameState !== "token-paused") {
    return;
  }

  closeProjectPanel();
  gameState = "running";
  updateInterface();
  lastStepTime = performance.now() + START_GRACE_PERIOD;
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
  pauseButton.focus({ preventScroll: true });
}

function updateInterface() {
  scoreElement.textContent = String(score);
  pauseButton.disabled = !["running", "paused"].includes(gameState);
  pauseButton.textContent = gameState === "paused" ? "Resume" : "Pause";
  startButton.disabled = ["running", "paused", "token-paused"].includes(
    gameState,
  );

  const messages = {
    ready: {
      title: "Ready",
      copy: "Press START to play. Eat tech tokens. Avoid the walls.",
      line: "Ready to play.",
      overlay: true,
    },
    running: {
      title: "",
      copy: "",
      line: "Contribution trail in progress.",
      overlay: false,
    },
    paused: {
      title: "Paused",
      copy: "Press Resume to continue.",
      line: "Game paused.",
      overlay: true,
    },
    "token-paused": {
      title: "Token collected",
      copy: "A project path has been unlocked.",
      line: "Explore the projects, then continue.",
      overlay: true,
    },
    "game-over": {
      title: "Trail ended",
      copy: "Restart or press Start to try again.",
      line: `Score ${score} · Ready for another run.`,
      overlay: true,
    },
    won: {
      title: "Grid complete",
      copy: "Every cell is part of the contribution trail.",
      line: `Perfect run. Final score: ${score}.`,
      overlay: true,
    },
  };

  const message = messages[gameState];
  statusTitle.textContent = message.title;
  statusCopy.textContent = message.copy;
  statusLine.textContent = message.line;
  canvasStatus.hidden = !message.overlay;
}

function draw() {
  const cellSize = renderSize / GRID_SIZE;

  context.clearRect(0, 0, renderSize, renderSize);
  drawBoard(cellSize);
  drawTechToken(cellSize);
  drawSnake(cellSize);
  drawSparks(cellSize, performance.now());
}

function drawBoard(cellSize) {
  context.fillStyle = "#18130f";
  context.fillRect(0, 0, renderSize, renderSize);

  context.strokeStyle = "rgba(216, 149, 85, 0.13)";
  context.lineWidth = 1;

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const position = Math.round(index * cellSize) + 0.5;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, renderSize);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(renderSize, position);
    context.stroke();
  }
}

function drawTechToken(cellSize) {
  if (!currentToken) {
    return;
  }

  const label = currentToken.key;
  const fontSize = Math.max(
    7,
    Math.min(cellSize * 0.52, (cellSize * 3) / (label.length * 0.62)),
  );
  const tokenHeight = cellSize * 0.9;
  const maxWidth = cellSize * 3;
  const rawCenterX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;

  context.save();
  context.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const tokenWidth = Math.min(
    maxWidth,
    Math.max(cellSize, context.measureText(label).width + cellSize * 0.5),
  );
  const centerX = Math.max(
    tokenWidth / 2 + 2,
    Math.min(renderSize - tokenWidth / 2 - 2, rawCenterX),
  );

  context.shadowColor = currentToken.color;
  context.shadowBlur = cellSize * 0.48;
  context.fillStyle = currentToken.color;
  roundedRect(
    centerX - tokenWidth / 2,
    centerY - tokenHeight / 2,
    tokenWidth,
    tokenHeight,
    tokenHeight / 2,
  );
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#1a130f";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, centerX, centerY + fontSize * 0.04);
  context.restore();
}

function drawSnake(cellSize) {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const taper = isHead
      ? 0
      : Math.min(0.055, (index / Math.max(1, snake.length - 1)) * 0.055);
    const inset = Math.max(
      1.5,
      cellSize * (isHead ? 0.055 : 0.115 + taper),
    );
    const segmentSize = cellSize - inset * 2;
    const gradient = context.createLinearGradient(
      segment.x * cellSize,
      segment.y * cellSize,
      (segment.x + 1) * cellSize,
      (segment.y + 1) * cellSize,
    );
    gradient.addColorStop(0, isHead ? "#d89555" : "#b87333");
    gradient.addColorStop(1, isHead ? "#c65d20" : "#82461f");

    context.save();
    context.fillStyle = gradient;

    if (isHead) {
      context.shadowColor = "rgba(216, 149, 85, 0.45)";
      context.shadowBlur = cellSize * 0.32;
    }

    roundedRect(
      segment.x * cellSize + inset,
      segment.y * cellSize + inset,
      segmentSize,
      segmentSize,
      cellSize * 0.22,
    );
    context.fill();
    context.restore();
  });

  drawSnakeFace(cellSize);
}

function drawSnakeFace(cellSize) {
  const head = snake[0];
  const centerX = head.x * cellSize + cellSize / 2;
  const centerY = head.y * cellSize + cellSize / 2;
  const perpendicular = { x: -direction.y, y: direction.x };
  const frontOffset = cellSize * 0.18;
  const eyeOffset = cellSize * 0.13;
  const eyeRadius = Math.max(1, cellSize * 0.045);

  context.fillStyle = "#f4efe6";

  [-1, 1].forEach((side) => {
    const eyeX =
      centerX +
      direction.x * frontOffset +
      perpendicular.x * eyeOffset * side;
    const eyeY =
      centerY +
      direction.y * frontOffset +
      perpendicular.y * eyeOffset * side;

    context.beginPath();
    context.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    context.fill();
  });
}

function createSpark(gridX, gridY, color) {
  const createdAt = performance.now();
  sparks = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10 + Math.random() * 0.24;
    const force = 0.42 + Math.random() * 0.48;

    return {
      x: gridX + 0.5,
      y: gridY + 0.5,
      velocityX: Math.cos(angle) * force,
      velocityY: Math.sin(angle) * force,
      color,
      createdAt,
      duration: 320 + Math.random() * 140,
    };
  });

  cancelAnimationFrame(effectsAnimationFrame);
  effectsAnimationFrame = requestAnimationFrame(animateSparks);
}

function animateSparks(timestamp) {
  sparks = sparks.filter(
    (spark) => timestamp - spark.createdAt < spark.duration,
  );
  draw();

  if (sparks.length > 0) {
    effectsAnimationFrame = requestAnimationFrame(animateSparks);
  }
}

function drawSparks(cellSize, timestamp) {
  sparks.forEach((spark) => {
    const progress = Math.min(1, (timestamp - spark.createdAt) / spark.duration);
    const x = (spark.x + spark.velocityX * progress) * cellSize;
    const y = (spark.y + spark.velocityY * progress) * cellSize;
    const radius = Math.max(1, cellSize * 0.085 * (1 - progress));

    context.save();
    context.globalAlpha = 1 - progress;
    context.fillStyle = spark.color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
}

function roundedRect(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function numericStyle(element, property) {
  return Number.parseFloat(getComputedStyle(element)[property]) || 0;
}

function outerHeight(element) {
  if (getComputedStyle(element).display === "none") {
    return 0;
  }

  return (
    element.getBoundingClientRect().height +
    numericStyle(element, "marginTop") +
    numericStyle(element, "marginBottom")
  );
}

function controlsAreStacked() {
  const narrowLayout = window.matchMedia("(max-width: 700px)").matches;
  const shortLandscape = window.matchMedia(
    "(max-height: 600px) and (min-width: 560px)",
  ).matches;
  const compactTwoColumn = window.matchMedia(
    "(max-width: 400px) and (max-height: 650px)",
  ).matches;

  return narrowLayout && !shortLandscape && !compactTwoColumn;
}

function resizeBoard() {
  const visualViewport = window.visualViewport;
  const viewportBottom = visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : window.innerHeight;
  const viewportWidth = visualViewport?.width ?? window.innerWidth;
  const columnBounds = canvasColumn.getBoundingClientRect();
  const frameTop = canvasFrame.getBoundingClientRect().top;
  const layoutGap = numericStyle(gameLayout, "rowGap");
  const panelOpen = gameCard.classList.contains("is-panel-open");
  const stackedCompanion = panelOpen ? projectPanel : controls;
  const controlsHeight = controlsAreStacked()
    ? outerHeight(stackedCompanion) + layoutGap
    : 0;
  const statusHeight = outerHeight(statusLine);
  const footerHeight = outerHeight(footer);
  const cardBottomPadding = numericStyle(gameCard, "paddingBottom");
  const pageBottomPadding = numericStyle(pageShell, "paddingBottom");
  const safeGap = Math.max(6, Math.min(14, viewportWidth * 0.015));
  const availableWidth = Math.floor(columnBounds.width);
  const availableHeight = Math.floor(
    viewportBottom -
      frameTop -
      controlsHeight -
      statusHeight -
      footerHeight -
      cardBottomPadding -
      pageBottomPadding -
      safeGap,
  );
  const stackedPanelOpen = panelOpen && controlsAreStacked();
  const stackedPanelCap = stackedPanelOpen
    ? Math.max(
        140,
        Math.floor((visualViewport?.height ?? window.innerHeight) * 0.27),
      )
    : Number.POSITIVE_INFINITY;
  const panelScale = panelOpen && !stackedPanelOpen ? 0.88 : 1;
  const boardSize = Math.max(
    140,
    Math.floor(
      Math.min(availableWidth, availableHeight, stackedPanelCap) * panelScale,
    ),
  );

  if (Math.abs(boardSize - currentBoardSize) > 1) {
    currentBoardSize = boardSize;
    canvasFrame.style.setProperty("--board-size", `${boardSize}px`);
  }

  const size = Math.max(1, Math.floor(canvasFrame.clientWidth));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelSize = Math.floor(size * pixelRatio);

  if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
    canvas.width = pixelSize;
    canvas.height = pixelSize;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  renderSize = size;
  draw();
}

function scheduleCanvasResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(resizeBoard);
}

function configureReturnLink() {
  const requestedReturn = new URLSearchParams(window.location.search).get("return");
  let returnHref = FALLBACK_RETURN_URL;

  if (requestedReturn) {
    try {
      const returnUrl = new URL(requestedReturn);
      const isSafeProtocol = ["https:", "http:"].includes(returnUrl.protocol);
      returnHref = isSafeProtocol ? returnUrl.href : FALLBACK_RETURN_URL;
    } catch {
      returnHref = FALLBACK_RETURN_URL;
    }
  }

  backLink.href = returnHref;
  panelBackLink.href = returnHref;
}

document.addEventListener("keydown", (event) => {
  const directionName = KEY_DIRECTIONS[event.key];

  if (directionName) {
    event.preventDefault();
    requestDirection(directionName);
  } else if (event.code === "Space") {
    event.preventDefault();
    togglePause();
  }
});

directionButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    requestDirection(button.dataset.direction);
  });
});

joystick.addEventListener("pointerdown", beginJoystick);
joystick.addEventListener("pointermove", updateJoystick);
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);
continueButton.addEventListener("click", continueGame);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState === "running") {
    togglePause();
  }
});

const resizeObserver = new ResizeObserver(scheduleCanvasResize);
[
  pageShell,
  hero,
  gameCard,
  gameToolbar,
  gameLayout,
  canvasColumn,
  canvasFrame,
  controls,
  sideColumn,
  projectPanel,
  footer,
].forEach((element) => resizeObserver.observe(element));
window.addEventListener("resize", scheduleCanvasResize);
window.addEventListener("orientationchange", scheduleCanvasResize);
window.visualViewport?.addEventListener("resize", scheduleCanvasResize);
gameLayout.addEventListener("transitionend", scheduleCanvasResize);

configureReturnLink();
resetGame();
scheduleCanvasResize();
