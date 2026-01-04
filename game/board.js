/**
 * BOARD.JS - Board rendering and management for Fortunopoly
 */

/**
 * Board positions mapping
 * The board is a square with 11x11 grid
 * Tiles are positioned around the edges
 */
const BOARD_POSITIONS = {
    // Bottom row (START to Jail) - tiles 0-10
    // Grid positions: row 10, cols 10 down to 0
    0: { row: 10, col: 10, side: 'corner' },  // START (bottom-right)
    1: { row: 10, col: 9, side: 'bottom' },
    2: { row: 10, col: 8, side: 'bottom' },
    3: { row: 10, col: 7, side: 'bottom' },
    4: { row: 10, col: 6, side: 'bottom' },
    5: { row: 10, col: 5, side: 'bottom' },
    6: { row: 10, col: 4, side: 'bottom' },
    7: { row: 10, col: 3, side: 'bottom' },
    8: { row: 10, col: 2, side: 'bottom' },
    9: { row: 10, col: 1, side: 'bottom' },
    10: { row: 10, col: 0, side: 'corner' }, // JAIL (bottom-left)

    // Left column (going up) - tiles 11-19
    11: { row: 9, col: 0, side: 'left' },
    12: { row: 8, col: 0, side: 'left' },
    13: { row: 7, col: 0, side: 'left' },
    14: { row: 6, col: 0, side: 'left' },
    15: { row: 5, col: 0, side: 'left' },
    16: { row: 4, col: 0, side: 'left' },
    17: { row: 3, col: 0, side: 'left' },
    18: { row: 2, col: 0, side: 'left' },
    19: { row: 1, col: 0, side: 'left' },
    20: { row: 0, col: 0, side: 'corner' }, // FREE PARKING (top-left)

    // Top row (going right) - tiles 21-29
    21: { row: 0, col: 1, side: 'top' },
    22: { row: 0, col: 2, side: 'top' },
    23: { row: 0, col: 3, side: 'top' },
    24: { row: 0, col: 4, side: 'top' },
    25: { row: 0, col: 5, side: 'top' },
    26: { row: 0, col: 6, side: 'top' },
    27: { row: 0, col: 7, side: 'top' },
    28: { row: 0, col: 8, side: 'top' },
    29: { row: 0, col: 9, side: 'top' },
    30: { row: 0, col: 10, side: 'corner' }, // GO TO JAIL (top-right)

    // Right column (going down) - tiles 31-39
    31: { row: 1, col: 10, side: 'right' },
    32: { row: 2, col: 10, side: 'right' },
    33: { row: 3, col: 10, side: 'right' },
    34: { row: 4, col: 10, side: 'right' },
    35: { row: 5, col: 10, side: 'right' },
    36: { row: 6, col: 10, side: 'right' },
    37: { row: 7, col: 10, side: 'right' },
    38: { row: 8, col: 10, side: 'right' },
    39: { row: 9, col: 10, side: 'right' }
};

/**
 * Render the game board
 */
function renderBoard(boardElement, gameState) {
    // Preserve center content (dice and decks)
    let centerContent = boardElement.querySelector('.board-center-content');

    // If not found in DOM, try to recreate it from HTML structure if possible, 
    // or assume it was cleared and we need to rebuild it dynamically.
    // However, since we define it in HTML, we should just save it.

    if (!centerContent) {
        // Fallback: Reconstruct center content if it's missing (e.g. first render cleared it)
        // This is a safety measure. Ideally we shouldn't clear it.
        centerContent = document.createElement('div');
        centerContent.className = 'board-center-content';
        centerContent.innerHTML = `
            <div class="deck-area fortune-deck" id="fortune-deck">
                <div class="deck-card back">?</div>
                <div class="deck-label">FORTUNE</div>
            </div>
            <div class="center-logo-area">
                <div class="dice-container" id="dice-container">
                    <div class="dice" id="dice1"></div>
                    <div class="dice" id="dice2"></div>
                </div>
            </div>
            <div class="deck-area fate-deck" id="fate-deck">
                <div class="deck-card back">!</div>
                <div class="deck-label">FATE</div>
            </div>
        `;
    }

    boardElement.innerHTML = '';

    // Create all 40 tiles
    TILES.forEach((tile, index) => {
        const tileElement = createTileElement(tile, gameState);
        const position = BOARD_POSITIONS[index];

        // Set grid position
        tileElement.style.gridRow = position.row + 1;
        tileElement.style.gridColumn = position.col + 1;

        // Add side class for color bar positioning
        tileElement.classList.add(position.side);

        boardElement.appendChild(tileElement);
    });

    // Append center content back
    boardElement.appendChild(centerContent);

    // Render player tokens
    renderPlayerTokens(boardElement, gameState);
}

