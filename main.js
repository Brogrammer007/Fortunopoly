/**
 * MAIN.JS - Main game controller for Fortunopoly
 * Handles UI interactions, game flow, and rendering
 */

// DOM Elements
const elements = {
    // Screens
    setupScreen: null,
    gameScreen: null,
    gameOverScreen: null,

    // Setup
    playerInputs: null,
    countButtons: null,
    startGameBtn: null,

    // Game
    gameBoard: null,
    currentPlayerDisplay: null,
    playersList: null,
    ownedProperties: null,
    gameLog: null,

    // Dice
    diceContainer: null,
    dice1: null,
    dice2: null,

    // Action buttons
    rollDiceBtn: null,
    buyPropertyBtn: null,
    skipBuyBtn: null,
    payJailBtn: null,
    endTurnBtn: null,

    // Modals
    modalOverlay: null,
    modalContent: null,
    passDeviceModal: null,
    nextPlayerName: null,
    readyBtn: null,
    rulesModal: null,
    continueGameBtn: null,

    // Game Over
    winnerDisplay: null,
    finalStandings: null,
    playAgainBtn: null
};

// Current game state tracking
let selectedPlayerCount = 4;
let pendingAction = null;

// Debugging: Log before unload to identify reload triggers
window.addEventListener('beforeunload', (event) => {
    console.warn("⚠️ PAGE RELOAD DETECTED!", new Date().toISOString());
    // Uncommenting the line below would show a confirmation dialog, helpful for debugging but annoying for users
    // event.preventDefault();
    // event.returnValue = '';
});

/**
 * Initialize the application
 */
function init() {
    cacheElements();
    setupEventListeners();
    setupPlayerInputs(selectedPlayerCount);

    // Check for saved game
    const hasSave = SaveSystem.hasSave();
    const activeSession = localStorage.getItem('fortunopoly_active_session') === 'true';

    if (hasSave && elements.continueGameBtn) {
        const info = SaveSystem.getSaveInfo();
        if (info) {
            elements.continueGameBtn.classList.remove('hidden');
            elements.continueGameBtn.title = `Last played: ${info.timestamp.toLocaleString()}`;
        }
    }

    // Auto-Resume check (Decoupled logic)
    if (activeSession) {
        if (hasSave) {
            console.log('🔄 Auto-resuming active session...');
            continueGame();
        } else {
            // Inconsistent state: Flag true but no save found. Clear flag.
            console.warn('⚠️ Active session flag found but no save file. Clearing flag.');
            localStorage.removeItem('fortunopoly_active_session');
        }
    }
}

/**
 * Cache DOM element references
 */
function cacheElements() {
    elements.setupScreen = document.getElementById('setup-screen');
    elements.gameScreen = document.getElementById('game-screen');
    elements.gameOverScreen = document.getElementById('game-over-screen');
    elements.playerInputs = document.getElementById('player-inputs');
    elements.countButtons = document.querySelectorAll('.count-btn');
    elements.startGameBtn = document.getElementById('start-game-btn');
    elements.continueGameBtn = document.getElementById('continue-game-btn');
    elements.gameBoard = document.getElementById('game-board');
    elements.currentPlayerDisplay = document.getElementById('current-player-display');
    elements.playersList = document.getElementById('players-list');
    elements.ownedProperties = document.getElementById('owned-properties');
    elements.gameLog = document.getElementById('game-log');
    elements.diceContainer = document.getElementById('dice-container');
    elements.dice1 = document.getElementById('dice1');
    elements.dice2 = document.getElementById('dice2');
    elements.rollDiceBtn = document.getElementById('roll-dice-btn');
    elements.buyPropertyBtn = document.getElementById('buy-property-btn');
    elements.skipBuyBtn = document.getElementById('skip-buy-btn');
    elements.payJailBtn = document.getElementById('pay-jail-btn');
    elements.endTurnBtn = document.getElementById('end-turn-btn');
    elements.tradeBtn = document.getElementById('trade-btn');
    elements.saveGameBtn = document.getElementById('save-game-btn');
    elements.modalOverlay = document.getElementById('modal-overlay');
    elements.modalContent = document.getElementById('modal-content');
    elements.passDeviceModal = document.getElementById('pass-device-modal');
    elements.nextPlayerName = document.getElementById('next-player-name');
    elements.readyBtn = document.getElementById('ready-btn');
    elements.rulesModal = document.getElementById('rules-modal');
    elements.winnerDisplay = document.getElementById('winner-display');
    elements.finalStandings = document.getElementById('final-standings');
    elements.playAgainBtn = document.getElementById('play-again-btn');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    elements.countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.countButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPlayerCount = parseInt(btn.dataset.count);
            setupPlayerInputs(selectedPlayerCount);
        });
    });

    elements.startGameBtn.addEventListener('click', startGame);
    if (elements.continueGameBtn) {
        elements.continueGameBtn.addEventListener('click', continueGame);
    }

    if (elements.saveGameBtn) elements.saveGameBtn.addEventListener('click', handleManualSave);

    const mainMenuBtn = document.getElementById('main-menu-btn');
    if (mainMenuBtn) mainMenuBtn.addEventListener('click', handleBackToMenu);

    // Trade Button
    if (elements.tradeBtn) elements.tradeBtn.addEventListener('click', showTradeModal);
    elements.rollDiceBtn.addEventListener('click', handleRollDice);
    elements.buyPropertyBtn.addEventListener('click', handleBuyProperty);
    elements.skipBuyBtn.addEventListener('click', handleSkipBuy);
    elements.payJailBtn.addEventListener('click', handlePayJail);
    elements.endTurnBtn.addEventListener('click', handleEndTurn);
    elements.readyBtn.addEventListener('click', hidePassDeviceModal);
    elements.playAgainBtn.addEventListener('click', resetGame);

    const rulesBtnSetup = document.getElementById('rules-btn-setup');
    const rulesBtnGame = document.getElementById('rules-btn-game');
    if (rulesBtnSetup) rulesBtnSetup.addEventListener('click', showRulesModal);
    if (rulesBtnGame) rulesBtnGame.addEventListener('click', showRulesModal);

    const tradeBtn = document.getElementById('trade-btn');
    if (tradeBtn) tradeBtn.addEventListener('click', showTradeModal);

    if (elements.saveGameBtn) {
        elements.saveGameBtn.addEventListener('click', handleManualSave);
    }

    // Shortcuts: Click Dice to Roll
    if (elements.diceContainer) {
        elements.diceContainer.style.cursor = 'pointer';
        elements.diceContainer.title = "Click to Roll!";
        elements.diceContainer.addEventListener('click', () => {
            if (!elements.rollDiceBtn.disabled && !elements.rollDiceBtn.classList.contains('hidden')) {
                handleRollDice();
            }
        });
    }

    // Shortcuts: Spacebar to Move / End Turn
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const moveMsg = document.querySelector('.move-prompt-msg');
            const endTurnBtn = document.getElementById('end-turn-btn');
            const passDeviceModal = document.getElementById('pass-device-modal');

            // Priority 0: Pass Device "Ready" (if visible)
            if (passDeviceModal && !passDeviceModal.classList.contains('hidden')) {
                e.preventDefault();
                e.stopPropagation();
                const readyBtn = document.getElementById('ready-btn');
                if (readyBtn && !readyBtn.classList.contains('hidden')) {
                    readyBtn.click();
                }
            }
            // Priority 1: Move Token
            else if (moveMsg) {
                e.preventDefault();
                e.stopPropagation();
                const token = document.querySelector('.board-token.highlight-token');
                if (token) token.click();
            }
            // Priority 2: End Turn (if visible)
            else if (endTurnBtn && !endTurnBtn.classList.contains('hidden') && !endTurnBtn.disabled) {
                e.preventDefault();
                e.stopPropagation();
                handleEndTurn();
            }
            // Priority 3: Roll Dice (if visible)
            else if (!elements.rollDiceBtn.disabled && !elements.rollDiceBtn.classList.contains('hidden')) {
                e.preventDefault();
                e.stopPropagation();
                handleRollDice();
            }
        }
    });
}

