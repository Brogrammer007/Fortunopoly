/**
 * GAMESTATE.JS - Game state management for Fortunopoly
 */

/**
 * Game phases
 */
const GAME_PHASES = {
    SETUP: 'setup',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

/**
 * Turn phases
 */
const TURN_PHASES = {
    WAITING: 'waiting',         // Waiting for player to roll
    ROLLED: 'rolled',           // Dice rolled, processing move
    MOVING: 'moving',           // Token moving animation
    LANDED: 'landed',           // Processing tile action
    BUYING: 'buying',           // Player deciding to buy
    PAYING: 'paying',           // Processing payment
    CARD: 'card',               // Processing chance card
    END_TURN: 'endTurn'         // Turn complete, waiting for next
};

/**
 * Main game state object
 */
const GameState = {
    // Game phase
    phase: GAME_PHASES.SETUP,

    // Players
    players: [],
    currentPlayerIndex: 0,

    // Turn state
    turnPhase: TURN_PHASES.WAITING,
    lastDiceRoll: [0, 0],
    consecutiveDoubles: 0,

    // Property ownership (tileId -> playerId)
    propertyOwners: {},
    // Property houses (tileId -> number)
    propertyHouses: {},

    // Game log
    log: [],

    // Round counter
    round: 1,
    maxRounds: 50, // Optional: end game after X rounds

    /**
     * Initialize a new game
     */
    // House Rules
    houseRules: {
        parkingJackpot: false,
        doubleGo: false
    },
    freeParkingPot: 0,

    init(playerData, rules = {}) {
        this.phase = GAME_PHASES.PLAYING;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.turnPhase = TURN_PHASES.WAITING;
        this.lastDiceRoll = [0, 0];
        this.consecutiveDoubles = 0;
        this.propertyOwners = {};
        this.propertyHouses = {};
        this.log = [];
        this.round = 1;

        // Set rules
        this.houseRules = {
            parkingJackpot: rules.parkingJackpot || false,
            doubleGo: rules.doubleGo || false
        };
        this.freeParkingPot = 0;

        // Create players
        playerData.forEach((data, index) => {
            const player = createPlayer(index, data.name, index);
            // Set bot properties
            player.isBot = data.isBot || false;
            player.botDifficulty = data.botDifficulty || 'medium';
            this.players.push(player);
        });

        this.addLog(`Game started with ${this.players.length} players!`);
        this.addLog(`${this.getCurrentPlayer().name}'s turn`);

        // Shuffle chance cards
        shuffleCards();
    },

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    },

    /**
     * Get active (non-bankrupt) players
     */
    getActivePlayers() {
        return this.players.filter(p => !p.isBankrupt);
    },

    /**
     * Roll dice
     */
    rollDice() {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        this.lastDiceRoll = [die1, die2];

        const isDoubles = die1 === die2;
        if (isDoubles) {
            this.consecutiveDoubles++;
        } else {
            this.consecutiveDoubles = 0;
        }

        return {
            die1,
            die2,
            total: die1 + die2,
            isDoubles
        };
    },

    /**
     * Move current player
     */
    async moveCurrentPlayer(spaces) {
        const player = this.getCurrentPlayer();
        const oldPosition = player.position;
        const { newPosition, passedStart } = player.moveSpaces(spaces);

        if (passedStart) {
            this.addLog(`${player.name} passed START and collected $${START_BONUS}!`);
        }

        return { oldPosition, newPosition, passedStart };
    },

    /**
     * Process landing on a tile
     */
    async processLanding(player) {
        const tile = getTile(player.position);

        switch (tile.type) {
            case 'start':
                this.addLog(`${player.name} landed on START`);
                // Double GO Rule: Landing exactly on GO gives extra $200 (total $400)
                if (this.houseRules.doubleGo) {
                    player.addMoney(START_BONUS);
                    this.addLog(`🌟 DOUBLE GO! ${player.name} gets extra $${START_BONUS}!`, 'card');
                }
                break;

            case 'property':
            case 'railroad':
            case 'utility':
                return this.processPropertyLanding(player, tile);

            case 'chance':
                return this.processChanceCard(player, tile);

            case 'tax':
                return this.processTax(player, tile);

            case 'jail':
                this.addLog(`${player.name} is just visiting Jail`);
                break;

            case 'gotojail':
                return this.sendToJail(player);

            case 'parking':
                if (this.houseRules.parkingJackpot && this.freeParkingPot > 0) {
                    player.addMoney(this.freeParkingPot);
                    this.addLog(`🎰 JACKPOT! ${player.name} collected $${this.freeParkingPot} from Free Parking!`, 'card');
                    this.freeParkingPot = 0;
                } else {
                    this.addLog(`${player.name} is relaxing at Free Parking`);
                }
                break;
        }

        return { action: 'none' };
    },

    /**
     * Process landing on a property
     */
    processPropertyLanding(player, tile) {
        const owner = this.players.find(p => p.ownsProperty(tile.id));

        if (!owner) {
            // Property is available
            if (player.canAfford(tile.price)) {
                return { action: 'canBuy', tile };
            } else {
                this.addLog(`${player.name} cannot afford ${tile.name} ($${tile.price})`);
                return { action: 'cantAfford', tile };
            }
        } else if (owner.id === player.id) {
            // Player owns this property
            this.addLog(`${player.name} landed on their own property`);
            return { action: 'ownProperty' };
        } else if (owner.inJail) {
            // Owner is in jail, no rent
            this.addLog(`${player.name} doesn't pay rent - ${owner.name} is in jail`);
            return { action: 'ownerInJail' };
        } else {
            // Must pay rent
            const rent = this.calculateRent(tile, owner);
            return { action: 'payRent', tile, owner, rent };
        }
    },

    /**
     * Calculate rent for a property
     */
    calculateRent(tile, owner) {
        // If mortgaged, no rent
        if (owner.isMortgaged(tile.id)) {
            return 0;
        }

        if (tile.type === 'property') {
            const houseCount = this.propertyHouses[tile.id] || 0;

            // If houses exist, use specific rent
            if (houseCount > 0) {
                return tile.rent[houseCount];
            }

            // Base rent (no houses)
            let rent = tile.rent[0];

            // Double rent if owner has monopoly (only on unimproved properties)
            if (owner.hasMonopoly(tile.group)) {
                rent *= 2;
            }

            return rent;
        } else if (tile.type === 'railroad') {
            // Rent based on number of railroads owned
            const railroadsOwned = owner.countRailroads();
            return tile.rent[railroadsOwned - 1];
        } else if (tile.type === 'utility') {
            // Rent based on dice roll and utilities owned
            const utilitiesOwned = owner.countUtilities();
            const multiplier = tile.rentMultiplier[utilitiesOwned - 1];
            const diceTotal = this.lastDiceRoll[0] + this.lastDiceRoll[1];
            return diceTotal * multiplier;
        }

        return 0;
    },

    /**
     * Process buying a property
     */
    buyProperty(player, tile) {
        if (player.subtractMoney(tile.price)) {
            player.addProperty(tile.id);
            this.propertyOwners[tile.id] = player.id;
            this.propertyHouses[tile.id] = 0; // Initialize houses
            this.addLog(`${player.name} bought ${tile.name} for $${tile.price}`, 'purchase');
            return true;
        }
        return false;
    },

    /**
     * Build house/hotel on property
     */
    buildHouse(player, tile) {
        // Validation handled by caller or repeated here
        if (!player.ownsProperty(tile.id)) return false;
        if (!player.hasMonopoly(tile.group)) return false;

        const currentHouses = this.propertyHouses[tile.id] || 0;
        if (currentHouses >= 5) return false;

        if (player.subtractMoney(tile.housePrice)) {
            this.propertyHouses[tile.id] = currentHouses + 1;
            const isHotel = this.propertyHouses[tile.id] === 5;
            this.addLog(`${player.name} built a ${isHotel ? 'Hotel' : 'House'} on ${tile.name}`, 'purchase');
            return true;
        }
        return false;
    },

    /**
     * Sabotage/Remove house from property
     */
    sabotageProperty(player, tile) {
        const SABOTAGE_COST = 150; // Cost to sabotage
        const houses = this.propertyHouses[tile.id] || 0;

        if (houses <= 0) return false;

        // Owner check is done in UI, but good to double check
        if (this.propertyOwners[tile.id] === player.id) return false; // Can't sabotage self

        if (player.subtractMoney(SABOTAGE_COST)) {
            this.propertyHouses[tile.id] = houses - 1;
            const ownerId = this.propertyOwners[tile.id];
            const owner = this.players.find(p => p.id === ownerId);

            this.addLog(`🔥 ${player.name} SABOTAGED ${owner.name}'s ${tile.name}! House removed.`, 'jail');
            return true;
        }
        return false;
    },



    /**
     * Mortgage a property
     */
    mortgageProperty(player, tile) {
        if (!player.ownsProperty(tile.id)) return false;

        // Cannot mortgage if there are buildings on any property in the group
        const groupProperties = this.players[0].properties.filter(id => {
            const t = getTile(id);
            return t && t.group === tile.group;
        }); // Logic simplification: check houses on THIS property for simplicity first, standard rules check whole group

        // Simpler check: check houses on this property
        if ((this.propertyHouses[tile.id] || 0) > 0) return { success: false, reason: 'Must sell houses first' };

        // Standard rule: check all properties in group
        const hasHousesInGroup = getPropertiesInGroup(tile.group).some(t => (this.propertyHouses[t.id] || 0) > 0);
        if (hasHousesInGroup) return { success: false, reason: 'Sell buildings in this color group first' };

        if (!player.isMortgaged(tile.id)) {
            const mortgageValue = Math.floor(tile.price / 2);
            player.addMoney(mortgageValue);
            player.mortgagedProperties.push(tile.id);
            this.addLog(`${player.name} mortgaged ${tile.name} for $${mortgageValue}`, 'money');
            return { success: true };
        }
        return { success: false, reason: 'Already mortgaged' };
    },

    /**
     * Unmortgage a property
     */
    unmortgageProperty(player, tile) {
        if (!player.ownsProperty(tile.id)) return false;

        if (player.isMortgaged(tile.id)) {
            const mortgageValue = Math.floor(tile.price / 2);
            const interest = Math.ceil(mortgageValue * 0.1);
            const cost = mortgageValue + interest;

            if (player.subtractMoney(cost)) {
                // Remove from mortgaged array
                const index = player.mortgagedProperties.indexOf(tile.id);
                if (index > -1) player.mortgagedProperties.splice(index, 1);

                this.addLog(`${player.name} unmortgaged ${tile.name} for $${cost}`, 'purchase');
                return { success: true };
            }
            return { success: false, reason: 'Not enough money' };
        }
        return { success: false, reason: 'Not mortgaged' };
    },

    /**
     * Process paying rent
     */
    payRent(player, owner, amount) {
        if (player.subtractMoney(amount)) {
            owner.addMoney(amount);
            this.addLog(`${player.name} paid $${amount} rent to ${owner.name}`, 'rent');
            return true;
        } else {
            // Player cannot afford rent - bankruptcy
            const available = player.money;
            player.money = 0;
            owner.addMoney(available);
            this.addLog(`${player.name} paid $${available} (all they had) to ${owner.name}`, 'rent');
            this.declareBankruptcy(player, owner);
            return false;
        }
    },

    /**
     * Process tax payment
     */
    processTax(player, tile) {
        if (player.subtractMoney(tile.amount)) {
            this.addLog(`${player.name} paid $${tile.amount} ${tile.name}`, 'rent');
        } else {
            const available = player.money;
            player.money = 0;
            this.addLog(`${player.name} paid $${available} tax (all they had)`, 'rent');
            this.addLog(`${player.name} paid $${available} tax (all they had)`, 'rent');
            this.declareBankruptcy(player, null);
        }

        // Add to jackpot if rule enabled
        if (this.houseRules.parkingJackpot) {
            this.freeParkingPot += tile.amount;
            this.addLog(`💰 Tax added to Free Parking Jackpot: $${this.freeParkingPot} total`);
        }

        return { action: 'taxPaid' };
    },

    /**
     * Process chance card (Fortune or Fate)
     */
    async processChanceCard(player, tile) {
        let card;
        let typeName;

        if (tile && tile.subtype === 'fate') {
            card = drawFateCard();
            typeName = 'Fate';
        } else {
            card = drawFortuneCard();
            typeName = 'Fortune';
        }

        this.addLog(`${player.name} drew a ${typeName} card`, 'card');

        return { action: 'chanceCard', card, cardType: typeName };
    },

    /**
     * Apply chance card effect
     */
    async applyCardEffect(player, card) {
        const effect = card.effect;

        switch (effect.type) {
            case 'money':
                if (effect.amount > 0) {
                    player.addMoney(effect.amount);
                    this.addLog(`${player.name} received $${effect.amount}`, 'card');
                } else {
                    if (!player.subtractMoney(-effect.amount)) {
                        this.declareBankruptcy(player, null);
                    } else {
                        this.addLog(`${player.name} paid $${-effect.amount}`, 'card');
                    }
                }
                break;

            case 'move':
                const oldPos = player.position;
                player.moveTo(effect.position, effect.collectStart);
                if (effect.collectStart && effect.position < oldPos) {
                    this.addLog(`${player.name} passed START and collected $${START_BONUS}`, 'card');
                }
                this.addLog(`${player.name} moved to ${getTile(effect.position).name}`, 'card');
                return { needsLandingProcess: true };

            case 'moveRelative':
                const { newPosition, passedStart } = player.moveSpaces(effect.spaces);
                if (passedStart) {
                    this.addLog(`${player.name} passed START`, 'card');
                }
                this.addLog(`${player.name} moved to ${getTile(newPosition).name}`, 'card');
                return { needsLandingProcess: true };

            case 'jail':
                this.sendToJail(player);
                break;

            case 'jailFree':
                player.hasJailFreeCard = true;
                this.addLog(`${player.name} got a Get Out of Jail Free card!`, 'card');
                break;

            case 'collectFromAll':
                let collected = 0;
                this.getActivePlayers().forEach(p => {
                    if (p.id !== player.id) {
                        const amount = Math.min(effect.amount, p.money);
                        p.subtractMoney(amount);
                        collected += amount;
                    }
                });
                player.addMoney(collected);
                this.addLog(`${player.name} collected $${collected} from other players`, 'card');
                break;

            case 'payToAll':
                const otherPlayers = this.getActivePlayers().filter(p => p.id !== player.id);
                const totalToPay = effect.amount * otherPlayers.length;
                if (player.canAfford(totalToPay)) {
                    player.subtractMoney(totalToPay);
                    otherPlayers.forEach(p => p.addMoney(effect.amount));
                    this.addLog(`${player.name} paid $${effect.amount} to each player`, 'card');
                } else {
                    this.declareBankruptcy(player, null);
                }
                break;

            case 'payPerProperty':
                const propertyCost = effect.amount * player.properties.length;
                if (player.canAfford(propertyCost)) {
                    player.subtractMoney(propertyCost);
                    this.addLog(`${player.name} paid $${propertyCost} for repairs`, 'card');
                } else {
                    this.declareBankruptcy(player, null);
                }
                break;

            // HEIST CARD EFFECTS
            case 'stealFromRichest':
                const richestPlayer = this.getActivePlayers()
                    .filter(p => p.id !== player.id)
                    .sort((a, b) => b.money - a.money)[0];
                if (richestPlayer) {
                    const stealAmount = Math.min(effect.amount, richestPlayer.money);
                    richestPlayer.subtractMoney(stealAmount);
                    player.addMoney(stealAmount);
                    this.addLog(`💰 ${player.name} stole $${stealAmount} from ${richestPlayer.name}!`, 'card');
                }
                break;

            case 'stealFromAll':
                let totalStolen = 0;
                this.getActivePlayers().forEach(p => {
                    if (p.id !== player.id) {
                        const stealAmt = Math.min(effect.amount, p.money);
                        p.subtractMoney(stealAmt);
                        totalStolen += stealAmt;
                    }
                });
                player.addMoney(totalStolen);
                this.addLog(`🎭 ${player.name} stole $${totalStolen} total from all players!`, 'card');
                break;

            case 'stealChoice':
                // This requires UI interaction - return special action
                return {
                    needsLandingProcess: false,
                    needsPlayerChoice: true,
                    choiceType: 'stealChoice',
                    amount: effect.amount
                };

            case 'freeArson':
                // This requires UI interaction - return special action
                return {
                    needsLandingProcess: false,
                    needsPlayerChoice: true,
                    choiceType: 'freeArson'
                };

            case 'everyoneLoses':
                this.getActivePlayers().forEach(p => {
                    if (p.canAfford(effect.amount)) {
                        p.subtractMoney(effect.amount);
                    } else {
                        const lost = p.money;
                        p.money = 0;
                        if (p.id !== player.id) {
                            this.declareBankruptcy(p, null);
                        }
                    }
                });
                this.addLog(`📉 Market Crash! Everyone lost $${effect.amount}`, 'card');
                break;

            case 'gamble':
                const won = Math.random() > 0.5;
                if (won) {
                    player.addMoney(effect.winAmount);
                    this.addLog(`🎰 ${player.name} won the gamble! +$${effect.winAmount}`, 'card');
                } else {
                    if (player.canAfford(effect.loseAmount)) {
                        player.subtractMoney(effect.loseAmount);
                        this.addLog(`🎰 ${player.name} lost the gamble! -$${effect.loseAmount}`, 'card');
                    } else {
                        this.addLog(`🎰 ${player.name} lost but couldn't pay $${effect.loseAmount}`, 'card');
                        this.declareBankruptcy(player, null);
                    }
                }
                break;
        }

        return { needsLandingProcess: false };
    },

    /**
     * Send player to jail
     */
    sendToJail(player) {
        player.goToJail();
        this.consecutiveDoubles = 0;
        this.addLog(`${player.name} was sent to Jail!`, 'jail');
        return { action: 'jailed' };
    },

    /**
     * Process jail turn
     */
    processJailTurn(player, diceRoll) {
        if (diceRoll.isDoubles) {
            player.leaveJail();
            this.addLog(`${player.name} rolled doubles and escaped Jail!`, 'jail');
            return { escaped: true, canMove: true };
        }

        const forcedToLeave = player.incrementJailTurn();
        if (forcedToLeave) {
            if (player.canAfford(JAIL_BAIL)) {
                player.subtractMoney(JAIL_BAIL);
                player.leaveJail();
                this.addLog(`${player.name} paid $${JAIL_BAIL} and left Jail`, 'jail');
                return { escaped: true, canMove: true };
            } else {
                this.declareBankruptcy(player, null);
                return { escaped: false, canMove: false };
            }
        }

        this.addLog(`${player.name} stays in Jail (turn ${player.jailTurns}/${MAX_JAIL_TURNS})`, 'jail');
        return { escaped: false, canMove: false };
    },

    /**
     * Pay to leave jail
     */
    payJailBail(player) {
        if (player.hasJailFreeCard) {
            player.hasJailFreeCard = false;
            player.leaveJail();
            this.addLog(`${player.name} used Get Out of Jail Free card!`, 'jail');
            return true;
        }

        if (player.subtractMoney(JAIL_BAIL)) {
            player.leaveJail();
            this.addLog(`${player.name} paid $${JAIL_BAIL} to leave Jail`, 'jail');
            return true;
        }

        return false;
    },

    /**
     * Declare player bankrupt
     */
    declareBankruptcy(player, creditor) {
        player.goBankrupt();
        this.addLog(`💀 ${player.name} went BANKRUPT!`, 'jail');

        // Transfer properties
        if (creditor) {
            player.properties.forEach(tileId => {
                creditor.addProperty(tileId);
                this.propertyOwners[tileId] = creditor.id;
            });
            this.addLog(`${creditor.name} received ${player.name}'s properties`);
        } else {
            // Return to bank (remove ownership)
            player.properties.forEach(tileId => {
                delete this.propertyOwners[tileId];
                delete this.propertyHouses[tileId];
            });
        }
        player.properties = [];

        // Check for game over
        if (this.getActivePlayers().length <= 1) {
            this.endGame();
        }
    },

    /**
     * End current player's turn
     */
    endTurn() {
        const player = this.getCurrentPlayer();
        this.consecutiveDoubles = 0;

        // Find next active player
        let nextIndex = this.currentPlayerIndex;
        let checked = 0;

        do {
            nextIndex = (nextIndex + 1) % this.players.length;
            checked++;

            // Check for new round
            if (nextIndex === 0) {
                this.round++;
                this.addLog(`--- Round ${this.round} ---`);
            }
        } while (this.players[nextIndex].isBankrupt && checked < this.players.length);

        this.currentPlayerIndex = nextIndex;
        this.turnPhase = TURN_PHASES.WAITING;

        const nextPlayer = this.getCurrentPlayer();
        this.addLog(`${nextPlayer.name}'s turn`);

        return nextPlayer;
    },

    /**
     * End the game
     */
    endGame() {
        this.phase = GAME_PHASES.GAME_OVER;
        this.addLog('🎉 GAME OVER!');
    },

    /**
     * Get winner (player with most net worth)
     */
    getWinner() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 1) {
            return activePlayers[0];
        }

        // Sort by net worth
        return [...this.players]
            .sort((a, b) => b.getNetWorth() - a.getNetWorth())[0];
    },

    /**
     * Get final standings
     */
    getStandings() {
        return [...this.players]
            .sort((a, b) => {
                if (a.isBankrupt && !b.isBankrupt) return 1;
                if (!a.isBankrupt && b.isBankrupt) return -1;
                return b.getNetWorth() - a.getNetWorth();
            });
    },


    /**
     * Serialize game state
     */
    toJSON() {
        return {
            phase: this.phase,
            players: this.players.map(p => p.toJSON()),
            currentPlayerIndex: this.currentPlayerIndex,
            turnPhase: this.turnPhase,
            lastDiceRoll: this.lastDiceRoll,
            consecutiveDoubles: this.consecutiveDoubles,
            propertyOwners: this.propertyOwners,
            propertyHouses: this.propertyHouses,
            log: this.log,
            round: this.round,
            houseRules: this.houseRules,
            freeParkingPot: this.freeParkingPot
        };
    },

    /**
     * Restore game state from JSON
     */
    fromJSON(data) {
        this.phase = data.phase;
        this.currentPlayerIndex = data.currentPlayerIndex;
        this.turnPhase = data.turnPhase;
        this.lastDiceRoll = data.lastDiceRoll;
        this.consecutiveDoubles = data.consecutiveDoubles;
        this.propertyOwners = data.propertyOwners;
        this.propertyHouses = data.propertyHouses;
        this.log = data.log;
        this.round = data.round;
        this.houseRules = data.houseRules || { parkingJackpot: false, doubleGo: false };
        this.freeParkingPot = data.freeParkingPot || 0;

        // Restore players
        this.players = data.players.map(pData => {
            const player = createPlayer(pData.id, pData.name, pData.colorIndex);
            player.money = pData.money;
            player.position = pData.position;
            // Restore properties array
            player.properties = pData.properties;
            player.inJail = pData.inJail;
            player.jailTurns = pData.jailTurns;
            player.hasJailFreeCard = pData.hasJailFreeCard;
            player.isBankrupt = pData.isBankrupt;
            // Restore bot properties
            player.isBot = pData.isBot || false;
            player.botDifficulty = pData.botDifficulty || 'medium';
            if (pData.mortgagedProperties) {
                player.mortgagedProperties = pData.mortgagedProperties;
            }
            return player;
        });

        this.addLog('Game Loaded successfully!');
    },

    /**
     * Add entry to game log
     */
    addLog(message, type = '') {
        this.log.push({ message, type, timestamp: Date.now() });

        // Keep log manageable
        if (this.log.length > 100) {
            this.log.shift();
        }
    }
};

