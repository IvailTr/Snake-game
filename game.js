const GRID_SIZE = 40;
const GRID_COUNT = 20;
const CANVAS_SIZE = GRID_SIZE * GRID_COUNT;
const FOOD_COLOR = '#e74c3c';
const GRID_COLOR = '#ddd';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreBoard = document.getElementById('scoreBoard');
const scoreSpan = document.getElementById('score');
const scoreList = document.getElementById('scoreList');

let snake = [];
let food = {};
let dx = GRID_SIZE;
let dy = 0;
let changingDirection = false;
let score = 0;
let highScores = [];
let gameLoopInterval;
let headColor = '#2ecc71'; // Default head color
let bodyColors = ['#25a25a', '#3498db', '#9b59b6', '#e91e63', '#f39c12']; // Default body colors
var gameRunning = false;

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
document.addEventListener('keydown', changeDirection);

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    canvas.style.display = 'block';
    scoreBoard.style.display = 'block';
    snakeVisualization.style.display = 'none';
    document.getElementById('easyButton').style.display = 'none';
    document.getElementById('normalButton').style.display = 'none';
    document.getElementById('hardButton').style.display = 'none';
    gameRunning = true;
    score = 0;
    scoreSpan.textContent = score;

    // Вземаме цветовете от визуализацията
    headColor = getComputedStyle(document.getElementById('snakeHead')).backgroundColor;
    const snakeBodyParts = document.querySelectorAll('.snake-part.body');
    bodyColors = Array.from(snakeBodyParts).map(part => getComputedStyle(part).backgroundColor);

    // Инициализираме змията само с главата
    snake = [{ x: 10 * GRID_SIZE, y: 10 * GRID_SIZE, color: headColor }];
    dx = GRID_SIZE;
    dy = 0;
    food = generateFoodPosition();
    generateLake();
    // Стартираме таймерите за златната и черната храна
    startGoldenFoodTimer();
    startBlackFoodTimer();

    // Прилагаме цвета на главата на змията
    applySnakeColors();

    // Стартираме основната игрова функция
    main();
}

function initializeGame(headColor, bodyColors) {
    snake = [
        { x: GRID_SIZE * 2, y: 0, color: headColor }, // Head
        { x: GRID_SIZE, y: 0, color: bodyColors[0] },
        { x: 0, y: 0, color: bodyColors[1] },
        { x: -GRID_SIZE, y: 0, color: bodyColors[2] },
        { x: -GRID_SIZE * 2, y: 0, color: bodyColors[3] },
        { x: -GRID_SIZE * 3, y: 0, color: bodyColors[4] },
    ];

    score = 0;
    dx = GRID_SIZE;
    dy = 0;
    changingDirection = false;
    // generateFood();
    generateLake();
}

function applySnakeColors() {
    const snakeHead = document.getElementById('snakeHead');
    snakeHead.style.backgroundColor = headColor;

    const snakeBodyParts = document.querySelectorAll('.snake-part.body');
    snakeBodyParts.forEach((part, index) => {
        part.style.backgroundColor = bodyColors[index % bodyColors.length];
    });
}

function initializeSnake() {
    // Определяне на главата на змията
    const snakeHead = document.getElementById('snakeHead');
    snakeHead.style.backgroundColor = headColor;

    // Определяне на тялото на змията
    const snakeParts = document.querySelectorAll('.snake-part.body');
    snakeParts.forEach((part, index) => {
        const colorIndex = index % bodyColors.length;
        part.style.backgroundColor = bodyColors[colorIndex];
    });
}
function updateSnakeColors() {
    initializeSnake();
}

/*-------------------*/
let gameSpeed = 100; // Стандартна скорост (нормална)

const LAKE_COLOR = '#3498db';
let lake = [];

// Функция за генериране на езерото
function generateLake() {
    const lakeSize = Math.floor(Math.random() * 12) + 3; // Размер на езерото от 3 до 7 квадратчета
    let startX = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;
    let startY = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;

    lake = [{ x: startX, y: startY }];

    while (lake.length < lakeSize) {
        let direction = Math.floor(Math.random() * 4); // 0 = left, 1 = up, 2 = right, 3 = down
        let lastSquare = lake[lake.length - 1];
        let newSquare;

        switch (direction) {
            case 0: // left
                newSquare = { x: lastSquare.x - GRID_SIZE, y: lastSquare.y };
                break;
            case 1: // up
                newSquare = { x: lastSquare.x, y: lastSquare.y - GRID_SIZE };
                break;
            case 2: // right
                newSquare = { x: lastSquare.x + GRID_SIZE, y: lastSquare.y };
                break;
            case 3: // down
                newSquare = { x: lastSquare.x, y: lastSquare.y + GRID_SIZE };
                break;
        }

        // Проверка дали новото квадратче е в рамките на картата и не е вече част от езерото
        if (newSquare.x >= 0 && newSquare.x < CANVAS_SIZE &&
            newSquare.y >= 0 && newSquare.y < CANVAS_SIZE &&
            !lake.some(square => square.x === newSquare.x && square.y === newSquare.y)) {
            lake.push(newSquare);
        }
    }
}