/**
 * Handle manual save
 */
function handleManualSave() {
    if (SaveSystem.save(GameState)) {
        const originalText = elements.saveGameBtn.textContent;
        elements.saveGameBtn.textContent = '✅ Saved!';
        elements.saveGameBtn.style.background = '#27ae60';
        alert("Game saved successfully to local cache!");
        setTimeout(() => {
            elements.saveGameBtn.textContent = originalText;
            elements.saveGameBtn.style.background = '#2c3e50';
        }, 2000);
    } else {
        alert('Failed to save game!');
    }
}

/**
 * Handle Back to Menu
 */
function handleBackToMenu() {
    // Auto-save before quitting
    if (SaveSystem.save(GameState)) {
        // Clear active session flag since user explicitly quit
        localStorage.removeItem('fortunopoly_active_session');

        // Show temp toast or alert
        const btn = document.getElementById('main-menu-btn');
        if (btn) btn.textContent = '✅ Saved!';

        setTimeout(() => {
            // Reset button text
            if (btn) btn.innerHTML = '🏠 Main Menu';

            // Switch screens
            elements.gameScreen.classList.add('hidden');
            elements.setupScreen.classList.remove('hidden');

            // Re-check for saved games to enable Continue button
            const hasSave = SaveSystem.hasSave();
            if (hasSave && elements.continueGameBtn) {
                elements.continueGameBtn.classList.remove('hidden');
                const info = SaveSystem.getSaveInfo();
                if (info) {
                    elements.continueGameBtn.title = `Last played: ${info.timestamp.toLocaleString()}`;
                }
            }
        }, 800);
    } else {
        if (!confirm("Could not auto-save! Are you sure you want to quit? Progress will be lost.")) {
            return;
        }
        elements.gameScreen.classList.add('hidden');
        elements.setupScreen.classList.remove('hidden');
    }
}

/**
 * Setup player input fields
 */
function setupPlayerInputs(count) {
    elements.playerInputs.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const color = PLAYER_COLORS[i];
        const row = document.createElement('div');
        row.className = 'player-input-row';
        row.innerHTML = `
            <div class="player-color-indicator" style="background-color: ${color.hex}">
                <div class="player-svg" style="width: 30px; height: 30px;">${color.svg}</div>
            </div>
            <input type="text" 
                   placeholder="${color.name} (Player ${i + 1})" 
                   value="${color.name}" 
                   maxlength="15"
                   class="player-name-input"
                   data-player-index="${i}">
            
            <div class="bot-config">
                <label class="bot-toggle" title="Enable AI Player">
                    <input type="checkbox" class="is-bot-checkbox" data-index="${i}" onchange="toggleBotDifficulty(${i})">
                    <span>🤖 Bot</span>
                </label>
                <select class="bot-difficulty hidden" id="bot-difficulty-${i}">
                    <option value="easy">Easy</option>
                    <option value="medium" selected>Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
        `;
        elements.playerInputs.appendChild(row);
    }
}

window.toggleBotDifficulty = function (index) {
    const checkbox = document.querySelector(`.is-bot-checkbox[data-index="${index}"]`);
    const select = document.getElementById(`bot-difficulty-${index}`);
    if (checkbox && select) {
        select.classList.toggle('hidden', !checkbox.checked);
    }
};

/**
 * Start the game
 */
function startGame() {
    // Clear any previous game state first
    localStorage.removeItem('fortunopoly_save');
    localStorage.removeItem('fortunopoly_active_session');

    const rows = elements.playerInputs.querySelectorAll('.player-input-row');
    const playerData = [];

    rows.forEach((row, index) => {
        const nameInput = row.querySelector('input[type="text"]');
        const botCheckbox = row.querySelector('.is-bot-checkbox');
        const difficultySelect = row.querySelector('.bot-difficulty');

        const name = nameInput.value.trim() || `Player ${index + 1}`;
        const isBot = botCheckbox ? botCheckbox.checked : false;
        const botDifficulty = difficultySelect ? difficultySelect.value : 'medium';

        playerData.push({
            name: isBot ? `${name} (Bot)` : name,
            isBot,
            botDifficulty
        });
    });

    const rules = {
        parkingJackpot: document.getElementById('rule-parking-jackpot')?.checked || false,
        doubleGo: document.getElementById('rule-double-go')?.checked || false
    };

    GameState.init(playerData, rules);

    // Explicitly set active session and force save purely new state
    localStorage.setItem('fortunopoly_active_session', 'true');
    SaveSystem.save(GameState);
    console.log("New game started and saved.");

    elements.setupScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');

    renderBoard(elements.gameBoard, GameState);
    updateUI();
    setupDice();

    // If first player is bot, start their turn
    const firstPlayer = GameState.getCurrentPlayer();
    if (firstPlayer.isBot) {
        setTimeout(() => BotAI.takeTurn(firstPlayer, GameState), 1000);
    }
}

