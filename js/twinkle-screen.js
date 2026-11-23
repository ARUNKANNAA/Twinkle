/**
 * TWINKLE Screen Simulator & Interactive Mini-Games
 * Faithful reproduction of Twinkle's screen experience
 * Features:
 * - Animated expressive eyes (Normal, Happy, Spiral, Sleep, Blinking, Mouse tracking)
 * - Live synchronized Clock & Date
 * - Interactive Menus (Main Menu, Games Menu)
 * - 3 Playable Mini Games: Flappy Twinkle, Twinkle Run, Space Rush
 * - Wellness screens: Water reminder, Pomodoro timer, 1-Min Breathing guide, Streak
 * - Wi-Fi Setup screen with QR code
 * - Single touch sensor gesture simulation: Tap, Double-Tap, Long-Press
 */

class TwinkleScreen {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Virtual resolution (SSD1306 OLED standard)
    this.V_WIDTH = 128;
    this.V_HEIGHT = 64;
    
    // System Modes
    this.MODES = {
      FACE: 'FACE',
      TIME: 'TIME',
      DATE: 'DATE',
      MENU_MAIN: 'MENU_MAIN',
      MENU_GAMES: 'MENU_GAMES',
      GAME_FLAPPY: 'GAME_FLAPPY',
      GAME_RUN: 'GAME_RUN',
      GAME_SPACE: 'GAME_SPACE',
      WATER: 'WATER',
      POMO: 'POMO',
      BREATHE: 'BREATHE',
      STREAK: 'STREAK',
      MOTIVATION: 'MOTIVATION',
      WIFI_SETUP: 'WIFI_SETUP'
    };

    this.currentMode = this.MODES.FACE;
    this.expression = 'NORMAL'; // NORMAL, HAPPY, SPIRAL, SLEEP
    
    // Gaze & Eye parameters
    this.eyeShiftX = 0;
    this.targetShiftX = 0;
    this.eyeShiftY = 0;
    this.targetShiftY = 0;
    this.blinkProgress = 0; // 0 = open, 1 = closed
    this.isBlinking = false;
    this.lastBlinkTime = Date.now();
    this.spiralAngle = 0;
    this.happyTimer = 0;
    this.spiralTimer = 0;

    // Menu States
    this.mainMenuItems = ['Clock', 'Date', 'Games', 'Water', 'Pomodoro', 'Breathe', 'Streak'];
    this.mainMenuIndex = 0;
    this.gamesMenuItems = ['Flappy Twinkle', 'Twinkle Run', 'Space Rush'];
    this.gamesMenuIndex = 0;

    // Wellness States
    this.waterIntervals = ['OFF', '30m', '45m', '60m', '90m'];
    this.waterIdx = 2; // 45m
    this.waterCount = 4; // 4/6
    this.pomoState = 'WORK'; // WORK, BREAK
    this.pomoSeconds = 25 * 60;
    this.pomoRunning = false;
    this.breatheStart = 0;
    this.streakCount = 7;
    this.motivationIdx = 0;
    this.quotes = [
      "Small steps every day lead to big changes.",
      "You are doing better than you think.",
      "Today is a fresh start. Make it count.",
      "Believe in yourself and keep going.",
      "Progress, not perfection.",
      "One good thing at a time.",
      "Your effort matters, even when nobody sees it.",
      "Be kind to yourself today.",
      "Great things take time. Keep going.",
      "You can do hard things.",
      "Start where you are. Use what you have.",
      "Every expert was once a beginner.",
      "Stay curious and keep learning.",
      "Breathe. You've got this.",
      "Make today a little brighter.",
      "Focus on what you can control.",
      "Mistakes help you grow.",
      "Dream big, start small.",
      "Your future self will thank you.",
      "Courage is taking one more step.",
      "Do it with a smile today.",
      "Consistency beats intensity.",
      "You are stronger than you feel.",
      "Today's effort is tomorrow's strength.",
      "Choose joy in the little things.",
      "Keep shining, little star.",
      "Rest if you must, but don't quit.",
      "Good things are coming your way.",
      "Be proud of how far you've come.",
      "Make it a great day!"
    ];

    // Games states
    this.initGames();

    // Mouse tracking
    this.setupListeners();

    // Start loop
    this.lastFrameTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initGames() {
    // Flappy Twinkle
    this.flappy = {
      state: 'READY', // READY, PLAYING, GAMEOVER
      birdX: 28,
      birdY: 28,
      velY: 0,
      gravity: 0.18,
      flapForce: -2.4,
      pipeX: 130,
      pipeW: 14,
      gapY: 18,
      gapH: 30,
      score: 0,
      highScore: 12
    };

    // Twinkle Run
    this.runner = {
      state: 'READY',
      playerX: 20,
      playerY: 48,
      groundY: 48,
      velY: 0,
      gravity: 0.35,
      jumpForce: -4.2,
      obsX: 130,
      obsW: 8,
      obsH: 12,
      score: 0,
      highScore: 38,
      speed: 2.2
    };

    // Space Rush
    this.space = {
      state: 'READY',
      lanes: [14, 30, 46],
      currentLane: 1,
      shipY: 30,
      astX: 130,
      astLane: 1,
      astSize: 8,
      score: 0,
      highScore: 45,
      speed: 2.4,
      stars: [
        { x: 20, y: 10, s: 1 }, { x: 55, y: 25, s: 0.5 }, { x: 90, y: 15, s: 1.2 },
        { x: 115, y: 50, s: 0.8 }, { x: 40, y: 55, s: 1 }
      ]
    };
  }