// Функция за рисуване на езерото
function drawLake() {
    ctx.fillStyle = LAKE_COLOR;
    ctx.strokeStyle = '#000';
    lake.forEach(square => {
        ctx.fillRect(square.x, square.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(square.x, square.y, GRID_SIZE, GRID_SIZE);
    });
}

// Main game loop
function main() {
    if (gameOver()) {
        endGame();
        return;
    }

    if (gameRunning) {
        setTimeout(function onTick() {
            clearCanvas();
            drawGrid();
            drawLake(); // Ако има функция за рисуване на езерото
            moveSnake();
           
            if (checkFoodCollision()) {
                growSnake();
                score += 10;
                scoreSpan.textContent = score;
                food = generateFoodPosition();
            }
            if (checkGoldenFoodCollision()) {
                eatGoldenFood();
            }
            const blackFoodIndex = checkBlackFoodCollision();
            if (blackFoodIndex !== -1) {
                eatBlackFood(blackFoodIndex);
            }
            if (checkOrangeFoodCollision()) {
                eatOrangeFood(); // Изядете оранжевото хранително вещество
            }
            drawSnake();
            drawFood();
            drawOrangeFood(); // Рисуване на оранжевото хранително вещество
            if (goldenFoodActive) {
                drawGoldenFood();
            }
            drawBlackFoods();
            main();
        }, gameSpeed);

        setTimeout(function onTick() {
            moveOrangeFood(); // Движение на оранжевото хранително вещество
        }, (gameSpeed + 21));
    }
}

const ORANGE_FOOD_COLOR = '#e67e22';
let orangeFood = { x: 0, y: 0, dx: GRID_SIZE, dy: 0 };

function generateOrangeFoodPosition() {
    orangeFood.x = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;
    orangeFood.y = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;
    orangeFood.dx = GRID_SIZE; // Начална посока на движение надясно
    orangeFood.dy = 0;
}

function moveOrangeFood() {
    // Движение на оранжевото квадратче
    orangeFood.x += orangeFood.dx;
    orangeFood.y += orangeFood.dy;

    // Проверка за сблъсък със стените и промяна на посоката
    if (orangeFood.x < 0) {
        orangeFood.x = 0;
        orangeFood.dx = GRID_SIZE;
        orangeFood.dy = 0;
    } else if (orangeFood.x >= CANVAS_SIZE) {
        orangeFood.x = CANVAS_SIZE - GRID_SIZE;
        orangeFood.dx = -GRID_SIZE;
        orangeFood.dy = 0;
    } else if (orangeFood.y < 0) {
        orangeFood.y = 0;
        orangeFood.dx = 0;
        orangeFood.dy = GRID_SIZE;
    } else if (orangeFood.y >= CANVAS_SIZE) {
        orangeFood.y = CANVAS_SIZE - GRID_SIZE;
        orangeFood.dx = 0;
        orangeFood.dy = -GRID_SIZE;
    }
}

function drawOrangeFood() {
    ctx.fillStyle = ORANGE_FOOD_COLOR;
    ctx.strokeStyle = '#000';
    ctx.fillRect(orangeFood.x, orangeFood.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(orangeFood.x, orangeFood.y, GRID_SIZE, GRID_SIZE);
}

function checkOrangeFoodCollision() {
    if (snake[0].x === orangeFood.x || snake[0].y === orangeFood.y) {
        console.log(snake[0].x + '===' + orangeFood.x + '&&' + snake[0].y + '===' + orangeFood.y);
    }
    if (snake[0].x === orangeFood.x && snake[0].y === orangeFood.y) {
        console.log('111');
        return true;
    }
    return false;
}

function eatOrangeFood() {
    console.log('lenght: ' + snake.length);
    if (snake.length > 1) {
        snake.pop(); // Премахване на последния елемент от тялото на змията
    } else {
        console.log('йййй');
    }
    generateOrangeFoodPosition(); // Генериране на нова позиция за оранжевото квадратче
}

// Начална позиция на оранжевото квадратче
generateOrangeFoodPosition();



















// // Main game loop
// function main() {
//     if (gameOver()) {
//         endGame();
//         return;
//     }

//     if (gameRunning) {
//         setTimeout(function onTick() {
//             clearCanvas();
//             drawGrid();
//             drawLake(); // Добавяме рисуване на езерото
//             moveSnake();
//             moveOrangeFood(); // Движение на оранжевото квадратче
//             if (checkFoodCollision()) {
//                 growSnake();
//                 score += 10;
//                 scoreSpan.textContent = score;
//                 food = generateFoodPosition();
//             }
//             if (checkGoldenFoodCollision()) {
//                 eatGoldenFood();
//             }
//             const blackFoodIndex = checkBlackFoodCollision();
//             if (blackFoodIndex !== -1) {
//                 eatBlackFood(blackFoodIndex);
//             }
//             drawSnake();
//             drawFood();
//              drawOrangeFood();
//             if (goldenFoodActive) {
//                 drawGoldenFood();
//             }
//             drawBlackFoods();
//             main();
//         }, gameSpeed);
//     }
// }

// const ORANGE_FOOD_COLOR = '#e67e22';
// let orangeFood = { x: 0, y: 0, dx: GRID_SIZE, dy: 0 };

// function generateOrangeFoodPosition() {
//     orangeFood.x = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;
//     orangeFood.y = Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE;
//     orangeFood.dx = GRID_SIZE; // Начална посока на движение надясно
//     orangeFood.dy = 0;
// }

// function moveOrangeFood() {
//     // Движение на оранжевото квадратче
//     orangeFood.x += orangeFood.dx;
//     orangeFood.y += orangeFood.dy;

//     // Проверка за сблъсък със стените и промяна на посоката
//     if (orangeFood.x < 0) {
//         orangeFood.x = 0;
//         orangeFood.dx = GRID_SIZE;
//         orangeFood.dy = 0;
//     } else if (orangeFood.x >= CANVAS_SIZE) {
//         orangeFood.x = CANVAS_SIZE - GRID_SIZE;
//         orangeFood.dx = -GRID_SIZE;
//         orangeFood.dy = 0;
//     } else if (orangeFood.y < 0) {
//         orangeFood.y = 0;
//         orangeFood.dx = 0;
//         orangeFood.dy = GRID_SIZE;
//     } else if (orangeFood.y >= CANVAS_SIZE) {
//         orangeFood.y = CANVAS_SIZE - GRID_SIZE;
//         orangeFood.dx = 0;
//         orangeFood.dy = -GRID_SIZE;
//     }
// }

// function drawOrangeFood() {
//     ctx.fillStyle = ORANGE_FOOD_COLOR;
//     ctx.strokeStyle = '#000';
//     ctx.fillRect(orangeFood.x, orangeFood.y, GRID_SIZE, GRID_SIZE);
//     ctx.strokeRect(orangeFood.x, orangeFood.y, GRID_SIZE, GRID_SIZE);
// }

// function checkOrangeFoodCollision() {
//     if (snake[0].x === orangeFood.x && snake[0].y === orangeFood.y) {
//         return true;
//     }
//     return false;
// }

// function eatOrangeFood() {
//     if (snake.length > 1) {
//         snake.pop(); // Премахване на последния елемент от тялото на змията
//     }
//     generateOrangeFoodPosition(); // Генериране на нова позиция за оранжевото квадратче
// }

// // Начална позиция на оранжевото квадратче
// generateOrangeFoodPosition();

/*--------------*/



function setGameSpeed(speed) {
    switch (speed) {
        case 'slow':
            gameSpeed = 200; // по-бавно движение
            break;
        case 'normal':
            gameSpeed = 100; // стандартна скорост (нормална)
            break;
        case 'fast':
            gameSpeed = 50; // по-бързо движение
            break;
        default:
            gameSpeed = 100; // по подразбиране стандартна скорост
            break;
    }
}








/*--------------*/
// Проверка дали играта е приключила
function hasGameEnded() {
    for (let i = 4; i < snake.length; i++) {
        const hasCollided = snake[i].x === snake[0].x && snake[i].y === snake[0].y;
        if (hasCollided) return true;
    }

    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= CANVAS_SIZE;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= CANVAS_SIZE;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy, color: headColor };
    snake.unshift(head);

    const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
    if (hasEatenFood) {
        score += 10;
        scoreSpan.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}


// Handle key events for snake direction
function changeDirection(event) {
    if (!gameRunning) return;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -GRID_SIZE;
    const goingDown = dy === GRID_SIZE;
    const goingRight = dx === GRID_SIZE;
    const goingLeft = dx === -GRID_SIZE;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -GRID_SIZE;
        dy = 0;
    }

    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -GRID_SIZE;
    }

    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = GRID_SIZE;
        dy = 0;
    }

    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = GRID_SIZE;
    }
}