/**
 * Continue saved game
 */
function continueGame() {
    const savedState = SaveSystem.load();
    if (!savedState) {
        alert('Failed to load save');
        return;
    }

    GameState.fromJSON(savedState);

    // Set active session flag
    localStorage.setItem('fortunopoly_active_session', 'true');

    elements.setupScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');

    renderBoard(elements.gameBoard, GameState);
    updateUI();
    setupDice();

    const player = GameState.getCurrentPlayer();
    if (player.isBot) {
        setTimeout(() => BotAI.takeTurn(player, GameState), 1000);
    }
}

/**
 * Setup dice elements
 */
function setupDice() {
    elements.dice1 = document.getElementById('dice1');
    elements.dice2 = document.getElementById('dice2');

    [elements.dice1, elements.dice2].forEach(dice => {
        if (!dice) return;
        dice.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const dot = document.createElement('div');
            dot.className = 'dice-dot';
            dice.appendChild(dot);
        }
    });
}

/**
 * Handle roll dice action
 */
async function handleRollDice() {
    try {
        const player = GameState.getCurrentPlayer();
        elements.rollDiceBtn.disabled = true;

        // Set phase to prevent UI from showing roll button again prematurely
        GameState.turnPhase = TURN_PHASES.MOVING;

        if (player.inJail) {
            await handleJailRoll(player);
            return;
        }

        if (GameState.consecutiveDoubles >= 3) {
            GameState.sendToJail(player);
            updateUI();
            renderBoard(elements.gameBoard, GameState);
            showActionComplete();
            return;
        }

        const roll = await animateDiceRoll();

        // Skip click-to-move for bots
        if (!player.isBot) {
            await promptClickToMove(player);
        } else {
            await sleep(300);
        }

        const { oldPosition, newPosition } = await GameState.moveCurrentPlayer(roll.total);
        try {
            await animatePlayerMovement(player, oldPosition, newPosition, GameState);
        } catch (e) {
            console.error("Animation error:", e);
            // Fallback: just render board
        }
        renderBoard(elements.gameBoard, GameState);

        const result = await GameState.processLanding(player);
        await handleLandingResult(result, roll);
        updateUI();

    } catch (error) {
        console.error("CRITICAL ERROR in handleRollDice:", error);
        // Recover state to avoid softlock
        elements.rollDiceBtn.disabled = false;
        GameState.turnPhase = TURN_PHASES.WAITING;
        updateUI();
    }
}

/**
 * Handle jail roll
 */
async function handleJailRoll(player) {
    const roll = await animateDiceRoll();
    const result = GameState.processJailTurn(player, roll);

    if (result.escaped && result.canMove) {
        if (!player.isBot) {
            await promptClickToMove(player);
        }

        const { oldPosition, newPosition } = await GameState.moveCurrentPlayer(roll.total);
        await animatePlayerMovement(player, oldPosition, newPosition, GameState);
        renderBoard(elements.gameBoard, GameState);

        const landingResult = await GameState.processLanding(player);
        await handleLandingResult(landingResult, roll);
    } else if (player.isBankrupt) {
        checkGameOver();
    } else {
        showActionComplete();
    }

    updateUI();
}

/**
 * Handle landing result
 */
async function handleLandingResult(result, roll) {
    const player = GameState.getCurrentPlayer();

    switch (result.action) {
        case 'canBuy':
            pendingAction = { type: 'buy', data: result.tile };
            if (player.isBot) {
                await sleep(500);
                if (BotAI.shouldBuyProperty(player, result.tile, GameState)) {
                    await handleBuyProperty();
                } else {
                    handleSkipBuy();
                }
            } else {
                showBuyPrompt(result.tile);
            }
            break;

        case 'payRent':
            await processRentPayment(result);
            break;

        case 'chanceCard':
            if (player.isBot) {
                await sleep(800);
                await showChanceCard(result.card, result.cardType);
            } else {
                await promptDrawCard(result.cardType);
                await showChanceCard(result.card, result.cardType);
            }
            break;

        case 'jailed':
            renderBoard(elements.gameBoard, GameState);
            showActionComplete();
            break;

        default:
            if (roll.isDoubles && !player.inJail) {
                GameState.addLog(`${player.name} rolled doubles! Roll again.`);
                elements.rollDiceBtn.disabled = false;
                hideActionButtons();
                elements.rollDiceBtn.classList.remove('hidden');

                // Set phase back to waiting for the extra roll
                GameState.turnPhase = TURN_PHASES.WAITING;

                if (player.isBot) {
                    await sleep(800);
                    handleRollDice();
                }
            } else {
                showActionComplete();
            }
    }
}

/**
 * Prompt user to draw a card
 */
function promptDrawCard(cardType) {
    return new Promise(resolve => {
        const fortuneDeck = document.querySelector('.fortune-deck');
        const fateDeck = document.querySelector('.fate-deck');
        const deck = cardType === 'Fate' ? fateDeck : fortuneDeck;

        deck.classList.add('highlight-deck');
        deck.style.zIndex = 100;

        const msg = document.createElement('div');
        msg.className = 'draw-prompt-msg';
        msg.textContent = `👆 Pick a ${cardType || 'Card'}!`;
        msg.style.cssText = 'position:absolute;top:-40px;left:50%;transform:translateX(-50%);background:var(--accent-gold);padding:5px 10px;border-radius:20px;font-weight:bold;white-space:nowrap;pointer-events:none;';
        deck.appendChild(msg);

        const clickHandler = () => {
            deck.classList.remove('highlight-deck');
            msg.remove();
            deck.style.zIndex = '';
            deck.removeEventListener('click', clickHandler);
            resolve();
        };

        deck.addEventListener('click', clickHandler);
    });
}