  setMode(mode) {
    if (this.MODES[mode]) {
      this.currentMode = this.MODES[mode];
      this.notifyModeChange(mode);
    }
  }

  setExpression(expr, durationMs = 3500) {
    this.expression = expr;
    if (expr === 'HAPPY') {
      this.happyTimer = Date.now() + durationMs;
    } else if (expr === 'SPIRAL') {
      this.spiralTimer = Date.now() + durationMs;
    }
  }

  notifyModeChange(mode) {
    // Notify external UI tabs or indicators
    const event = new CustomEvent('twinkle-mode-change', { detail: { mode } });
    window.dispatchEvent(event);
  }

  // --- Gesture Handling ---
  handleTap() {
    const now = Date.now();
    if (this.currentMode === this.MODES.FACE) {
      if (this.expression === 'SLEEP') {
        this.expression = 'NORMAL';
      } else {
        this.setExpression('HAPPY', 3000);
      }
    } else if (this.currentMode === this.MODES.MENU_MAIN) {
      this.mainMenuIndex = (this.mainMenuIndex + 1) % this.mainMenuItems.length;
    } else if (this.currentMode === this.MODES.MENU_GAMES) {
      this.gamesMenuIndex = (this.gamesMenuIndex + 1) % this.gamesMenuItems.length;
    } else if (this.currentMode === this.MODES.GAME_FLAPPY) {
      if (this.flappy.state === 'READY') this.flappy.state = 'PLAYING';
      else if (this.flappy.state === 'PLAYING') this.flappy.velY = this.flappy.flapForce;
      else if (this.flappy.state === 'GAMEOVER') this.resetFlappy();
    } else if (this.currentMode === this.MODES.GAME_RUN) {
      if (this.runner.state === 'READY') this.runner.state = 'PLAYING';
      else if (this.runner.state === 'PLAYING' && this.runner.playerY >= this.runner.groundY - 1) {
        this.runner.velY = this.runner.jumpForce;
      } else if (this.runner.state === 'GAMEOVER') this.resetRunner();
    } else if (this.currentMode === this.MODES.GAME_SPACE) {
      if (this.space.state === 'READY') this.space.state = 'PLAYING';
      else if (this.space.state === 'PLAYING') {
        this.space.currentLane = (this.space.currentLane + 1) % 3;
      } else if (this.space.state === 'GAMEOVER') this.resetSpace();
    } else if (this.currentMode === this.MODES.WATER) {
      this.waterIdx = (this.waterIdx + 1) % this.waterIntervals.length;
    } else if (this.currentMode === this.MODES.POMO) {
      this.pomoRunning = !this.pomoRunning;
    } else if (this.currentMode === this.MODES.BREATHE) {
      this.breatheStart = now;
    } else if (this.currentMode === this.MODES.MOTIVATION) {
      this.motivationIdx = (this.motivationIdx + 1) % this.quotes.length;
      this.setExpression('HAPPY', 3000);
      this.setMode(this.MODES.FACE);
    }
  }

  handleDoubleTap() {
    if (this.currentMode === this.MODES.FACE) {
      this.setExpression('SPIRAL', 3500);
    } else if (this.currentMode === this.MODES.MENU_MAIN) {
      this.setMode(this.MODES.FACE);
    } else if (this.currentMode === this.MODES.MENU_GAMES) {
      this.setMode(this.MODES.MENU_MAIN);
    } else if (this.currentMode.startsWith('GAME_')) {
      this.setMode(this.MODES.MENU_GAMES);
    } else {
      this.setMode(this.MODES.MENU_MAIN);
    }
  }

  handleLongPress() {
    if (this.currentMode === this.MODES.FACE) {
      this.setMode(this.MODES.MENU_MAIN);
    } else if (this.currentMode === this.MODES.MENU_MAIN) {
      const selected = this.mainMenuItems[this.mainMenuIndex];
      if (selected === 'Clock') this.setMode(this.MODES.TIME);
      else if (selected === 'Date') this.setMode(this.MODES.DATE);
      else if (selected === 'Games') this.setMode(this.MODES.MENU_GAMES);
      else if (selected === 'Water') this.setMode(this.MODES.WATER);
      else if (selected === 'Pomodoro') this.setMode(this.MODES.POMO);
      else if (selected === 'Breathe') {
        this.breatheStart = Date.now();
        this.setMode(this.MODES.BREATHE);
      }
      else if (selected === 'Streak') this.setMode(this.MODES.STREAK);
    } else if (this.currentMode === this.MODES.MENU_GAMES) {
      const game = this.gamesMenuItems[this.gamesMenuIndex];
      if (game === 'Flappy Twinkle') {
        this.resetFlappy();
        this.setMode(this.MODES.GAME_FLAPPY);
      } else if (game === 'Twinkle Run') {
        this.resetRunner();
        this.setMode(this.MODES.GAME_RUN);
      } else if (game === 'Space Rush') {
        this.resetSpace();
        this.setMode(this.MODES.GAME_SPACE);
      }
    } else {
      this.setMode(this.MODES.FACE);
    }
  }

  resetFlappy() {
    this.flappy.state = 'READY';
    this.flappy.birdY = 28;
    this.flappy.velY = 0;
    this.flappy.pipeX = 130;
    this.flappy.score = 0;
  }