// Function to move the snake
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    snake.pop(); // Remove the tail unless growing
}

// Function to grow the snake
function growSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
}

// Function to check if game over
function gameOver() {
    if (
        snake[0].x < 0 ||
        snake[0].x >= CANVAS_SIZE ||
        snake[0].y < 0 ||
        snake[0].y >= CANVAS_SIZE ||
        checkCollision() ||
        checkLakeCollision() // Добавяме проверка за сблъсък с езерото
    ) {
        return true;
    }
    return false;
}
// Функция за проверка за сблъсък с езерото
function checkLakeCollision() {
    return lake.some(square => square.x === snake[0].x && square.y === snake[0].y);
}

// Function to end the game
function endGame() {
    gameRunning = false;
    highScores.push({ score: score, date: new Date() }); // Add current score and date to high scores
    updateHighScores();
    gameOverScreen.style.display = 'block';
}

// Function to update high scores display
function updateHighScores() {
    scoreList.innerHTML = '';
    highScores.sort((a, b) => b.score - a.score); // Sort scores in descending order
    highScores.forEach((highScore) => {
        const li = document.createElement('li');
        const date = new Date(highScore.date).toLocaleString(); // Format date and time
        li.textContent = `${date}: ${highScore.score}`;
        scoreList.appendChild(li);
    });
}