/**
 * Process rent payment
 */
async function processRentPayment(result) {
    const player = GameState.getCurrentPlayer();
    const success = GameState.payRent(player, result.owner, result.rent);

    if (player.isBot) {
        await sleep(500);
        showActionComplete();
    } else {
        showModal(`
            <div class="modal-title">💰 Rent Payment</div>
            <p class="modal-message">
                ${player.name} paid <strong>$${result.rent}</strong> rent to 
                <strong style="color: ${result.owner.color.hex}">${result.owner.name}</strong>
            </p>
            <div class="modal-buttons">
                <button class="modal-btn primary" onclick="hideModal(); showActionComplete();">OK</button>
            </div>
        `);
    }

    if (!success) checkGameOver();
    updateUI();
}

/**
 * Show buy property prompt
 */
function showBuyPrompt(tile) {
    hideActionButtons();
    elements.buyPropertyBtn.classList.remove('hidden');
    elements.skipBuyBtn.classList.remove('hidden');

    const groupColor = tile.group ? getGroupColor(tile.group) : '#888';

    showModal(`
        <div class="modal-title">🏠 Property Available!</div>
        <div class="property-modal-header" style="background-color: ${groupColor}30; border: 2px solid ${groupColor}">
            <h3 style="color: ${groupColor}; margin-bottom: 0.5rem;">${tile.name}</h3>
            <div class="property-modal-price">Price: $${tile.price}</div>
            <div class="property-modal-rent">Base Rent: $${tile.rent ? tile.rent[0] : 'varies'}</div>
        </div>
        <p class="modal-message">Would you like to purchase this property?</p>
        <div class="modal-buttons">
            <button class="modal-btn primary" onclick="handleBuyProperty()">Buy for $${tile.price}</button>
            <button class="modal-btn secondary" onclick="handleSkipBuy()">Skip</button>
        </div>
    `);
}

/**
 * Handle buy property
 */
function handleBuyProperty() {
    hideModal();
    if (!pendingAction || pendingAction.type !== 'buy') return;

    const tile = pendingAction.data;
    const player = GameState.getCurrentPlayer();

    GameState.buyProperty(player, tile);
    pendingAction = null;

    renderBoard(elements.gameBoard, GameState);
    updateUI();
    showActionComplete();
}

/**
 * Handle skip buy
 */
function handleSkipBuy() {
    hideModal();
    GameState.addLog(`${GameState.getCurrentPlayer().name} skipped buying ${pendingAction?.data?.name || 'property'}`);
    pendingAction = null;
    updateUI();
    showActionComplete();
}

/**
 * Show chance card with 3D animation
 */