/**
 * Create a single tile element
 */
function createTileElement(tile, gameState) {
    const tileEl = document.createElement('div');
    tileEl.className = `tile ${tile.type}`;
    if (tile.subtype) {
        tileEl.classList.add(tile.subtype);
    }
    tileEl.dataset.tileId = tile.id;

    // Find owner if property
    let owner = null;
    if (isTileBuyable(tile)) {
        owner = gameState.players.find(p => p.ownsProperty(tile.id));
    }

    // Add color bar for properties
    if (tile.group) {
        const colorBar = document.createElement('div');
        colorBar.className = 'tile-color-bar';
        colorBar.style.backgroundColor = getGroupColor(tile.group);
        tileEl.appendChild(colorBar);
    }

    // Add content based on tile type
    if (tile.icon) {
        const iconEl = document.createElement('div');
        iconEl.className = 'tile-icon';
        iconEl.textContent = tile.icon;
        tileEl.appendChild(iconEl);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'tile-name';
    nameEl.textContent = tile.name;
    tileEl.appendChild(nameEl);

    // Add price for buyable tiles
    if (tile.price && !owner) {
        const priceEl = document.createElement('div');
        priceEl.className = 'tile-price';
        priceEl.textContent = `$${tile.price}`;
        tileEl.appendChild(priceEl);
    }

    // Add tax amount
    if (tile.type === 'tax') {
        const priceEl = document.createElement('div');
        priceEl.className = 'tile-price';
        priceEl.textContent = `Pay $${tile.amount}`;
        tileEl.appendChild(priceEl);
    }

    // Add owner indicator
    if (owner) {
        const ownerEl = document.createElement('div');
        ownerEl.className = 'tile-owner';
        ownerEl.style.backgroundColor = owner.color.hex;
        ownerEl.title = `Owned by ${owner.name}`;
        ownerEl.className = 'tile-owner';
        ownerEl.style.backgroundColor = owner.color.hex;
        ownerEl.title = `Owned by ${owner.name}`;
        tileEl.appendChild(ownerEl);

        // Add mortgaged visual
        if (owner.isMortgaged(tile.id)) {
            tileEl.classList.add('mortgaged');
            const badge = document.createElement('div');
            badge.className = 'mortgaged-badge';
            badge.textContent = 'MORTGAGED';
            tileEl.appendChild(badge);
        } else if (tile.group && owner.hasMonopoly(tile.group)) {
            // Add buildable indicator
            const buildBadge = document.createElement('div');
            buildBadge.className = 'build-badge';
            buildBadge.textContent = '🏠+';
            buildBadge.title = 'Monopoly! You can build houses here.';
            tileEl.appendChild(buildBadge);
        }
    }

    // Render Houses/Hotels
    const houseCount = gameState.propertyHouses[tile.id] || 0;
    if (houseCount > 0) {
        const houseContainer = document.createElement('div');
        houseContainer.className = 'house-container';

        if (houseCount === 5) {
            // Hotel
            const hotel = document.createElement('div');
            hotel.className = 'hotel';
            houseContainer.appendChild(hotel);
        } else {
            // Houses
            for (let i = 0; i < houseCount; i++) {
                const house = document.createElement('div');
                house.className = 'house';
                houseContainer.appendChild(house);
            }
        }
        tileEl.appendChild(houseContainer);
    }

    // Add click handler for tile info
    tileEl.addEventListener('click', () => showTileInfo(tile, owner, gameState));

    return tileEl;
}

/**
 * Render player tokens on the board
 */
function renderPlayerTokens(boardElement, gameState) {
    // Group players by position
    const playersByPosition = {};
    gameState.players.forEach(player => {
        if (!player.isBankrupt) {
            if (!playersByPosition[player.position]) {
                playersByPosition[player.position] = [];
            }
            playersByPosition[player.position].push(player);
        }
    });

    // Render tokens for each position
    Object.entries(playersByPosition).forEach(([position, players]) => {
        const pos = BOARD_POSITIONS[position];
        const tileSelector = `.tile[data-tile-id="${position}"]`;
        const tileEl = boardElement.querySelector(tileSelector);

        if (tileEl) {
            // Remove existing tokens container
            const existingContainer = tileEl.querySelector('.tokens-container');
            if (existingContainer) {
                existingContainer.remove();
            }

            // Create tokens container
            const container = document.createElement('div');
            container.className = 'tokens-container';

            players.forEach(player => {
                const token = document.createElement('div');
                token.className = 'board-token';
                token.dataset.playerId = player.id;
                token.style.backgroundColor = player.color.hex;
                token.innerHTML = player.getSVG(); // Use SVG instead of text
                token.title = player.name;

                if (player.inJail) {
                    token.style.opacity = '0.6';
                    token.title += ' (In Jail)';
                }

                container.appendChild(token);
            });

            tileEl.appendChild(container);
        }
    });
}

/**
 * Show tile information popup
 */
function showTileInfo(tile, owner, gameState) {
    // Only show for properties
    if (!isTileBuyable(tile)) return;

    // We need gameState to check current player and logic. 
    // If it's not passed (legacy calls), we might fail to show build buttons.
    // Ideally we pass gameState everywhere.

    let content = `<div class="modal-title">${tile.name}</div>`;

    if (tile.group) {
        content += `<div class="property-modal-header" style="background-color: ${getGroupColor(tile.group)}20; border: 2px solid ${getGroupColor(tile.group)}">`;
    } else {
        content += '<div class="property-modal-header" style="background-color: rgba(255,255,255,0.1)">';
    }

    content += `<div class="property-modal-price">Price: $${tile.price}</div>`;

    if (tile.rent) {
        if (tile.type === 'property') {
            const houses = gameState?.propertyHouses[tile.id] || 0;
            const currentRent = gameState ? gameState.calculateRent(tile, owner || { hasMonopoly: () => false }) : tile.rent[0];

            content += `<div class="property-modal-rent">Current Rent: <strong>$${currentRent}</strong></div>`;
            content += `<div class="rent-details" style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">`;
            content += `Base: $${tile.rent[0]} | 1🏠: $${tile.rent[1]} | 2🏠: $${tile.rent[2]}<br>`;
            content += `3🏠: $${tile.rent[3]} | 4🏠: $${tile.rent[4]} | 🏨: $${tile.rent[5]}`;
            content += `</div>`;
            if (houses > 0) {
                content += `<div style="margin-top: 5px; color: var(--accent-gold);">Current Upgrades: ${houses === 5 ? '1 Hotel' : houses + ' House(s)'}</div>`;
            }
        } else if (tile.type === 'railroad') {
            content += `<div class="property-modal-rent">Rent: $25-$200 based on railroads owned</div>`;
        }
    } else if (tile.rentMultiplier) {
        content += `<div class="property-modal-rent">Rent: ${tile.rentMultiplier[0]}x-${tile.rentMultiplier[1]}x dice roll</div>`;
    }

    content += '</div>';

    // Build Actions
    if (gameState && owner && tile.type === 'property') {
        const currentPlayer = gameState.getCurrentPlayer();
        const houses = gameState.propertyHouses[tile.id] || 0;

        // Check if current player owns it and has monopoly
        if (currentPlayer.id === owner.id && owner.hasMonopoly(tile.group)) {
            const canBuild = houses < 5 && currentPlayer.canAfford(tile.housePrice);
            const nextUpgrade = houses === 4 ? 'Hotel' : 'House';

            content += `
                <div class="build-section" style="margin-top: 1rem; border-top: 1px solid #444; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span>Upgrade Cost:</span>
                        <span style="color: var(--accent-gold); font-weight: bold;">$${tile.housePrice}</span>
                    </div>
                    <button class="modal-btn build-btn" 
                        onclick="handleBuildHouse(${tile.id})" 
                        ${canBuild ? '' : 'disabled'}>
                        ${houses >= 5 ? 'Max Upgrades Reached' : `Build ${nextUpgrade} (-$${tile.housePrice})`}
                    </button>
                    ${!currentPlayer.canAfford(tile.housePrice) && houses < 5 ? '<div style="color: #e74c3c; font-size: 0.8rem; margin-top: 5px;">Not enough money</div>' : ''}
                </div>
            `;
        } else if (currentPlayer.id === owner.id) {
            content += `<div style="margin-top: 1rem; font-size: 0.8rem; color: #888;">Collect all properties in this color group to build houses!</div>`;
        } else if (houses > 0) {
            // Sabotage option (anyone can sabotage opponent's house)
            content += `
                <div class="build-section" style="margin-top: 1rem; border-top: 1px solid #444; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span>Sabotage Cost:</span>
                        <span style="color: #e74c3c; font-weight: bold;">$150</span>
                    </div>
                    <button class="modal-btn" style="background: #c0392b; color: white;" 
                        onclick="handleSabotage(${tile.id})">
                        🔥 Sabotage (Remove House)
                    </button>
                </div>
            `;
        }
    }

    // Mortgage Actions
    if (gameState && owner && tile.type === 'property' && owner.id === gameState.getCurrentPlayer().id) {
        const isMortgaged = owner.isMortgaged(tile.id);
        const mortgageValue = Math.floor(tile.price / 2);
        const unmortgageCost = Math.ceil(mortgageValue * 1.1);
        const houses = gameState.propertyHouses[tile.id] || 0;

        content += `
            <div class="mortgage-actions">
                ${!isMortgaged
                ? `<button class="btn-mortgage" onclick="handleMortgage(${tile.id})" ${houses > 0 ? 'disabled title="Sell houses first"' : ''}>
                        Mortgage (+$${mortgageValue})
                       </button>`
                : `<button class="btn-unmortgage" onclick="handleUnmortgage(${tile.id})" ${owner.money < unmortgageCost ? 'disabled' : ''}>
                        Unmortgage (-$${unmortgageCost})
                       </button>`
            }
            </div>
        `;
    }

    if (owner) {
        content += `<p style="margin-top: 1rem;">Owned by: <strong style="color: ${owner.color.hex}">${owner.name}</strong></p>`;
    } else {
        content += '<p style="margin-top: 1rem; color: var(--text-muted);">Available for purchase</p>';
    }

    content += '<div class="modal-buttons"><button class="modal-btn primary" onclick="hideModal()">Close</button></div>';

    showModal(content);
}

// Attach to window so onclick works
window.handleBuildHouse = function (tileId) {
    const tile = getTile(tileId);
    const player = GameState.getCurrentPlayer();

    if (GameState.buildHouse(player, tile)) {
        updateBoard(GameState);
        updateUI(); // From main.js
        // Refresh modal
        showTileInfo(tile, player, GameState);
    } else {
        // Should not happen if button was enabled, but just in case
        alert("Cannot build here!");
    }
};

window.handleSabotage = function (tileId) {
    const tile = getTile(tileId);
    const player = GameState.getCurrentPlayer();

    if (GameState.sabotageProperty(player, tile)) {
        updateBoard(GameState);
        updateUI();
        hideModal(); // Close modal after sabotage as state changed significantly
    } else {
        alert("Cannot sabotage! You need $150.");
    }
};


window.handleMortgage = function (tileId) {
    const tile = getTile(tileId);
    const player = GameState.getCurrentPlayer();

    const result = GameState.mortgageProperty(player, tile);
    if (result.success) {
        updateBoard(GameState);
        updateUI();
        showTileInfo(tile, player, GameState);
    } else {
        alert(`Cannot mortgage: ${result.reason}`);
    }
};

window.handleUnmortgage = function (tileId) {
    const tile = getTile(tileId);
    const player = GameState.getCurrentPlayer();

    const result = GameState.unmortgageProperty(player, tile);
    if (result.success) {
        updateBoard(GameState);
        updateUI();
        showTileInfo(tile, player, GameState);
    } else {
        alert(`Cannot unmortgage: ${result.reason}`);
    }
};

/**
 * Update board display (refresh tokens and ownership)
 */
function updateBoard(gameState) {
    const boardElement = document.getElementById('game-board');
    if (boardElement) {
        renderBoard(boardElement, gameState);
    }
}

/**
 * Animate player movement on board
 */
async function animatePlayerMovement(player, fromPosition, toPosition, gameState) {
    const boardElement = document.getElementById('game-board');
    const steps = [];

    // Calculate path
    if (toPosition > fromPosition) {
        for (let i = fromPosition + 1; i <= toPosition; i++) {
            steps.push(i);
        }
    } else if (toPosition < fromPosition) {
        // Wrapping around
        for (let i = fromPosition + 1; i < 40; i++) {
            steps.push(i);
        }
        for (let i = 0; i <= toPosition; i++) {
            steps.push(i);
        }
    }

    // Animate each step
    for (const step of steps) {
        player.position = step;
        renderPlayerTokens(boardElement, gameState);
        await sleep(300); // Slowed down from 100ms
    }
}

/**
 * Sleep utility for animations
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