// Function to check collision with itself
function checkCollision() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    return false;
}

// Function to check collision with food
function checkFoodCollision() {
    return snake[0].x === food.x && snake[0].y === food.y;
}

// Function to clear canvas
function clearCanvas() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

// Function to draw grid
function drawGrid() {
    ctx.strokeStyle = GRID_COLOR;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
}

function drawSnakePart(snakePart, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.fillRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
}


// Function to draw food
function drawFood() {
    ctx.fillStyle = FOOD_COLOR;
    ctx.strokeStyle = '#000';
    ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
}

// Function to generate new food position
function generateFoodPosition() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE,
            y: Math.floor(Math.random() * GRID_COUNT) * GRID_SIZE
        };
    } while (snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y));

    return newFoodPosition;
}

// Constants for golden food
const GOLDEN_FOOD_COLOR = '#f1c40f';
const GOLDEN_FOOD_POINTS = 100;
let goldenFood;
let goldenFoodActive = false;
let goldenFoodTimer;

// Constants for black food
const BLACK_FOOD_COLOR = '#000';
const BLACK_FOOD_POINTS = -30;
const BLACK_FOOD_COUNT = 2;
let blackFoods = [];

function startGoldenFoodTimer() {
    generateGoldenFood(); // Generate the first golden food immediately
    setTimeout(() => {
        generateGoldenFood(); // Interval for generating the next golden food
        goldenFoodTimer = setTimeout(startGoldenFoodTimer, getRandomInterval(30000, 40000)); // Restart timer for next golden food
    }, 15000); // First golden food deactivates after 15 seconds
}

function deactivateGoldenFood() {
    goldenFoodActive = false;
    goldenFood = null;
    clearTimeout(goldenFoodTimer); // Reset the timer for golden food
}

function generateGoldenFood() {
    if (!goldenFoodActive) {
        goldenFood = generateFoodPosition();
        goldenFoodActive = true;
        setTimeout(deactivateGoldenFood, 15000); // Deactivate golden food after 15 seconds
    }
}

// Function to start the timer for black foods appearance
function startBlackFoodTimer() {
    generateBlackFoods();
    setInterval(generateBlackFoods, 60600);
}

// Function to generate black foods
function generateBlackFoods() {
    blackFoods = [];
    for (let i = 0; i < BLACK_FOOD_COUNT; i++) {
        let newBlackFood;
        do {
            newBlackFood = generateFoodPosition();
        } while (snake.some(part => part.x === newBlackFood.x && part.y === newBlackFood.y));
        blackFoods.push(newBlackFood);
        setTimeout(() => {
            const index = blackFoods.indexOf(newBlackFood);
            if (index !== -1) {
                blackFoods.splice(index, 1);
            }
        }, 20000); // Remove black food after 20 seconds
    }
}