async function showChanceCard(card, cardType) {
    const player = GameState.getCurrentPlayer();

    const overlay = document.createElement('div');
    overlay.className = 'card-display-overlay';

    const type = (cardType || 'Fortune').toLowerCase();
    const title = type.toUpperCase();

    overlay.innerHTML = `
        <div class="card-3d-wrapper">
            <div class="card-face front ${type}">
                <div class="card-logo">${type === 'fortune' ? '?' : '!'}</div>
                <div style="font-size: 1.5rem; color: rgba(255,255,255,0.8); font-weight: 700; margin-top: 1rem;">${title}</div>
            </div>
            <div class="card-face back ${type}">
                <div class="card-content-icon">${card.icon}</div>
                <div class="card-content-text">${card.text}</div>
                <button class="modal-btn primary" id="card-ok-btn">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    await sleep(100);
    overlay.querySelector('.card-3d-wrapper').classList.add('flipped');

    return new Promise(resolve => {
        const btn = overlay.querySelector('#card-ok-btn');
        const handleClose = async () => {
            overlay.querySelector('.card-3d-wrapper').classList.remove('flipped');
            await sleep(600);
            overlay.remove();

            const result = await GameState.applyCardEffect(player, card);

            if (result.needsPlayerChoice) {
                await handleInteractiveCardEffect(result, player);
            } else if (result.needsLandingProcess) {
                renderBoard(elements.gameBoard, GameState);
                const landingResult = await GameState.processLanding(player);
                await handleLandingResult(landingResult, { isDoubles: false });
            } else {
                if (player.isBankrupt) {
                    checkGameOver();
                } else {
                    showActionComplete();
                }
            }

            updateUI();
            renderBoard(elements.gameBoard, GameState);
            resolve();
        };

        if (player.isBot) {
            setTimeout(handleClose, 1500);
        } else {
            btn.onclick = handleClose;
        }
    });
}

/**
 * Handle interactive card effects
 */
async function handleInteractiveCardEffect(result, player) {
    if (player.isBot) {
        // Bot handles interactive cards automatically
        if (result.choiceType === 'stealChoice') {
            const targets = GameState.getActivePlayers().filter(p => p.id !== player.id);
            if (targets.length > 0) {
                const richest = targets.sort((a, b) => b.money - a.money)[0];
                const stealAmount = Math.min(result.amount, richest.money);
                richest.subtractMoney(stealAmount);
                player.addMoney(stealAmount);
                GameState.addLog(`🏴‍☠️ ${player.name} stole $${stealAmount} from ${richest.name}!`, 'card');
            }
        } else if (result.choiceType === 'freeArson') {
            // Find property with most houses
            let bestTarget = null;
            GameState.getActivePlayers().forEach(p => {
                if (p.id !== player.id) {
                    p.properties.forEach(tileId => {
                        const houses = GameState.propertyHouses[tileId] || 0;
                        if (houses > 0 && (!bestTarget || houses > bestTarget.houses)) {
                            bestTarget = { tileId, houses, owner: p };
                        }
                    });
                }
            });
            if (bestTarget) {
                GameState.propertyHouses[bestTarget.tileId]--;
                const tile = getTile(bestTarget.tileId);
                GameState.addLog(`🔥 ${player.name} burned a house on ${tile.name}!`, 'card');
            }
        }
        showActionComplete();
    } else {
        if (result.choiceType === 'stealChoice') {
            await showStealChoiceModal(player, result.amount);
        } else if (result.choiceType === 'freeArson') {
            await showArsonModal(player);
        }
    }
}

/**
 * Show steal choice modal
 */
function showStealChoiceModal(player, amount) {
    return new Promise(resolve => {
        let content = `
            <div class="modal-title">🏴‍☠️ Choose Your Target!</div>
            <p style="margin-bottom: 1rem;">Select a player to steal $${amount} from:</p>
            <div class="trade-partner-list" style="max-height: 300px;">
        `;

        GameState.getActivePlayers().forEach(p => {
            if (p.id !== player.id) {
                const stealableAmount = Math.min(amount, p.money);
                content += `
                    <div class="trade-partner-item steal-target" data-player-id="${p.id}" style="cursor: pointer;">
                        <div class="trade-partner-token" style="background-color: ${p.color.hex}">
                            <div class="player-svg" style="width: 35px; height: 35px;">${p.getSVG()}</div>
                        </div>
                        <div class="trade-partner-info">
                            <div class="trade-partner-name">${p.name}</div>
                            <div class="trade-partner-details">Has $${p.money} (will steal $${stealableAmount})</div>
                        </div>
                    </div>
                `;
            }
        });

        content += `</div>`;
        showModal(content);

        document.querySelectorAll('.steal-target').forEach(el => {
            el.addEventListener('click', () => {
                const targetId = parseInt(el.dataset.playerId);
                const target = GameState.players.find(p => p.id === targetId);
                const stealAmount = Math.min(amount, target.money);

                target.subtractMoney(stealAmount);
                player.addMoney(stealAmount);
                GameState.addLog(`🏴‍☠️ ${player.name} stole $${stealAmount} from ${target.name}!`, 'card');

                hideModal();
                updateUI();
                renderBoard(elements.gameBoard, GameState);
                showActionComplete();
                resolve();
            });
        });
    });
}

/**
 * Show arson modal
 */
function showArsonModal(player) {
    return new Promise(resolve => {
        const targets = [];
        GameState.getActivePlayers().forEach(p => {
            if (p.id !== player.id) {
                p.properties.forEach(tileId => {
                    const houses = GameState.propertyHouses[tileId] || 0;
                    if (houses > 0) {
                        targets.push({ player: p, tileId, tile: getTile(tileId), houses });
                    }
                });
            }
        });

        if (targets.length === 0) {
            showModal(`
                <div class="modal-title">🔥 No Targets!</div>
                <p>There are no houses to burn down!</p>
                <div class="modal-buttons">
                    <button class="modal-btn primary" onclick="hideModal(); showActionComplete();">OK</button>
                </div>
            `);
            resolve();
            return;
        }

        let content = `
            <div class="modal-title">🔥 Choose Property to Burn!</div>
            <p style="margin-bottom: 1rem;">Select a property to remove a house from:</p>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;">
        `;

        targets.forEach(t => {
            const color = t.tile.group ? getGroupColor(t.tile.group) : '#888';
            content += `
                <div class="trade-property-item arson-target" data-tile-id="${t.tileId}" style="cursor: pointer;">
                    <div class="trade-property-color" style="background-color: ${color}"></div>
                    <span class="trade-property-name">${t.tile.name}</span>
                    <span style="color: ${t.player.color.hex}; font-size: 0.8rem;">(${t.player.name})</span>
                    <span class="trade-property-value">${t.houses === 5 ? '🏨' : t.houses + '🏠'}</span>
                </div>
            `;
        });

        content += `</div>`;
        showModal(content);

        document.querySelectorAll('.arson-target').forEach(el => {
            el.addEventListener('click', () => {
                const tileId = parseInt(el.dataset.tileId);
                const target = targets.find(t => t.tileId === tileId);

                GameState.propertyHouses[tileId]--;
                GameState.addLog(`🔥 ${player.name} burned a house on ${target.tile.name}!`, 'card');

                hideModal();
                updateUI();
                renderBoard(elements.gameBoard, GameState);
                showActionComplete();
                resolve();
            });
        });
    });
}

/**
 * Handle pay jail
 */
function handlePayJail() {
    const player = GameState.getCurrentPlayer();

    if (GameState.payJailBail(player)) {
        updateUI();
        renderBoard(elements.gameBoard, GameState);
        elements.payJailBtn.classList.add('hidden');
        elements.rollDiceBtn.disabled = false;
    }
}

/**
 * Show action complete
 */
function showActionComplete() {
    const player = GameState.getCurrentPlayer();
    hideActionButtons();

    // Explicitly set phase to END_TURN so updateUI knows what to show
    GameState.turnPhase = TURN_PHASES.END_TURN;

    if (player.isBot) {
        setTimeout(handleEndTurn, 800);
    } else {
        elements.endTurnBtn.classList.remove('hidden');
        if (elements.tradeBtn) elements.tradeBtn.classList.remove('hidden');
    }
}

/**
 * Handle end turn
 */
function handleEndTurn() {
    const nextPlayer = GameState.endTurn();
    // Auto-save disabled to prevent potential reload loops
    // SaveSystem.save(GameState);

    if (GameState.phase === GAME_PHASES.GAME_OVER) {
        showGameOver();
        return;
    }

    showPassDeviceModal(nextPlayer);
}

/**
 * Show pass device modal
 */
function showPassDeviceModal(nextPlayer) {
    if (nextPlayer.isBot) {
        elements.nextPlayerName.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <div class="player-token" style="background-color: ${nextPlayer.color.hex}; width: 100px; height: 100px;">
                    <span style="font-size: 4rem;">🤖</span>
                </div>
                <span style="font-size: 2rem; font-weight: 700;">${nextPlayer.name}</span>
                <span style="font-size: 1.2rem; opacity: 0.8;">${nextPlayer.botDifficulty.toUpperCase()} - Thinking...</span>
            </div>
        `;
        elements.passDeviceModal.classList.remove('hidden');
        elements.readyBtn.classList.add('hidden');

        setTimeout(() => {
            hidePassDeviceModal();
            BotAI.takeTurn(nextPlayer, GameState);
        }, 1200);
    } else {
        elements.nextPlayerName.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <div class="player-token" style="background-color: ${nextPlayer.color.hex}; width: 100px; height: 100px;">
                    <div class="player-svg" style="width: 70px; height: 70px;">${nextPlayer.getSVG()}</div>
                </div>
                <span style="font-size: 2rem; font-weight: 700;">${nextPlayer.name}</span>
                <span style="font-size: 1.2rem; opacity: 0.8;">It's your turn!</span>
            </div>
        `;
        elements.passDeviceModal.classList.remove('hidden');
        elements.readyBtn.classList.remove('hidden');
    }
}

/**
 * Hide pass device modal
 */
function hidePassDeviceModal() {
    elements.passDeviceModal.classList.add('hidden');

    // Explicitly reset dice for next player
    elements.dice1.classList.remove('visible');
    elements.dice2.classList.remove('visible');

    // Ensure UI updates to show valid buttons for the new turn (WAITING phase)
    GameState.turnPhase = TURN_PHASES.WAITING;
    updateUI();
    renderBoard(elements.gameBoard, GameState);
}

/**
 * Check for game over
 */
function checkGameOver() {
    if (GameState.phase === GAME_PHASES.GAME_OVER) {
        showGameOver();
    }
}

/**
 * Show game over screen
 */
function showGameOver() {
    elements.gameScreen.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');

    const winner = GameState.getWinner();
    const standings = GameState.getStandings();

    elements.winnerDisplay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
            <div class="player-token" style="background-color: ${winner.color.hex}; width: 120px; height: 120px; box-shadow: 0 0 40px ${winner.color.hex};">
                <div class="player-svg" style="width: 80px; height: 80px;">${winner.getSVG()}</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; color: var(--accent-gold); text-transform: uppercase;">Champion</div>
                <div style="font-size: 3rem; font-weight: 800; margin: 0.5rem 0;">${winner.name}</div>
                <div style="font-family: var(--font-mono); color: var(--accent-gold); font-size: 2rem;">$${winner.getNetWorth()}</div>
            </div>
        </div>
    `;

    elements.finalStandings.innerHTML = '<h3 style="margin-bottom: 1rem;">Final Standings</h3>';
    const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

    standings.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'standing-row';
        row.innerHTML = `
            <span class="standing-rank">${rankEmojis[index]}</span>
            <span class="standing-name" style="color: ${player.color.hex}">${player.name}</span>
            <span class="standing-money">${player.isBankrupt ? 'BANKRUPT' : '$' + player.getNetWorth()}</span>
        `;
        elements.finalStandings.appendChild(row);
    });
}

