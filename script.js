document.addEventListener('DOMContentLoaded', function () {
    const gameContainer = document.querySelector('.game-container');
    const scoreElement = document.getElementById('score-value');

    let mouseX = 0;
    let mouseY = 0;
    let playerParts = [{ x: 0, y: 0 }];
    let thrownBalls = [];
    let speed = 0.1; // Initial speed, adjust as needed
    let score = 0;
    let overlapCheckTimer = 30; // Time before which splitted part can't be joined

    function startOverlapCheckTimer() {
        setInterval(() => {
            overlapCheckTimer--;
            if (overlapCheckTimer === 0) {
                overlapCheckTimer = 30; // Reset the timer after checking for overlap
            }
        }, 1000);
    }

    startOverlapCheckTimer();

    gameContainer.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - gameContainer.offsetLeft;
        mouseY = e.clientY - gameContainer.offsetTop;
    });

    function createFood(color) {
        const food = document.createElement('div');

        food.className = 'food';
        food.style.left = Math.random() * (gameContainer.offsetWidth - 10) + 'px';
        food.style.top = Math.random() * (gameContainer.offsetHeight - 10) + 'px';
        food.style.backgroundColor = color;

        gameContainer.appendChild(food);
    }

    function throwBall(x, y) {
        const ball = document.createElement('div');

        ball.style.width = '20px';
        ball.style.height = '20px';

        const playerX = playerParts[0].x;
        const playerY = playerParts[0].y;

        // Calculate the angle between the player and the mouse
        const angle = Math.atan2(mouseY - playerY, mouseX - playerX);

        // Calculate the starting position 120px away from the player in the direction of the mouse
        const startOffset = 120;
        const startX = playerX + startOffset * Math.cos(angle);
        const startY = playerY + startOffset * Math.sin(angle);

        ball.className = 'thrown-ball';
        ball.style.left = Math.max(startX, 0) + 'px';
        ball.style.top = Math.max(startY, 0) + 'px';
        ball.style.position = 'absolute'
        ball.style.backgroundColor = 'brown'
        ball.style.borderRadius = '50%'
        gameContainer.appendChild(ball);
        thrownBalls.push({ element: ball, x, y });

        updateScore(-6)
    }

    function updatePlayerPosition() {
        var playerSize = parseFloat(document.getElementById('player').style.width);
        if (!isNaN(playerSize)) {
            speed = 0.03 / playerSize * 2;
        }

        playerParts[0].x += (mouseX - playerParts[0].x) * speed;
        playerParts[0].y += (mouseY - playerParts[0].y) * speed;

        const player = document.getElementById(`player`);
        player.style.left = playerParts[0].x + 'px';
        player.style.top = playerParts[0].y + 'px';

        for (let i = 1; i < playerParts.length; i++) {
            var playerSize = parseFloat(document.getElementById('player').style.width);
            if (!isNaN(playerSize)) {
                speed = 0.03 / playerSize * 2;
            }

            playerParts[i].x += (mouseX - playerParts[i].x) * speed;
            playerParts[i].y += (mouseY - playerParts[i].y) * speed;

            let subplayer = document.getElementById(`subplayer-${i}`);

            subplayer.style.left = playerParts[i].x + 'px';
            subplayer.style.top = playerParts[i].y + 'px';
        }
    }

    function checkCollision(player) {
        // Check collision with player and thrown balls
        for (let i = 0; i < thrownBalls.length; i++) {
            if (isColliding(thrownBalls[i].element, player)) {
                // Remove the thrown ball
                gameContainer.removeChild(thrownBalls[i].element);
                thrownBalls.splice(i, 1);
                i--; // Adjust index after removal

                updateScore(6);
            }
        }

        // Check collision with player and food
        const foods = document.querySelectorAll('.food');
        for (let i = 0; i < foods.length; i++) {
            if (isColliding(player, foods[i])) {
                foods[i].style.left = Math.random() * (gameContainer.offsetWidth - 10) + 'px';
                foods[i].style.top = Math.random() * (gameContainer.offsetHeight - 10) + 'px';

                player.style.width = Math.sqrt(score) * 10 + 'px';
                player.style.height = Math.sqrt(score) * 10 + 'px';

                speed = 0.1 / Math.sqrt(score);

                updateScore(1);
            }
        }

        // Check overlap with splitted part
        if (overlapCheckTimer === 0) {
            for (let i = 1; i < playerParts.length; i++) {
                const subplayer = document.getElementById(`subplayer-${i}`);
                if (isColliding(player, subplayer)) {
                    // Calculate the area of overlap
                    const overlapArea = calculateOverlapArea(player, subplayer);

                    // Calculate the percentage of overlap
                    const playerArea = parseFloat(player.style.width) * parseFloat(player.style.height);
                    const subplayerArea = parseFloat(subplayer.style.width) * parseFloat(subplayer.style.height);
                    const overlapPercentage = (overlapArea / Math.min(playerArea, subplayerArea)) * 100;

                    // Check if the overlap percentage is 90% or more for merging
                    if (overlapPercentage >= 90) {
                        // Merge logic: Increase the size of the player and remove the subplayer
                        const subplayerSize = parseFloat(subplayer.style.width);
                        const playerSize = parseFloat(player.style.width);

                        player.style.width = Math.sqrt(playerSize ** 2 + subplayerSize ** 2) + 'px';
                        player.style.height = Math.sqrt(playerSize ** 2 + subplayerSize ** 2) + 'px';

                        gameContainer.removeChild(subplayer);
                        playerParts.splice(i, 1);

                        updateScore(subplayerSize);
                    }
                }
            }
        }
    }

    function calculateOverlapArea(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));

        return overlapX * overlapY;
    }


    function isColliding(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        const centerX1 = rect1.left + rect1.width / 2;
        const centerY1 = rect1.top + rect1.height / 2;
        const centerX2 = rect2.left + rect2.width / 2;
        const centerY2 = rect2.top + rect2.height / 2;

        const distance = Math.sqrt((centerX2 - centerX1) ** 2 + (centerY2 - centerY1) ** 2);
        const radiusSum = (rect1.width + rect2.width) / 2;

        return distance < radiusSum;
    }


    function splitPlayer() {
        const playerSize = parseFloat(document.getElementById('player').style.width);
        if (playerSize >= 50) {
            const newCell = document.createElement('div');
            const index = playerParts.length;

            newCell.id = `subplayer-${index}`;
            newCell.className = 'subplayer';
            newCell.style.width = Math.floor(playerSize / 1.5) + 'px';
            newCell.style.height = Math.floor(playerSize / 1.5) + 'px';
            newCell.style.position = 'absolute';

            gameContainer.appendChild(newCell);

            const playerX = playerParts[0].x;
            const playerY = playerParts[0].y;

            const angle = Math.atan2(mouseY - playerY, mouseX - playerX);

            // Calculate the starting position 120px away from the player in the direction of the mouse
            const startOffset = 120;
            const startX = playerX + startOffset * Math.cos(angle);
            const startY = playerY + startOffset * Math.sin(angle);
            playerParts[index] = { x: startX, y: startY };

            document.getElementById('player').style.width = (playerSize - 10) + 'px';
            document.getElementById('player').style.height = (playerSize - 10) + 'px';

            updateScore(-20);
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            splitPlayer();
        } else if (e.code === 'KeyW') {
            const playerSize = parseFloat(document.getElementById('player').style.width);
            if (playerSize >= 40) {
                throwBall();
            }
        }
    });

    function updateScore(points) {
        score += points;
        scoreElement.textContent = score;
    }

    function animate() {
        updatePlayerPosition();
        const player = document.getElementById('player');
        checkCollision(player);

        for (let i = 1; i < playerParts.length; i++) {
            let subplayer = document.getElementById(`subplayer-${i}`);
            checkCollision(subplayer)
        }
        requestAnimationFrame(animate);
    }

    // Create initial foods
    for (let i = 0; i < 1000; i++) {
        let colors = ['blue', 'green', 'red', 'orange', '#222']
        createFood(colors[i % 5]);
    }
    // Start the animation loop
    animate();
});
