let cols, rows;
let gridSize = 55; 
let mines = [];
let numMines = 7; 
let score = 0;
let gameState = "START"; // START, PLAY, WIN, GAMEOVER
let radarRange = 220;

// 計時器與特效
let timer = 30;
let lastTime = 0;
let shakeAmount = 0; 
let glitchAlpha = 0; 
let winParticles = []; // 成功畫面的粒子

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('Courier New'); 
  initializeGame();
}

function draw() {
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.85;
  }

  background(260, 80, 5); 

  if (gameState === "START") {
    drawCyberStartScreen();
  } else if (gameState === "PLAY") {
    runGame();
    updateTimer();
    drawGlitchOverlay(); 
  } else if (gameState === "WIN") {
    drawEpicWinScreen(); // 升級後的超帥成功頁面
  } else if (gameState === "GAMEOVER") {
    drawCyberGameOverScreen();
  }
}

function runGame() {
  drawCyberGrid();
  rectMode(CENTER);
  noStroke();

  for (let i = 0; i < floor(width / gridSize); i++) {
    for (let j = 0; j < floor(height / gridSize); j++) {
      let centerX = i * gridSize + gridSize / 2;
      let centerY = j * gridSize + gridSize / 2;
      let dMouse = dist(mouseX, mouseY, centerX, centerY);

      if (dMouse < radarRange) {
        let minD = Infinity;
        for (let m of mines) {
          if (!m.found) {
            let d = dist(centerX, centerY, m.x, m.y);
            if (d < minD) minD = d;
          }
        }
        let mouseFactor = map(dMouse, 0, radarRange, 1, 0);
        let mineFactor = map(minD, 0, radarRange, 1, 0);
        let intensity = mouseFactor * constrain(mineFactor, 0, 1);

        if (intensity > 0.08) {
          let hue = map(intensity, 0, 1, 190, 330); 
          let sz = map(intensity, 0, 1, gridSize * 0.1, gridSize * 1.3);
          drawingContext.shadowBlur = intensity * 25;
          drawingContext.shadowColor = color(hue, 95, 100);
          fill(hue, 95, 100, 85);
          rect(centerX, centerY, sz, sz, sz * 0.15);
          drawingContext.shadowBlur = 0;
        }
      }
    }
  }

  for (let m of mines) {
    if (m.found) m.display();
  }
  drawHUD();
}

// --- 超帥成功頁面 ---
function drawEpicWinScreen() {
  // 1. 動態背景：數位雨效果
  background(120, 100, 5, 40); 
  for (let i = 0; i < 20; i++) {
    fill(120, 80, 100, 30);
    textSize(14);
    text(round(random(0,1)), random(width), (frameCount * 5 + i * 100) % height);
  }

  // 2. 核心文字：RGB 分離與發光
  textAlign(CENTER, CENTER);
  let offset = sin(frameCount * 0.5) * 3;
  
  // 紅色偏移層
  fill(0, 100, 100, 150);
  textSize(95);
  text("ACCESS GRANTED", width / 2 + offset, height / 2 - 50);
  
  // 藍色偏移層
  fill(200, 100, 100, 150);
  text("ACCESS GRANTED", width / 2 - offset, height / 2 - 50);

  // 主文字層
  drawingContext.shadowBlur = 40;
  drawingContext.shadowColor = color(120, 100, 100);
  fill(120, 80, 100);
  text("ACCESS GRANTED", width / 2, height / 2 - 50);
  drawingContext.shadowBlur = 0;

  // 3. 數據統計
  fill(0, 0, 100);
  textSize(22);
  let timeUsed = 30 - timer;
  text(`> SYSTEM_BREACH: 100% COMPLETE`, width / 2, height / 2 + 30);
  text(`> EXTRACTION_TIME: ${timeUsed} SECONDS`, width / 2, height / 2 + 65);
  
  // 4. 閃爍的返回按鈕
  let breathe = map(sin(frameCount * 0.1), -1, 1, 50, 100);
  fill(190, 90, breathe);
  textSize(20);
  text("--- CLICK TO RE-INITIALIZE ---", width / 2, height / 2 + 150);
  
  // 5. 擴散圓環
  noFill();
  stroke(120, 100, 100, 50);
  strokeWeight(2);
  let ringSz = (frameCount * 10) % (width * 1.5);
  ellipse(width/2, height/2, ringSz);
}

