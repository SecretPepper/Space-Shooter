const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* =========================
   LOAD IMAGES
========================= */

const playerImg = new Image();
playerImg.src = "ship_player.png";

const heartImg = new Image();
heartImg.src = "heart.png";

const enemyImgs = [
    new Image(),
    new Image(),
    new Image()
];

enemyImgs[0].src = "ship_stage1.png";
enemyImgs[1].src = "ship_stage2.png";
enemyImgs[2].src = "ship_stage3.png";

/* =========================
   DOM ELEMENTS
========================= */

const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const playAgainBtn = document.getElementById("playAgainBtn");

playAgainBtn.addEventListener("click", resetGame);

/* =========================
   GAME STATE
========================= */

let score = 0;
let level = 1;
let gameOver = false;
let playerLives = 5;

let shootCooldown = 300;
let lastShotTime = 0;

/* =========================
   PLAYER
========================= */

const player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 80,
    height: 80,
    speed: 5,
    angle: 0
};

let keys = {};
let bullets = [];
let enemies = [];

/* =========================
   CONTROLS
========================= */

document.addEventListener("keydown", e => {
    keys[e.key] = true;

    if (e.key === " " && !gameOver) {
        tryShoot();
    }
});

document.addEventListener("keyup", e => {
    keys[e.key] = false;
});

/* =========================
   SHOOTING
========================= */

function tryShoot() {
    const now = Date.now();
    if (now - lastShotTime > shootCooldown) {
        shoot();
        lastShotTime = now;
    }
}

function shoot() {
    const speed = 9;

    bullets.push({
        x: player.x,
        y: player.y,
        width: 6,
        height: 12,
        dx: Math.sin(player.angle) * speed,
        dy: -Math.cos(player.angle) * speed
    });
}

/* =========================
   ENEMY SPAWN
========================= */

function spawnEnemy() {
    if (gameOver) return;

    level = Math.floor(score / 400) + 1;

    let random = Math.random();
    let type;

    if (random < 0.7) {
        type = 1;
    } else if (random < 0.95) {
        type = 2;
    } else {
        type = level > 5 ? 3 : 2;
    }

    const baseSpeed = 1 + level * 0.15;

    let speed;
    let hp;

    if (type === 1) {
        speed = baseSpeed;
        hp = 1;
    } else if (type === 2) {
        speed = baseSpeed + 0.8;
        hp = 1;
    } else {
        speed = baseSpeed + 1.2;
        hp = 2;
    }

    enemies.push({
        x: Math.random() * (canvas.width - 80),
        y: -100,
        width: 80,
        height: 80,
        speed,
        type,
        hp
    });
}

setInterval(spawnEnemy, 1500);

/* =========================
   UPDATE
========================= */

function update() {
    if (gameOver) return;

    /* Movement */
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    /* Rotation */
    if (keys["ArrowLeft"]) player.angle -= 0.05;
    if (keys["ArrowRight"]) player.angle += 0.05;

    player.x = Math.max(40, Math.min(canvas.width - 40, player.x));
    player.y = Math.max(40, Math.min(canvas.height - 40, player.y));

    /* Bullets */
    bullets.forEach((bullet, i) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ) {
            bullets.splice(i, 1);
        }
    });

    /* Enemies */
    enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;

        if (enemy.y > canvas.height) {
            enemies.splice(eIndex, 1);
            loseLife();
        }

        bullets.forEach((bullet, bIndex) => {
            if (collision(bullet, enemy)) {
                bullets.splice(bIndex, 1);
                enemy.hp--;

                if (enemy.hp <= 0) {
                    enemies.splice(eIndex, 1);
                    score += 10 * enemy.type;
                }
            }
        });

        if (collision(playerHitbox(), enemy)) {
            enemies.splice(eIndex, 1);
            loseLife();
        }
    });

    scoreDisplay.innerText = `Score: ${score} | Level: ${level}`;

    if (playerLives <= 0) {
        endGame();
    }
}

/* =========================
   LIFE
========================= */

function loseLife() {
    playerLives--;
}

function endGame() {
    gameOver = true;
    gameOverScreen.style.visibility = "visible";
    gameOverScreen.style.opacity = "1";
}

/* =========================
   COLLISION
========================= */

function collision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function playerHitbox() {
    return {
        x: player.x - player.width / 2,
        y: player.y - player.height / 2,
        width: player.width,
        height: player.height
    };
}

/* =========================
   DRAW
========================= */

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Player */
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(
        playerImg,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
    );
    ctx.restore();

    /* Bullets */
    ctx.fillStyle = "lime";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    /* Enemies (rotated 180°) */
    enemies.forEach(enemy => {
        const img = enemyImgs[enemy.type - 1];

        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(
            img,
            -enemy.width / 2,
            -enemy.height / 2,
            enemy.width,
            enemy.height
        );
        ctx.restore();
    });

    /* Hearts */
    for (let i = 0; i < playerLives; i++) {
        ctx.drawImage(heartImg, canvas.width - 40 - i * 40, 20, 30, 30);
    }
}

/* =========================
   RESET
========================= */

function resetGame() {
    score = 0;
    level = 1;
    playerLives = 5;
    bullets = [];
    enemies = [];
    player.angle = 0;
    gameOver = false;

    // ✅ Reset player position to bottom middle
    player.x = canvas.width / 2;
    player.y = canvas.height - 120;

    gameOverScreen.style.visibility = "hidden";
    gameOverScreen.style.opacity = "0";
}

/* =========================
   LOOP
========================= */

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