  resetRunner() {
    this.runner.state = 'READY';
    this.runner.playerY = this.runner.groundY;
    this.runner.velY = 0;
    this.runner.obsX = 130;
    this.runner.score = 0;
  }

  resetSpace() {
    this.space.state = 'READY';
    this.space.currentLane = 1;
    this.space.shipY = this.space.lanes[1];
    this.space.astX = 130;
    this.space.score = 0;
  }

  setupListeners() {
    // Touch/click detection with tap, double-tap, and long-press
    let touchDownTime = 0;
    let longPressTriggered = false;
    let longPressTimeout = null;
    let lastTapTime = 0;

    const onDown = (e) => {
      touchDownTime = Date.now();
      longPressTriggered = false;
      clearTimeout(longPressTimeout);
      longPressTimeout = setTimeout(() => {
        longPressTriggered = true;
        this.handleLongPress();
        this.triggerHapticEffect();
      }, 650);
    };

    const onUp = (e) => {
      clearTimeout(longPressTimeout);
      if (longPressTriggered) return;
      const duration = Date.now() - touchDownTime;
      if (duration < 600) {
        const timeSinceLastTap = Date.now() - lastTapTime;
        if (timeSinceLastTap < 320) {
          this.handleDoubleTap();
          lastTapTime = 0;
        } else {
          lastTapTime = Date.now();
          setTimeout(() => {
            if (lastTapTime !== 0 && Date.now() - lastTapTime >= 310) {
              this.handleTap();
              lastTapTime = 0;
            }
          }, 320);
        }
      }
    };

    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('mouseup', onUp);
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); onUp(e); }, { passive: false });

    // Track mouse on canvas/page to shift pupils
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (rect.width * 1.5);
      const dy = (e.clientY - centerY) / (rect.height * 1.5);
      this.targetShiftX = Math.max(-5, Math.min(5, dx * 6));
      this.targetShiftY = Math.max(-4, Math.min(4, dy * 5));
    });

    // Keyboard support for games & simulator
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleTap();
      } else if (e.code === 'KeyD') {
        this.handleDoubleTap();
      } else if (e.code === 'KeyM') {
        this.handleLongPress();
      }
    });
  }

  triggerHapticEffect() {
    if (this.canvas) {
      this.canvas.classList.add('pulse-active');
      setTimeout(() => this.canvas.classList.remove('pulse-active'), 200);
    }
  }

  // --- Main Animation Loop ---
  animate(now) {
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.animate);
  }

  update(dt) {
    // Smooth eye gaze shift
    this.eyeShiftX += (this.targetShiftX - this.eyeShiftX) * 0.15;
    this.eyeShiftY += (this.targetShiftY - this.eyeShiftY) * 0.15;

    // Natural blinking matching firmware (20 frames, random 3s-7s interval)
    const now = Date.now();
    if (!this.lastBlinkFrame) this.lastBlinkFrame = now;
    if (!this.blinkInterval) this.blinkInterval = 3000 + Math.random() * 4000;

    if (!this.isBlinking && now - this.lastBlinkTime > this.blinkInterval) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.lastBlinkTime = now;
      this.lastBlinkFrame = now;
    }
    if (this.isBlinking && now - this.lastBlinkFrame > 28) {
      this.lastBlinkFrame = now;
      this.blinkProgress++;
      if (this.blinkProgress > 20) {
        this.blinkProgress = 0;
        this.isBlinking = false;
        this.blinkInterval = 3000 + Math.random() * 4000;
      }
    }

    // Expression timers
    if (this.expression === 'HAPPY' && now > this.happyTimer) {
      this.expression = 'NORMAL';
    }
    if (this.expression === 'SPIRAL') {
      this.spiralAngle += 0.22;
      if (now > this.spiralTimer) {
        this.expression = 'NORMAL';
      }
    }

    // Game updates
    if (this.currentMode === this.MODES.GAME_FLAPPY) this.updateFlappy(dt);
    else if (this.currentMode === this.MODES.GAME_RUN) this.updateRunner(dt);
    else if (this.currentMode === this.MODES.GAME_SPACE) this.updateSpace(dt);
    
    // Pomodoro countdown
    if (this.pomoRunning && this.currentMode === this.MODES.POMO) {
      this.pomoSeconds -= dt;
      if (this.pomoSeconds <= 0) {
        this.pomoState = this.pomoState === 'WORK' ? 'BREAK' : 'WORK';
        this.pomoSeconds = this.pomoState === 'WORK' ? 25 * 60 : 5 * 60;
      }
    }
  }

  // --- Render Orchestrator ---
  render() {
    // Clear screen to deep OLED black
    this.ctx.fillStyle = '#020408';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context and scale virtual resolution to canvas size
    this.ctx.save();
    const scaleX = this.canvas.width / this.V_WIDTH;
    const scaleY = this.canvas.height / this.V_HEIGHT;
    this.ctx.scale(scaleX, scaleY);

    // Draw active mode
    switch (this.currentMode) {
      case this.MODES.FACE:
        this.drawFace();
        break;
      case this.MODES.TIME:
        this.drawTime();
        break;
      case this.MODES.DATE:
        this.drawDate();
        break;
      case this.MODES.MENU_MAIN:
        this.drawMainMenu();
        break;
      case this.MODES.MENU_GAMES:
        this.drawGamesMenu();
        break;
      case this.MODES.GAME_FLAPPY:
        this.drawFlappy();
        break;
      case this.MODES.GAME_RUN:
        this.drawRunner();
        break;
      case this.MODES.GAME_SPACE:
        this.drawSpace();
        break;
      case this.MODES.WATER:
        this.drawWater();
        break;
      case this.MODES.POMO:
        this.drawPomodoro();
        break;
      case this.MODES.BREATHE:
        this.drawBreathe();
        break;
      case this.MODES.STREAK:
        this.drawStreak();
        break;
      case this.MODES.MOTIVATION:
        this.drawMotivation();
        break;
      case this.MODES.WIFI_SETUP:
        this.drawWifiSetup();
        break;
      default:
        this.drawFace();
    }

    this.ctx.restore();
  }

  // --- Drawing Helpers (Retro Cyan OLED aesthetic) ---
  setColor(alpha = 1.0) {
    this.ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
  }

  drawOledHeader(title, icon = '') {
    this.setColor(0.9);
    this.ctx.font = '7px monospace';
    this.ctx.fillText(title, 4, 8);
    // Wifi signal icon at top-right
    this.ctx.fillRect(116, 6, 2, 2);
    this.ctx.fillRect(119, 4, 2, 4);
    this.ctx.fillRect(122, 2, 2, 6);
    this.ctx.lineWidth = 0.8;
    this.ctx.beginPath();
    this.ctx.moveTo(2, 10);
    this.ctx.lineTo(126, 10);
    this.ctx.stroke();
  }

  // --- Helpers matching Adafruit SSD1306 / GFX primitives ---
  drawRoundRect(x, y, w, h, r) {
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  fillRoundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawLine(x1, y1, x2, y2) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1 + 0.5, y1 + 0.5);
    this.ctx.lineTo(x2 + 0.5, y2 + 0.5);
    this.ctx.stroke();
  }

  drawPixel(x, y) {
    this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  fillCircle(cx, cy, r) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawCircle(cx, cy, r) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  // --- EXACT FIRMWARE drawOvalEye implementation ---
  drawOvalEye(x, y, w, h) {
    let ca = 0;
    if (this.isBlinking) {
      const t = this.blinkProgress / 20.0;
      ca = Math.floor(h * Math.sin(t * Math.PI));
    }

    // Outer rounded rectangle border (glow cyan)
    this.setColor(1.0);
    this.drawRoundRect(x - w / 2, y - h / 2, w, h, 7);

    // Inner deep black fill
    this.ctx.fillStyle = '#020408';
    this.fillRoundRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, 6);

    // Glowing cyan iris ring
    this.setColor(1.0);
    this.fillCircle(x, y, Math.floor(h / 3));

    // Inner black pupil hole
    this.ctx.fillStyle = '#020408';
    this.fillCircle(x, y, Math.floor(h / 4));

    // Specular highlight glints (twinkle sparkle dots)
    this.setColor(1.0);
    this.fillCircle(x - 4, y - 5, 2);
    this.fillCircle(x + 2, y - 1, 1);
    this.drawPixel(x - 2, y + 2);

    // Eyelid blink progressive drop
    if (ca > 0) {
      this.ctx.fillStyle = '#020408';
      this.ctx.fillRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, ca);
    }
  }

  // --- FACE VIEW (Exact firmware reproduction) ---
  drawFace() {
    const now = Date.now();
    if (this.expression === 'HAPPY') {
      this.drawHappy(now);
    } else if (this.expression === 'SPIRAL') {
      this.drawSpiralEyes(now);
    } else if (this.expression === 'SLEEP') {
      this.drawSleep(now);
    } else {
      this.drawNormal();
    }
  }

  // Firmware: drawNormal()
  drawNormal() {
    const shift = Math.round(this.eyeShiftX);
    this.drawOvalEye(42 + shift, 30, 26, 32);
    this.drawOvalEye(90 + shift, 30, 26, 32);

    if (!this.isBlinking) {
      this.setColor(1.0);
      this.ctx.lineWidth = 1.2;
      this.drawLine(59, 55, 63, 57);
      this.drawLine(63, 57, 67, 55);
    }
  }

  // Firmware: drawHappy()
  drawHappy(now) {
    const shift = Math.round(this.eyeShiftX);
    this.drawOvalEye(40 + shift, 28, 26, 32);
    this.drawOvalEye(88 + shift, 28, 26, 32);

    if (!this.isBlinking) {
      this.setColor(1.0);
      this.ctx.lineWidth = 1.0;
      // 3 horizontal blush lines under each eye
      for (let i = 0; i < 3; i++) {
        this.drawLine(30 + shift, 44 + i, 50 + shift, 44 + i);
        this.drawLine(78 + shift, 44 + i, 98 + shift, 44 + i);
      }
      // Animated smiling mouth
      const mouthPhase = Math.floor(now / 140) % 3;
      const bw = 16 + mouthPhase * 4;
      this.ctx.lineWidth = 1.4;
      this.drawLine(64 - bw / 2, 54, 64, 58);
      this.drawLine(64, 58, 64 + bw / 2, 54);
    }
  }

  // Firmware: drawSpiralEyes()
  drawSpiralEyes(now) {
    const shift = Math.round(this.eyeShiftX);
    this.setColor(1.0);
    this.drawBigSpiral(40 + shift, 30, 16, now);
    this.drawBigSpiral(88 + shift, 30, 16, now);

    // Wavy mouth
    for (let i = 0; i < 24; i++) {
      const x = 40 + i * 2;
      const y = 55 + Math.floor(Math.sin(i * 0.5 + now / 200.0) * 3);
      this.drawPixel(x, y);
    }
  }

  // Firmware: drawBigSpiral()
  drawBigSpiral(cx, cy, r, now) {
    const ma = 6.28 * 3.5;
    const ro = (now * 0.008);
    for (let a = 0; a < ma; a += 0.15) {
      const x = cx + Math.floor(Math.cos(a + ro) * (r * a / ma));
      const y = cy + Math.floor(Math.sin(a + ro) * (r * a / ma));
      if (x >= 0 && x < 128 && y >= 0 && y < 64) {
        this.drawPixel(x, y);
      }
    }
  }

  // Firmware: drawSleepEye()
  drawSleepEye(x, y, w, h) {
    this.setColor(1.0);
    this.drawRoundRect(x - w / 2, y - h / 2, w, h, 7);

    this.ctx.fillStyle = '#020408';
    this.fillRoundRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, 6);

    // Closed eyelid curve inside eye
    this.setColor(1.0);
    this.ctx.lineWidth = 1.0;
    this.drawLine(x - 10, y + 1, x - 4, y + 5);
    this.drawLine(x - 4, y + 5, x + 4, y + 5);
    this.drawLine(x + 4, y + 5, x + 10, y + 1);

    this.drawLine(x - 10, y + 2, x - 4, y + 6);
    this.drawLine(x - 4, y + 6, x + 4, y + 6);
    this.drawLine(x + 4, y + 6, x + 10, y + 2);
  }

  // Firmware: drawSleep()
  drawSleep(now) {
    const shift = Math.round(this.eyeShiftX);
    const bob = Math.floor(Math.sin(now / 900.0) * 1.5);

    this.drawSleepEye(42 + shift, 30 + bob, 26, 32);
    this.drawSleepEye(90 + shift, 31 + bob, 26, 32);

    this.setColor(1.0);
    this.drawPixel(50, 50 + bob);
    this.drawPixel(78, 50 + bob);

    // Resting mouth breathing expansion
    const mo = 1 + Math.floor((Math.sin(now / 420.0) + 1) * 1.5);
    const ml = Math.floor(Math.sin(now / 520.0) * 1);
    this.drawRoundRect(60, 54 + bob + ml, 8, mo, 2);

    // Rising Z z z letters
    const rise = Math.floor(now / 55) % 40;
    const z1y = 34 + bob - rise;
    const z2y = 24 + bob - rise;
    const z3y = 12 + bob - rise;

    this.ctx.font = '7px monospace';
    if (z1y > 0 && z1y < 64) {
      this.ctx.fillText('z', 98, z1y);
    }
    if (z2y > 0 && z2y < 64) {
      this.ctx.fillText('z', 106, z2y);
    }
    if (z3y > -8 && z3y < 64) {
      this.ctx.font = 'bold 10px monospace';
      this.ctx.fillText('Z', 114, z3y);
    }

    // Twinkling stars
    if (Math.floor(now / 1800) % 2 === 0) {
      this.drawPixel(18, 12);
      this.drawPixel(112, 14);
    }
  }

  // --- CLOCK & DATE ---
  drawTime() {
    this.drawOledHeader('TIME • AUTO SYNC');
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes}`;

    this.setColor(1.0);
    this.ctx.font = 'bold 22px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(timeStr, 54, 38);

    this.ctx.font = '8px monospace';
    this.ctx.fillText(ampm, 98, 26);
    this.ctx.fillText(`:${seconds}`, 98, 38);

    // Bottom hint
    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: BACK | HOLD: FACE', 64, 57);
    this.ctx.textAlign = 'left';
  }

  drawDate() {
    this.drawOledHeader('DATE • CALENDAR');
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    this.setColor(1.0);
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.fillText(dayName, 64, 26);

    this.ctx.font = '14px monospace';
    this.ctx.fillText(`${monthName} ${dateNum}, ${year}`, 64, 42);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: BACK | HOLD: FACE', 64, 57);
    this.ctx.textAlign = 'left';
  }

  // --- MENUS ---
  drawMainMenu() {
    this.drawOledHeader('MAIN MENU');
    this.setColor(1.0);
    this.ctx.font = '8px monospace';

    // Show visible slice
    const visibleCount = 3;
    const startIdx = Math.max(0, Math.min(this.mainMenuIndex - 1, this.mainMenuItems.length - visibleCount));
    
    for (let i = 0; i < visibleCount; i++) {
      const itemIdx = startIdx + i;
      if (itemIdx >= this.mainMenuItems.length) break;
      const y = 22 + i * 12;
      const isSelected = itemIdx === this.mainMenuIndex;

      if (isSelected) {
        this.ctx.fillRect(8, y - 8, 112, 11);
        this.ctx.fillStyle = '#020408';
        this.ctx.fillText(`> ${this.mainMenuItems[itemIdx]}`, 14, y);
        this.setColor(1.0);
      } else {
        this.ctx.fillText(`  ${this.mainMenuItems[itemIdx]}`, 14, y);
      }
    }

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: NEXT | HOLD: SELECT | DBL: BACK', 4, 60);
  }

  drawGamesMenu() {
    this.drawOledHeader('ARCADE GAMES');
    this.setColor(1.0);
    this.ctx.font = '8px monospace';

    for (let i = 0; i < this.gamesMenuItems.length; i++) {
      const y = 22 + i * 12;
      const isSelected = i === this.gamesMenuIndex;

      if (isSelected) {
        this.ctx.fillRect(8, y - 8, 112, 11);
        this.ctx.fillStyle = '#020408';
        this.ctx.fillText(`> ${this.gamesMenuItems[i]}`, 14, y);
        this.setColor(1.0);
      } else {
        this.ctx.fillText(`  ${this.gamesMenuItems[i]}`, 14, y);
      }
    }

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: NEXT | HOLD: PLAY | DBL: BACK', 4, 60);
  }

  // --- GAME 1: FLAPPY TWINKLE ---
  updateFlappy(dt) {
    if (this.flappy.state !== 'PLAYING') return;

    this.flappy.velY += this.flappy.gravity;
    this.flappy.birdY += this.flappy.velY;

    // Move pipe
    this.flappy.pipeX -= 1.4;
    if (this.flappy.pipeX < -this.flappy.pipeW) {
      this.flappy.pipeX = 130;
      this.flappy.gapY = 10 + Math.floor(Math.random() * 20);
      this.flappy.score++;
      if (this.flappy.score > this.flappy.highScore) {
        this.flappy.highScore = this.flappy.score;
      }
    }

    // Floor and ceiling collisions
    if (this.flappy.birdY < 2 || this.flappy.birdY > 58) {
      this.flappy.state = 'GAMEOVER';
    }

    // Pipe collision
    const birdBox = { x: this.flappy.birdX, y: this.flappy.birdY, w: 9, h: 8 };
    if (birdBox.x + birdBox.w > this.flappy.pipeX && birdBox.x < this.flappy.pipeX + this.flappy.pipeW) {
      if (birdBox.y < this.flappy.gapY || birdBox.y + birdBox.h > this.flappy.gapY + this.flappy.gapH) {
        this.flappy.state = 'GAMEOVER';
      }
    }
  }

  drawFlappy() {
    this.setColor(1.0);
    this.ctx.lineWidth = 1;

    // Ground line
    this.ctx.beginPath();
    this.ctx.moveTo(0, 60);
    this.ctx.lineTo(128, 60);
    this.ctx.stroke();

    // Top & Bottom Pipes
    const px = Math.floor(this.flappy.pipeX);
    const pw = this.flappy.pipeW;
    const gapY = this.flappy.gapY;
    const gapH = this.flappy.gapH;

    // Top pipe
    this.ctx.strokeRect(px, 0, pw, gapY);
    this.ctx.fillRect(px - 1, gapY - 3, pw + 2, 3);

    // Bottom pipe
    this.ctx.strokeRect(px, gapY + gapH, pw, 60 - (gapY + gapH));
    this.ctx.fillRect(px - 1, gapY + gapH, pw + 2, 3);

    // Bird (Cute mini Twinkle face with wing)
    const bx = this.flappy.birdX;
    const by = Math.floor(this.flappy.birdY);
    this.ctx.fillRect(bx, by, 9, 8);
    this.ctx.fillStyle = '#020408';
    this.ctx.fillRect(bx + 5, by + 2, 2, 2); // eye
    this.setColor(1.0);
    // Wing flap
    const wingY = (this.flappy.velY < 0) ? by + 4 : by + 1;
    this.ctx.fillRect(bx - 3, wingY, 3, 2);

    // Score indicator
    this.ctx.font = '8px monospace';
    this.ctx.fillText(`${this.flappy.score}`, 60, 10);

    // Overlay if ready or gameover
    if (this.flappy.state === 'READY') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.75)';
      this.ctx.fillRect(14, 15, 100, 34);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('FLAPPY TWINKLE', 64, 27);
      this.ctx.font = '7px monospace';
      this.ctx.fillText('TAP TO FLAP & START', 64, 38);
      this.ctx.textAlign = 'left';
    } else if (this.flappy.state === 'GAMEOVER') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
      this.ctx.fillRect(16, 14, 96, 36);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('GAME OVER', 64, 25);
      this.ctx.font = '7px monospace';
      this.ctx.fillText(`SCORE: ${this.flappy.score}  BEST: ${this.flappy.highScore}`, 64, 34);
      this.ctx.font = '6px monospace';
      this.ctx.fillText('TAP: AGAIN | DBL: EXIT', 64, 44);
      this.ctx.textAlign = 'left';
    }
  }

  // --- GAME 2: TWINKLE RUN ---
  updateRunner(dt) {
    if (this.runner.state !== 'PLAYING') return;

    // Gravity & Jump
    this.runner.velY += this.runner.gravity;
    this.runner.playerY += this.runner.velY;
    if (this.runner.playerY >= this.runner.groundY) {
      this.runner.playerY = this.runner.groundY;
      this.runner.velY = 0;
    }

    // Move obstacle
    this.runner.obsX -= this.runner.speed;
    if (this.runner.obsX < -this.runner.obsW) {
      this.runner.obsX = 130 + Math.floor(Math.random() * 40);
      this.runner.score++;
      if (this.runner.score > this.runner.highScore) {
        this.runner.highScore = this.runner.score;
      }
    }

    // Collision check
    const pBox = { x: this.runner.playerX, y: this.runner.playerY - 10, w: 9, h: 10 };
    const oBox = { x: this.runner.obsX, y: this.runner.groundY - this.runner.obsH, w: this.runner.obsW, h: this.runner.obsH };
    
    if (pBox.x + pBox.w > oBox.x && pBox.x < oBox.x + oBox.w) {
      if (pBox.y + pBox.h > oBox.y) {
        this.runner.state = 'GAMEOVER';
      }
    }
  }

  drawRunner() {
    this.setColor(1.0);

    // Ground
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.runner.groundY);
    this.ctx.lineTo(128, this.runner.groundY);
    this.ctx.stroke();

    // Moving ground dash marks
    const offset = (Date.now() / 20) % 12;
    for (let x = -offset; x < 128; x += 12) {
      this.ctx.fillRect(x, this.runner.groundY + 3, 6, 1);
    }

    // Runner character (Twinkle jumping)
    const px = this.runner.playerX;
    const py = Math.floor(this.runner.playerY);
    this.ctx.fillRect(px, py - 10, 9, 10);
    this.ctx.fillStyle = '#020408';
    this.ctx.fillRect(px + 6, py - 8, 2, 2); // eyes
    this.setColor(1.0);

    // Obstacle (Cactus / hurdle)
    const ox = Math.floor(this.runner.obsX);
    const oh = this.runner.obsH;
    this.ctx.fillRect(ox, this.runner.groundY - oh, 3, oh);
    this.ctx.fillRect(ox + 4, this.runner.groundY - (oh - 3), 3, oh - 3);

    // Score
    this.ctx.font = '8px monospace';
    this.ctx.fillText(`SCORE: ${this.runner.score}`, 70, 10);

    if (this.runner.state === 'READY') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.75)';
      this.ctx.fillRect(16, 15, 96, 32);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('TWINKLE RUN', 64, 27);
      this.ctx.font = '7px monospace';
      this.ctx.fillText('TAP TO JUMP & START', 64, 38);
      this.ctx.textAlign = 'left';
    } else if (this.runner.state === 'GAMEOVER') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
      this.ctx.fillRect(16, 14, 96, 36);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('CRASHED!', 64, 25);
      this.ctx.font = '7px monospace';
      this.ctx.fillText(`SCORE: ${this.runner.score}  BEST: ${this.runner.highScore}`, 64, 34);
      this.ctx.font = '6px monospace';
      this.ctx.fillText('TAP: RETRY | DBL: EXIT', 64, 44);
      this.ctx.textAlign = 'left';
    }
  }

  // --- GAME 3: SPACE RUSH ---
  updateSpace(dt) {
    if (this.space.state !== 'PLAYING') return;

    // Target lane smoothing
    const targetY = this.space.lanes[this.space.currentLane];
    this.space.shipY += (targetY - this.space.shipY) * 0.25;

    // Asteroid moving left
    this.space.astX -= this.space.speed;
    if (this.space.astX < -10) {
      this.space.astX = 130;
      this.space.astLane = Math.floor(Math.random() * 3);
      this.space.score++;
      if (this.space.score > this.space.highScore) {
        this.space.highScore = this.space.score;
      }
    }

    // Collision check
    const astY = this.space.lanes[this.space.astLane];
    if (this.space.astX < 32 && this.space.astX > 14) {
      if (Math.abs(this.space.shipY - astY) < 8) {
        this.space.state = 'GAMEOVER';
      }
    }
  }

  drawSpace() {
    this.setColor(1.0);

    // Stars drifting background
    for (let star of this.space.stars) {
      this.ctx.fillRect(star.x, star.y, 1, 1);
      star.x -= star.s;
      if (star.x < 0) star.x = 128;
    }

    // Lane dividing dashed lines
    this.setColor(0.25);
    this.ctx.setLineDash([2, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, 22);
    this.ctx.lineTo(128, 22);
    this.ctx.moveTo(0, 38);
    this.ctx.lineTo(128, 38);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Spaceship (Rocket Twinkle)
    this.setColor(1.0);
    const sx = 20;
    const sy = Math.floor(this.space.shipY);
    this.ctx.beginPath();
    this.ctx.moveTo(sx + 8, sy);
    this.ctx.lineTo(sx - 3, sy - 5);
    this.ctx.lineTo(sx, sy);
    this.ctx.lineTo(sx - 3, sy + 5);
    this.ctx.closePath();
    this.ctx.fill();
    // Engine flame
    if (Math.random() > 0.3) {
      this.ctx.fillRect(sx - 6, sy - 1, 3, 2);
    }

    // Asteroid
    const ax = Math.floor(this.space.astX);
    const ay = this.space.lanes[this.space.astLane];
    this.ctx.strokeRect(ax - 4, ay - 4, 8, 8);
    this.ctx.fillRect(ax - 2, ay - 2, 4, 4);

    // Score
    this.ctx.font = '8px monospace';
    this.ctx.fillText(`DIST: ${this.space.score}`, 70, 10);

    if (this.space.state === 'READY') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.75)';
      this.ctx.fillRect(16, 15, 96, 32);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('SPACE RUSH', 64, 27);
      this.ctx.font = '7px monospace';
      this.ctx.fillText('TAP TO SHIFT LANES', 64, 38);
      this.ctx.textAlign = 'left';
    } else if (this.space.state === 'GAMEOVER') {
      this.ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
      this.ctx.fillRect(16, 14, 96, 36);
      this.setColor(1.0);
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 9px monospace';
      this.ctx.fillText('COLLISION!', 64, 25);
      this.ctx.font = '7px monospace';
      this.ctx.fillText(`SCORE: ${this.space.score}  BEST: ${this.space.highScore}`, 64, 34);
      this.ctx.font = '6px monospace';
      this.ctx.fillText('TAP: RETRY | DBL: EXIT', 64, 44);
      this.ctx.textAlign = 'left';
    }
  }

  // --- WELLNESS SCREENS ---
  drawWater() {
    this.drawOledHeader('WATER REMINDER');
    this.setColor(1.0);

    // Cup outline
    this.ctx.strokeRect(26, 20, 18, 22);
    // Water level inside cup
    const h = (this.waterCount / 6) * 18;
    this.ctx.fillRect(28, 40 - h, 14, h);

    // Details
    this.ctx.font = '8px monospace';
    this.ctx.fillText(`INTERVAL: ${this.waterIntervals[this.waterIdx]}`, 52, 28);
    this.ctx.fillText(`TODAY: ${this.waterCount}/6 CUPS`, 52, 38);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: INTERVAL | DBL: SAVE', 4, 58);
  }

  drawPomodoro() {
    this.drawOledHeader('POMODORO FOCUS');
    this.setColor(1.0);

    const mins = String(Math.floor(this.pomoSeconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(this.pomoSeconds % 60)).padStart(2, '0');

    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(`${mins}:${secs}`, 64, 32);

    this.ctx.font = '8px monospace';
    this.ctx.fillText(`PHASE: ${this.pomoState} ${this.pomoRunning ? '●' : '❚❚'}`, 64, 44);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: START/PAUSE | DBL: BACK', 64, 57);
    this.ctx.textAlign = 'left';
  }

  drawBreathe() {
    this.drawOledHeader('MINDFUL BREATHE');
    this.setColor(1.0);

    const elapsed = (Date.now() - this.breatheStart) % 10000;
    const isInhale = elapsed < 4000;
    const progress = isInhale ? elapsed / 4000 : 1 - (elapsed - 4000) / 6000;
    const radius = 6 + progress * 14;

    // Expanding breathing circle
    this.ctx.beginPath();
    this.ctx.arc(64, 32, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.textAlign = 'center';
    this.ctx.font = '8px monospace';
    this.ctx.fillText(isInhale ? 'BREATHE IN...' : 'BREATHE OUT...', 64, 52);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('1-MIN RELAXATION SESSION', 64, 60);
    this.ctx.textAlign = 'left';
  }

  drawStreak() {
    this.drawOledHeader('DAILY HABIT STREAK');
    this.setColor(1.0);

    // Draw Flame icon
    this.ctx.beginPath();
    this.ctx.moveTo(34, 40);
    this.ctx.quadraticCurveTo(28, 30, 36, 20);
    this.ctx.quadraticCurveTo(42, 28, 44, 40);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.font = 'bold 14px monospace';
    this.ctx.fillText(`${this.streakCount} DAYS`, 52, 32);
    this.ctx.font = '7px monospace';
    this.ctx.fillText('KEEP THE FLAME LIT!', 52, 42);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: BACK | HOLD: FACE', 4, 58);
  }

  drawMotivation() {
    this.drawOledHeader('DAILY MOTIVATION');
    this.setColor(1.0);
    const quote = this.quotes[this.motivationIdx % this.quotes.length];

    // Word wrap into lines of up to 21 characters (matching Arduino OLED logic)
    const words = quote.split(' ');
    let lines = [];
    let curLine = '';
    for (let w of words) {
      if ((curLine ? curLine + ' ' + w : w).length <= 21) {
        curLine = curLine ? curLine + ' ' + w : w;
      } else {
        if (curLine) lines.push(curLine);
        curLine = w;
      }
    }
    if (curLine) lines.push(curLine);

    this.ctx.font = '7.5px monospace';
    this.ctx.textAlign = 'center';
    const startY = 32 - ((lines.length - 1) * 5);
    lines.forEach((line, idx) => {
      this.ctx.fillText(line, 64, startY + (idx * 10));
    });
    this.ctx.textAlign = 'left';

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('TAP: DISMISS & SMILE (1/DAY)', 4, 58);
  }

  drawWifiSetup() {
    this.drawOledHeader('WI-FI SETUP HOTSPOT');
    this.setColor(1.0);
    
    // QR Code simulation
    this.ctx.fillRect(10, 16, 28, 28);
    this.ctx.fillStyle = '#020408';
    this.ctx.fillRect(14, 20, 6, 6);
    this.ctx.fillRect(28, 20, 6, 6);
    this.ctx.fillRect(14, 34, 6, 6);
    this.ctx.fillRect(24, 30, 4, 4);

    this.setColor(1.0);
    this.ctx.font = '7px monospace';
    this.ctx.fillText('SSID: Twinkle-Setup', 44, 24);
    this.ctx.fillText('IP: 192.168.4.1', 44, 34);
    this.ctx.fillText('Scan to Connect', 44, 44);

    this.setColor(0.65);
    this.ctx.font = '6px monospace';
    this.ctx.fillText('WAITING FOR DEVICE...', 4, 58);
  }
}

// Global initialization helper
window.addEventListener('DOMContentLoaded', () => {
  const heroCanvas = document.getElementById('heroOledCanvas') || document.getElementById('twinkleOledCanvas');
  if (heroCanvas) {
    window.twinkleHeroSimulator = new TwinkleScreen(heroCanvas.id);
  }

  const expCanvas = document.getElementById('experienceOledCanvas');
  if (expCanvas) {
    window.twinkleSimulator = new TwinkleScreen(expCanvas.id);
  } else if (window.twinkleHeroSimulator) {
    window.twinkleSimulator = window.twinkleHeroSimulator;
  }
});