// Function to draw golden food
function drawGoldenFood() {
    ctx.fillStyle = GOLDEN_FOOD_COLOR;
    ctx.strokeStyle = '#000';
    ctx.fillRect(goldenFood.x, goldenFood.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(goldenFood.x, goldenFood.y, GRID_SIZE, GRID_SIZE);
}

// Function to draw black foods
function drawBlackFoods() {
    ctx.fillStyle = BLACK_FOOD_COLOR;
    ctx.strokeStyle = '#000';
    blackFoods.forEach((blackFood) => {
        ctx.fillRect(blackFood.x, blackFood.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(blackFood.x, blackFood.y, GRID_SIZE, GRID_SIZE);
    });
}

// Function to check collision with golden food
function checkGoldenFoodCollision() {
    if (goldenFood && snake[0].x === goldenFood.x && snake[0].y === goldenFood.y) {
        return true;
    }
    return false;
}

// Function to handle eating golden food
function eatGoldenFood() {
    score += GOLDEN_FOOD_POINTS;
    scoreSpan.textContent = score;
    goldenFood = null;
    goldenFoodActive = false;
}

// Function to check collision with black foods
function checkBlackFoodCollision() {
    for (let i = 0; i < blackFoods.length; i++) {
        if (snake[0].x === blackFoods[i].x && snake[0].y === blackFoods[i].y) {
            return i; // Return the index of the collided black food
        }
    }
    return -1; // No collision
}

// Function to handle eating black food
function eatBlackFood(index) {
    score += BLACK_FOOD_POINTS;
    scoreSpan.textContent = score;
    // Remove the black food from the array
    blackFoods.splice(index, 1);
}

// Function to generate random interval for golden food appearance
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Event listener for selecting colors
const colorSelectors = document.querySelectorAll('.color-selector');
colorSelectors.forEach(selector => {
    selector.addEventListener('click', function () {
        const partType = this.getAttribute('data-part');
        const color = prompt(`Enter color for ${partType}:`, '#ffffff');
        this.style.backgroundColor = color;
        if (partType === 'head') {
            headColor = color;
        } else if (partType === 'body') {
            bodyColors = Array.from(colorSelectors).map(el => el.style.backgroundColor);
        }
    });
});

// Function to draw snake
function drawSnake() {
    snake.forEach((snakePart, index) => {
        if (index === 0) {
            drawSnakePart(snakePart, headColor);
        } else {
            const colorIndex = (index - 1) % bodyColors.length;
            drawSnakePart(snakePart, bodyColors[colorIndex]);
        }
    });
}

function drawSnakePart(snakePart, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.fillRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
}


let colorInput = document.querySelector('#color');
let hexInput = document.querySelector('#hex');

colorInput.addEventListener('input', () => {
    let color = colorInput.value;
    hexInput.value = color;
    // document.body.style.backgroundColor = color;

    document.querySelector('h1').style.color = color;
});

document.addEventListener('DOMContentLoaded', function () {
    let colorInput = document.querySelector('#color');
    let hexInput = document.querySelector('#hex');
    let snakeSquares = document.querySelectorAll('.snake-part');

    // Добавяне на слушател за клик на квадратчетата на змията
    snakeSquares.forEach(square => {
        square.addEventListener('click', function () {
            let color = colorInput.value;
            let hexColor = rgbToHex(getComputedStyle(square).backgroundColor); // Получаваме HEX цвят от стиловете на квадратчето
            square.style.backgroundColor = color; // Задаваме новия цвят на квадратчето
            hexInput.value = hexColor; // Обновяваме текстовото поле с HEX цвета
        });
    });

    // Функция за преобразуване на RGB цвят в HEX формат
    function rgbToHex(rgb) {
        let rgbValues = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgbValues[1]) + hex(rgbValues[2]) + hex(rgbValues[3]);
    }

    // Добавяне на слушател за събитие за въвеждане на цвета
    colorInput.addEventListener('input', function () {
        let color = colorInput.value;
        hexInput.value = color;
    });
});

/********************************************/
function applySnakeColors() {
    const snakeHead = document.getElementById('snakeHead');
    snakeHead.style.backgroundColor = headColor;

    const snakeBodyParts = document.querySelectorAll('.snake-part.body');
    snakeBodyParts.forEach((part, index) => {
        part.style.backgroundColor = bodyColors[index % bodyColors.length];
    });
}