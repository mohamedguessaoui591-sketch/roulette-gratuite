  window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('roulette-wheel');
  const ctx = canvas.getContext('2d');
  const rouletteContainer = document.getElementById('roulette-container');
  const chipsContainer = document.getElementById('chips-container');
  const creditDisplay = document.getElementById('credit');
  const gainMessage = document.getElementById('gain-message');
  const messageText = document.getElementById('message-text');
  const chipValueSelector = document.getElementById('chip-value');

  const numbers = [
    0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,
    10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
  ];
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  let radius = 0;
  let centerX = 0;
  let centerY = 0;

  let credit = 10000;
  let bets = {};
  let spinning = false;

  // Création bille blanche
  const ball = document.createElement('div');
  ball.classList.add('white-ball');
  rouletteContainer.appendChild(ball);

  function drawWheel() {
    // on dessine en unités CSS (grâce à setTransform dans resizeCanvas)
    ctx.clearRect(0, 0, radius * 2, radius * 2);

    const step = 2 * Math.PI / numbers.length;

    for (let i = 0; i < numbers.length; i++) {
      const start = step * i - Math.PI / 2;
      const end = step * (i + 1) - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.closePath();

      ctx.fillStyle =
        numbers[i] === 0 ? 'green' :
        redNumbers.includes(numbers[i]) ? 'red' : 'black';

      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      // texte
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(start + step / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(numbers[i], radius - 10, 5);
      ctx.restore();
    }
  }

  // ✅ Rend le canvas vraiment responsive + net (retina)
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // 1 unité de dessin = 1 pixel CSS (important)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    radius = rect.width / 2;
    centerX = radius;
    centerY = radius;

    drawWheel();
  }

  // init + resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function updateCredit(amount) {
    credit += amount;
    creditDisplay.textContent = credit;
  }

  // Plateau de mise (1 à 36)
  const col1 = document.getElementById('col1');
  const col2 = document.getElementById('col2');
  const col3 = document.getElementById('col3');

  for (let i = 1; i <= 36; i++) {
    const cell = document.createElement('div');
    cell.classList.add('betting-area');
    cell.textContent = i;
    cell.style.backgroundColor = redNumbers.includes(i) ? 'red' : 'black';
    cell.style.color = '#fff';

    if (i % 3 === 1) col1.appendChild(cell);
    else if (i % 3 === 2) col2.appendChild(cell);
    else col3.appendChild(cell);
  }

  // Placement jetons cumulés
  document.querySelectorAll('.betting-area').forEach(area => {
    area.addEventListener('click', () => {
      const key = area.dataset.betValue || area.dataset.betType || area.textContent;
      const value = parseInt(chipValueSelector.value, 10);

      if (bets[key]) {
        bets[key] += value;
        const chip = document.querySelector(`.chip[data-bet="${key}"]`);
        if (chip) chip.textContent = bets[key];
      } else {
        bets[key] = value;

        const rect = area.getBoundingClientRect();
        const tableRect = document.getElementById('bet-table-container').getBoundingClientRect();

        const chip = document.createElement('div');
        chip.classList.add('chip');
        chip.dataset.bet = key;
        chip.textContent = value;

        // centrage du chip en prenant sa taille réelle
        chipsContainer.appendChild(chip);
        const chipRect = chip.getBoundingClientRect();

        chip.style.left = (rect.left - tableRect.left + rect.width / 2 - chipRect.width / 2) + "px";
        chip.style.top  = (rect.top - tableRect.top + rect.height / 2 - chipRect.height / 2) + "px";
      }
    });
  });

  function spinWheel() {
    if (spinning) return;
    spinning = true;

    gainMessage.classList.add('hidden');
    canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const ballRadius = radius - 20; // ✅ radius est maintenant responsive
    let angle = Math.random() * 2 * Math.PI;
    let speed = 0.3 + Math.random() * 0.2;
    const friction = 0.995;

    function animate() {
      angle += speed;
      speed *= friction;

      // oscillation de la bille
      const oscillation = Math.sin(angle * 8) * 5;
      const x = centerX + Math.cos(angle) * (ballRadius + oscillation) - ball.offsetWidth / 2;
      const y = centerY + Math.sin(angle) * (ballRadius + oscillation) - ball.offsetHeight / 2;
      ball.style.left = x + "px";
      ball.style.top = y + "px";

      drawWheel();

      if (speed > 0.002) {
        requestAnimationFrame(animate);
      } else {
        let finalAngle = (angle + Math.PI / 2) % (2 * Math.PI);
        if (finalAngle < 0) finalAngle += 2 * Math.PI;

        const step = 2 * Math.PI / numbers.length;
        const index = Math.floor(finalAngle / step);
        const winningNumber = numbers[index];

        handleSpinResult(winningNumber);
        spinning = false;
      }
    }

    requestAnimationFrame(animate);
  }

  function handleSpinResult(winningNumber) {
    let winAmount = 0;

    for (let key in bets) {
      const value = bets[key];

      if (key == winningNumber.toString()) winAmount += value * 35;
      else if (key == 'red' && redNumbers.includes(winningNumber)) winAmount += value;
      else if (key == 'black' && !redNumbers.includes(winningNumber) && winningNumber != 0) winAmount += value;
      else if (key == 'even' && winningNumber != 0 && winningNumber % 2 === 0) winAmount += value;
      else if (key == 'odd' && winningNumber % 2 === 1) winAmount += value;
      else if (key == 'low' && winningNumber >= 1 && winningNumber <= 18) winAmount += value;
      else if (key == 'high' && winningNumber >= 19 && winningNumber <= 36) winAmount += value;
      else if (key == 'firstDozen' && winningNumber >= 1 && winningNumber <= 12) winAmount += value * 2;
      else if (key == 'secondDozen' && winningNumber >= 13 && winningNumber <= 24) winAmount += value * 2;
      else if (key == 'thirdDozen' && winningNumber >= 25 && winningNumber <= 36) winAmount += value * 2;
      else if (key == 'firstColumn' && winningNumber % 3 === 1) winAmount += value * 2;
      else if (key == 'secondColumn' && winningNumber % 3 === 2) winAmount += value * 2;
      else if (key == 'thirdColumn' && winningNumber % 3 === 0 && winningNumber != 0) winAmount += value * 2;
    }

    updateCredit(winAmount);

    messageText.innerHTML = `Le numéro gagnant est <b>${winningNumber}</b>!<br>
      Vous avez gagné ${winAmount} €.<br>
      ⚠️ Rappel : évitez de jouer sur des sites frauduleux <br>
      ✅ Jouez uniquement sur <b>Stake.com</b> ou <b>Betify2.sh</b>.`;

    gainMessage.classList.remove('hidden');

    bets = {};
    chipsContainer.querySelectorAll('.chip').forEach(c => c.remove());
  }

  document.getElementById('spin-btn').addEventListener('click', spinWheel);
document.getElementById('play-stake').addEventListener('click', () => window.open('https://stake.com/?c=sHtTPrEn', '_blank'));
  document.getElementById('play-betify').addEventListener('click', () => window.open('https://betify2.sh', '_blank'));
});