/**
 * Reset game
 */
function resetGame() {
    elements.gameOverScreen.classList.add('hidden');
    elements.setupScreen.classList.remove('hidden');
    localStorage.removeItem('fortunopoly_active_session');
    pendingAction = null;
    selectedPlayerCount = 4;

    elements.countButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.count === '4');
    });
    setupPlayerInputs(4);
}

/**
 * Hide all action buttons
 */
function hideActionButtons() {
    elements.rollDiceBtn.classList.add('hidden');
    elements.buyPropertyBtn.classList.add('hidden');
    elements.skipBuyBtn.classList.add('hidden');
    elements.payJailBtn.classList.add('hidden');
    elements.endTurnBtn.classList.add('hidden');
    if (elements.tradeBtn) elements.tradeBtn.classList.add('hidden');
}

/**
 * Update UI elements
 */
function updateUI() {
    const player = GameState.getCurrentPlayer();

    const jackpotDisplay = document.getElementById('jackpot-display');
    const jackpotAmount = document.getElementById('jackpot-amount');

    if (GameState.houseRules && GameState.houseRules.parkingJackpot) {
        if (jackpotDisplay) jackpotDisplay.classList.add('visible');
        if (jackpotAmount) jackpotAmount.textContent = GameState.freeParkingPot;
    } else {
        if (jackpotDisplay) jackpotDisplay.classList.remove('visible');
    }

    updateCurrentPlayerDisplay(player);
    updatePlayersList();
    updateOwnedProperties(player);
    updateGameLog();
    updateActionButtons(player);
}

function updateCurrentPlayerDisplay(player) {
    elements.currentPlayerDisplay.innerHTML = `
        <div class="player-token" style="background-color: ${player.color.hex}">
            <div class="player-svg">${player.getSVG()}</div>
        </div>
        <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-money">$${player.money}</div>
            <div class="player-status">
                ${player.inJail ? '🔒 In Jail' : ''}
                ${player.hasJailFreeCard ? '🗝️ Has Jail Free Card' : ''}
            </div>
        </div>
    `;
}

function updatePlayersList() {
    elements.playersList.innerHTML = '';

    GameState.players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'mini-player-card';
        if (index === GameState.currentPlayerIndex) card.classList.add('current');
        if (player.isBankrupt) card.classList.add('bankrupt');

        card.innerHTML = `
            <div class="mini-token" style="background-color: ${player.color.hex}; border-radius: 50%;">
                <div class="player-svg">${player.getSVG()}</div>
            </div>
            <div class="mini-player-info">
                <div class="mini-player-name">${player.name}</div>
                <div class="mini-player-money">$${player.money}</div>
            </div>
        `;

        elements.playersList.appendChild(card);
    });
}

function updateOwnedProperties(player) {
    elements.ownedProperties.innerHTML = '';

    if (player.properties.length === 0) {
        elements.ownedProperties.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No properties owned yet</p>';
        return;
    }

    player.properties.forEach(tileId => {
        const tile = getTile(tileId);
        const item = document.createElement('div');
        item.className = 'owned-property-item';
        const color = tile.group ? getGroupColor(tile.group) : '#888';

        item.innerHTML = `
            <div class="property-color-bar" style="background-color: ${color}"></div>
            <div class="property-details">
                <div class="property-name">${tile.name}</div>
                <div class="property-rent">Rent: $${tile.rent ? tile.rent[0] : 'varies'}</div>
            </div>
        `;

        elements.ownedProperties.appendChild(item);
    });
}