function drawCyberStartScreen() {
  background(260, 100, 3);
  drawCyberGrid();
  textAlign(CENTER, CENTER);
  drawingContext.shadowBlur = 40;
  drawingContext.shadowColor = color(320, 100, 100);
  fill(320, 100, 100);
  textSize(100); 
  text("NEON_HUNTER", width / 2, height / 2 - 100);
  drawingContext.shadowBlur = 0;

  fill(190, 90, 100);
  textSize(22);
  textStyle(BOLD);
  text(">> MISSION: RETRIEVE 7 ENCRYPTED CORES", width / 2, height / 2);
  
  textSize(18);
  textStyle(NORMAL);
  fill(190, 70, 80);
  text("移動滑鼠探測訊號 | 當色塊變紅擴大時點擊挖掘", width / 2, height / 2 + 45);
  fill(0, 90, 100);
  text("!! 警告：誤觸將扣除 3 秒系統時間 !!", width / 2, height / 2 + 80);
  
  if (frameCount % 40 < 20) {
    fill(0, 0, 100);
    textSize(28);
    text("--- CLICK TO BOOT ---", width / 2, height / 2 + 180);
  }
}

function drawHUD() {
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(190, 90, 100);
  fill(190, 90, 100);
  textAlign(LEFT, TOP);
  textSize(32); 
  textStyle(BOLD);
  text(`[ STATUS: ${score}/${numMines} ]`, 40, 40);
  
  let timerCol = (timer < 10 && frameCount % 20 < 10) ? color(0, 100, 100) : color(190, 90, 100);
  fill(timerCol);
  textAlign(RIGHT, TOP);
  textSize(36);
  text(`${timer}S`, width - 40, 40);
  textStyle(NORMAL);
  drawingContext.shadowBlur = 0;
}

function drawCyberGameOverScreen() {
  background(0, 100, 5);
  textAlign(CENTER, CENTER);
  fill(0, 100, 100);
  textSize(90);
  text("TERMINATED", width / 2, height / 2 - 50);
  fill(0, 0, 100);
  textSize(24);
  text("CONNECTION LOST / TIME OVER", width / 2, height / 2 + 40);
  fill(190, 90, 100);
  text(">> CLICK TO RETRY <<", width / 2, height / 2 + 130);
}

function drawCyberGrid() {
  stroke(260, 60, 15);
  strokeWeight(1);
  for (let x = 0; x <= width; x += gridSize) line(x, 0, x, height);
  for (let y = 0; y <= height; y += gridSize) line(0, y, width, y);
}

function updateTimer() {
  if (millis() - lastTime >= 1000) {
    timer--;
    lastTime = millis();
  }
  if (timer <= 0) {
    timer = 0;
    gameState = "GAMEOVER";
  }
}

function drawGlitchOverlay() {
  if (glitchAlpha > 0) {
    fill(0, 100, 100, glitchAlpha * 0.3);
    rect(width/2, height/2, width, height);
    stroke(0, 100, 100, glitchAlpha);
    for(let i=0; i<10; i++) line(0, random(height), width, random(height));
    glitchAlpha -= 4;
  }
}

function initializeGame() {
  mines = [];
  score = 0;
  timer = 30;
  lastTime = millis();
  let c = floor(width / gridSize);
  let r = floor(height / gridSize);
  while (mines.length < numMines) {
    let col = floor(random(c));
    let row = floor(random(r));
    if (!mines.some(m => m.c === col && m.r === row)) {
      mines.push(new Mine(col, row));
    }
  }
}

class Mine {
  constructor(c, r) {
    this.c = c; this.r = r;
    this.x = c * gridSize + gridSize / 2;
    this.y = r * gridSize + gridSize / 2;
    this.found = false;
  }
  display() {
    push();
    translate(this.x, this.y);
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = color(190, 100, 100);
    fill(190, 100, 100);
    rect(0, 0, gridSize * 0.7, gridSize * 0.7, 5);
    stroke(320, 100, 100);
    strokeWeight(3);
    noFill();
    rect(0, 0, gridSize * 1.1, gridSize * 1.1);
    pop();
  }
}

function mousePressed() {
  if (gameState === "WIN" || gameState === "GAMEOVER") {
    gameState = "START";
    return;
  }
  if (gameState === "START") {
    initializeGame();
    gameState = "PLAY";
    return;
  }
  if (gameState === "PLAY") {
    let col = floor(mouseX / gridSize);
    let row = floor(mouseY / gridSize);
    let hit = false;
    for (let m of mines) {
      if (m.c === col && m.r === row && !m.found) {
        m.found = true;
        score++;
        shakeAmount = 6; 
        if (score >= numMines) gameState = "WIN";
        hit = true;
        break;
      }
    }
    if (!hit) {
      timer -= 3; 
      shakeAmount = 30; 
      glitchAlpha = 100; 
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}