function updateGameLog() {
    elements.gameLog.innerHTML = '';
    const recentLogs = GameState.log.slice(-10).reverse();

    recentLogs.forEach(entry => {
        const logEl = document.createElement('div');
        logEl.className = `log-entry ${entry.type}`;
        logEl.textContent = entry.message;
        elements.gameLog.appendChild(logEl);
    });
}

function updateActionButtons(player) {
    hideActionButtons();
    if (player.isBankrupt) return;

    if (GameState.turnPhase === TURN_PHASES.WAITING) {
        elements.rollDiceBtn.classList.remove('hidden');
        elements.rollDiceBtn.disabled = false;
        if (elements.tradeBtn) elements.tradeBtn.classList.remove('hidden');

        if (player.inJail && (player.canAfford(JAIL_BAIL) || player.hasJailFreeCard)) {
            elements.payJailBtn.classList.remove('hidden');
            elements.payJailBtn.textContent = player.hasJailFreeCard
                ? '🗝️ Use Jail Free Card'
                : `💰 Pay $${JAIL_BAIL} to Leave Jail`;
        }
    } else if (GameState.turnPhase === TURN_PHASES.END_TURN) {
        elements.endTurnBtn.classList.remove('hidden');
        if (elements.tradeBtn) elements.tradeBtn.classList.remove('hidden');
    }
}

/**
 * Prompt click to move
 */
function promptClickToMove(player) {
    return new Promise(resolve => {
        const token = document.querySelector(`.board-token[data-player-id="${player.id}"]`);
        if (!token) {
            resolve();
            return;
        }

        token.classList.add('highlight-token');

        // --- PORTAL UI REFACTOR ---
        // Instead of appending to the token (which is inside the board/card hierarchy),
        // we create a fixed-position overlay attached to body.

        const rect = token.getBoundingClientRect();
        const msg = document.createElement('div');
        msg.className = 'move-prompt-msg';
        msg.textContent = '👆 Click to Move!';

        // Position fixed relative to viewport, centered above token
        msg.style.position = 'fixed';
        msg.style.left = (rect.left + rect.width / 2) + 'px';
        msg.style.top = (rect.top - 40) + 'px'; // 40px above token
        msg.style.transform = 'translateX(-50%)';
        msg.style.zIndex = '999999'; // Super high z-index

        document.body.appendChild(msg);

        // Handle window resize to update position (optional but good for polish)
        const updatePos = () => {
            const newRect = token.getBoundingClientRect();
            msg.style.left = (newRect.left + newRect.width / 2) + 'px';
            msg.style.top = (newRect.top - 40) + 'px';
        };
        window.addEventListener('scroll', updatePos);
        window.addEventListener('resize', updatePos);

        const clickHandler = (event) => {
            event.stopPropagation();
            token.classList.remove('highlight-token');

            // Clean up overlay and listeners
            if (msg.parentNode) msg.parentNode.removeChild(msg);
            window.removeEventListener('scroll', updatePos);
            window.removeEventListener('resize', updatePos);

            token.removeEventListener('click', clickHandler);
            resolve();
        };

        token.addEventListener('click', clickHandler);
    });
}

/**
 * Animate dice roll
 */
async function animateDiceRoll() {
    elements.dice1 = document.getElementById('dice1');
    elements.dice2 = document.getElementById('dice2');
    if (!elements.dice1.children.length) setupDice();

    const roll = GameState.rollDice();

    elements.dice1.classList.add('visible', 'rolling');
    elements.dice2.classList.add('visible', 'rolling');

    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
        elements.dice1.dataset.value = Math.floor(Math.random() * 6) + 1;
        elements.dice2.dataset.value = Math.floor(Math.random() * 6) + 1;
        await sleep(50);
    }

    elements.dice1.classList.remove('rolling');
    elements.dice2.classList.remove('rolling');
    elements.dice1.dataset.value = roll.die1;
    elements.dice2.dataset.value = roll.die2;

    GameState.addLog(`${GameState.getCurrentPlayer().name} rolled ${roll.die1} + ${roll.die2} = ${roll.total}${roll.isDoubles ? ' (Doubles!)' : ''}`);

    await sleep(500);
    return roll;
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show modal
 */
function showModal(content) {
    elements.modalContent.innerHTML = content;
    elements.modalOverlay.classList.remove('hidden');
}

/**
 * Hide modal
 */
function hideModal() {
    elements.modalOverlay.classList.add('hidden');
}

function showRulesModal() {
    if (elements.rulesModal) elements.rulesModal.classList.remove('hidden');
}

function hideRulesModal() {
    if (elements.rulesModal) elements.rulesModal.classList.add('hidden');
}

window.hideRulesModal = hideRulesModal;
window.handleBuyProperty = handleBuyProperty;
window.handleSkipBuy = handleSkipBuy;
window.showActionComplete = showActionComplete;

// ==========================================
// TRADING SYSTEM UI
// ==========================================

let tradeStep = 1;
let selectedTradePartner = null;

function showTradeModal() {
    const tradeModal = document.getElementById('trade-modal');
    if (!tradeModal) return;

    tradeStep = 1;
    selectedTradePartner = null;
    TradeSystem.cancelTrade();

    document.getElementById('trade-step-1').classList.remove('hidden');
    document.getElementById('trade-step-2').classList.add('hidden');
    document.getElementById('trade-step-3').classList.add('hidden');
    document.getElementById('trade-next-btn').textContent = 'Next';
    document.getElementById('trade-error').textContent = '';

    populateTradePartners();
    tradeModal.classList.remove('hidden');
}

function hideTradeModal() {
    const tradeModal = document.getElementById('trade-modal');
    if (tradeModal) tradeModal.classList.add('hidden');
    TradeSystem.cancelTrade();
}

function populateTradePartners() {
    const container = document.getElementById('trade-partner-list');
    if (!container) return;

    container.innerHTML = '';
    const currentPlayer = GameState.getCurrentPlayer();

    GameState.players.forEach(player => {
        if (player.id === currentPlayer.id || player.isBankrupt) return;

        const item = document.createElement('div');
        item.className = 'trade-partner-item';
        item.dataset.playerId = player.id;

        item.innerHTML = `
            <div class="trade-partner-token" style="background-color: ${player.color.hex}">
                <div class="player-svg" style="width: 35px; height: 35px;">${player.getSVG()}</div>
            </div>
            <div class="trade-partner-info">
                <div class="trade-partner-name">${player.name}</div>
                <div class="trade-partner-details">$${player.money} · ${player.properties.length} properties</div>
            </div>
        `;

        item.addEventListener('click', () => selectTradePartner(player, item));
        container.appendChild(item);
    });

    if (container.children.length === 0) {
        container.innerHTML = '<div class="trade-empty">No players available to trade with</div>';
    }
}

function selectTradePartner(player, element) {
    document.querySelectorAll('.trade-partner-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedTradePartner = player;
}

function tradeNextStep() {
    const errorEl = document.getElementById('trade-error');
    errorEl.textContent = '';

    if (tradeStep === 1) {
        if (!selectedTradePartner) {
            errorEl.textContent = 'Please select a trading partner';
            return;
        }

        TradeSystem.createProposal(GameState.getCurrentPlayer(), selectedTradePartner);
        populateTradeProperties();

        document.getElementById('trade-step-1').classList.add('hidden');
        document.getElementById('trade-step-2').classList.remove('hidden');
        document.getElementById('trade-next-btn').textContent = 'Propose Trade';
        tradeStep = 2;

    } else if (tradeStep === 2) {
        const offerMoney = parseInt(document.getElementById('offer-money').value) || 0;
        const requestMoney = parseInt(document.getElementById('request-money').value) || 0;
        TradeSystem.setOfferedMoney(offerMoney);
        TradeSystem.setRequestedMoney(requestMoney);

        const validation = TradeSystem.validateTrade(GameState);
        if (!validation.valid) {
            errorEl.textContent = validation.reason;
            return;
        }

        populateTradeSummary();

        document.getElementById('trade-step-2').classList.add('hidden');
        document.getElementById('trade-step-3').classList.remove('hidden');
        document.getElementById('trade-next-btn').textContent = 'Accept Trade';
        tradeStep = 3;

    } else if (tradeStep === 3) {
        const result = TradeSystem.executeTrade(GameState);

        if (result.success) {
            renderBoard(elements.gameBoard, GameState);
            updateUI();
            hideTradeModal();
        } else {
            errorEl.textContent = result.reason;
        }
    }
}

function populateTradeProperties() {
    const currentPlayer = GameState.getCurrentPlayer();
    const partner = selectedTradePartner;

    const offerContainer = document.getElementById('your-offer-properties');
    offerContainer.innerHTML = '';

    if (currentPlayer.properties.length === 0) {
        offerContainer.innerHTML = '<div class="trade-empty">No properties to offer</div>';
    } else {
        currentPlayer.properties.forEach(tileId => {
            const tile = getTile(tileId);
            const hasBuildings = GameState.propertyHouses[tileId] > 0;
            offerContainer.appendChild(createTradePropertyItem(tile, hasBuildings, true));
        });
    }

    const requestContainer = document.getElementById('your-request-properties');
    requestContainer.innerHTML = '';

    if (partner.properties.length === 0) {
        requestContainer.innerHTML = '<div class="trade-empty">No properties available</div>';
    } else {
        partner.properties.forEach(tileId => {
            const tile = getTile(tileId);
            const hasBuildings = GameState.propertyHouses[tileId] > 0;
            requestContainer.appendChild(createTradePropertyItem(tile, hasBuildings, false));
        });
    }

    document.getElementById('offer-money').value = 0;
    document.getElementById('offer-money').max = currentPlayer.money;
    document.getElementById('request-money').value = 0;
    document.getElementById('request-money').max = partner.money;
}

function createTradePropertyItem(tile, hasBuildings, isOffer) {
    const item = document.createElement('div');
    item.className = 'trade-property-item';
    if (hasBuildings) item.classList.add('trade-property-blocked');
    item.dataset.tileId = tile.id;

    const color = tile.group ? getGroupColor(tile.group) : '#888';

    item.innerHTML = `
        <div class="trade-property-color" style="background-color: ${color}"></div>
        <span class="trade-property-name">${tile.name}</span>
        <span class="trade-property-value">$${tile.price}</span>
    `;

    if (!hasBuildings) {
        item.addEventListener('click', () => {
            item.classList.toggle('selected');
            TradeSystem.toggleProperty(tile.id, isOffer);
        });
    }

    return item;
}

function populateTradeSummary() {
    const summary = TradeSystem.getTradeSummary(GameState);
    if (!summary) return;

    const container = document.getElementById('trade-summary');

    let offerItems = '';
    summary.offeredProperties.forEach(tile => { offerItems += `<li>🏠 ${tile.name}</li>`; });
    if (summary.offeredMoney > 0) offerItems += `<li>💵 $${summary.offeredMoney}</li>`;
    if (!offerItems) offerItems = '<li>Nothing</li>';

    let requestItems = '';
    summary.requestedProperties.forEach(tile => { requestItems += `<li>🏠 ${tile.name}</li>`; });
    if (summary.requestedMoney > 0) requestItems += `<li>💵 $${summary.requestedMoney}</li>`;
    if (!requestItems) requestItems = '<li>Nothing</li>';

    container.innerHTML = `
        <div class="trade-summary-header">Trade Summary</div>
        <div class="trade-summary-content">
            <div class="trade-summary-side">
                <h5 style="color: ${summary.fromPlayer.color.hex}">${summary.fromPlayer.name} gives:</h5>
                <ul class="trade-summary-items">${offerItems}</ul>
            </div>
            <div class="trade-arrow">⇄</div>
            <div class="trade-summary-side">
                <h5 style="color: ${summary.toPlayer.color.hex}">${summary.toPlayer.name} gives:</h5>
                <ul class="trade-summary-items">${requestItems}</ul>
            </div>
        </div>
        <div class="trade-confirm-message">
            🔄 Pass device to <strong style="color: ${summary.toPlayer.color.hex}">${summary.toPlayer.name}</strong> to accept or decline!
        </div>
    `;
}

function cancelTrade() {
    hideTradeModal();
}

window.showTradeModal = showTradeModal;
window.hideTradeModal = hideTradeModal;
window.tradeNextStep = tradeNextStep;
window.cancelTrade = cancelTrade;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
