/**
 * BOTAI.JS - Artificial Intelligence for Fortunopoly Players
 * Supports three difficulty levels: easy, medium, hard
 */

const BotAI = {
    // Delays for "thinking" simulation
    DELAYS: {
        move: 800,
        decision: 1000,
        action: 600
    },

    /**
     * Decision thresholds based on difficulty
     */
    DIFFICULTY: {
        easy: {
            buyChance: 0.4,            // 40% chance to buy available property
            minMoneyBuffer: 100,       // Keep at least $100
            tradeAcceptChance: 0.8,    // Very generous with trades
            buildChance: 0.3,          // Rarely builds
            prioritizeMonopoly: false, // Doesn't focus on monopolies
            sabotageChance: 0.1        // Rarely sabotages
        },
        medium: {
            buyChance: 0.7,
            minMoneyBuffer: 250,
            tradeAcceptChance: 0.4,
            buildChance: 0.6,
            prioritizeMonopoly: true,
            sabotageChance: 0.3
        },
        hard: {
            buyChance: 0.95,           // Almost always buys
            minMoneyBuffer: 150,       // Aggressive but safe
            tradeAcceptChance: 0.1,    // Stingy
            buildChance: 0.9,          // Always builds when possible
            prioritizeMonopoly: true,
            sabotageChance: 0.5        // Aggressive sabotage
        }
    },

    /**
     * Main entry point for bot turn - FULLY AUTOMATIC
     */
    async takeTurn(player, gameState) {
        console.log(`🤖 Bot ${player.name} (${player.botDifficulty}) starting turn...`);

        await this.sleep(this.DELAYS.move);

        // Check if in jail first
        if (player.inJail) {
            await this.handleJailTurn(player, gameState);
            return;
        }

        // Roll dice automatically
        await this.rollAndMove(player, gameState);
    },

    /**
     * Roll dice and handle the entire move sequence
     */
    async rollAndMove(player, gameState) {
        // Trigger the dice roll
        if (elements.rollDiceBtn && !elements.rollDiceBtn.disabled) {
            elements.rollDiceBtn.click();
        }
    },

    /**
     * Handle jail turn for bot
     */
    async handleJailTurn(player, gameState) {
        const settings = this.DIFFICULTY[this.getDifficulty(player)];

        // Decide whether to pay bail or roll
        if (this.shouldPayJailBail(player, settings)) {
            // Pay to get out
            if (elements.payJailBtn && !elements.payJailBtn.classList.contains('hidden')) {
                await this.sleep(this.DELAYS.decision);
                elements.payJailBtn.click();
                await this.sleep(500);
                // Now roll
                await this.rollAndMove(player, gameState);
            }
        } else {
            // Try to roll doubles
            await this.rollAndMove(player, gameState);
        }
    },

    /**
     * Evaluate whether to buy a property - SMARTER AI
     */
    shouldBuyProperty(player, tile, gameState) {
        const difficulty = this.getDifficulty(player);
        const settings = this.DIFFICULTY[difficulty];

        // HARD: Always buy railroads and utilities
        if (difficulty === 'hard' && (tile.type === 'railroad' || tile.type === 'utility')) {
            if (player.money > tile.price + 50) return true;
        }

        // Always buy if it completes a monopoly (all difficulties)
        if (tile.group) {
            const propertiesInGroup = getPropertiesInGroup(tile.group).length;
            const ownedInGroup = player.countPropertiesInGroup(tile.group);
            if (ownedInGroup === propertiesInGroup - 1) {
                console.log(`🤖 ${player.name}: Completing monopoly! Must buy ${tile.name}`);
                return true;
            }
        }

        // HARD: Buy if it blocks opponent monopoly
        if (difficulty === 'hard' && tile.group) {
            const otherPlayersNeedIt = gameState.getActivePlayers().some(p => {
                if (p.id === player.id) return false;
                const theirOwned = p.countPropertiesInGroup(tile.group);
                const groupSize = getPropertiesInGroup(tile.group).length;
                return theirOwned === groupSize - 1;
            });
            if (otherPlayersNeedIt && player.money > tile.price) {
                console.log(`🤖 ${player.name}: Blocking opponent monopoly!`);
                return true;
            }
        }

        // Check affordability with buffer
        if (player.money < tile.price + settings.minMoneyBuffer) {
            console.log(`🤖 ${player.name}: Can't afford ${tile.name} with buffer`);
            return false;
        }

        // MEDIUM/HARD: Prioritize properties we have partial monopoly in
        if (settings.prioritizeMonopoly && tile.group) {
            const ownedInGroup = player.countPropertiesInGroup(tile.group);
            if (ownedInGroup > 0) {
                console.log(`🤖 ${player.name}: Have ${ownedInGroup} in group, buying!`);
                return true;
            }
        }

        // Random decision based on difficulty
        const decision = Math.random() < settings.buyChance;
        console.log(`🤖 ${player.name}: Buy ${tile.name}? ${decision ? 'Yes' : 'No'} (${settings.buyChance * 100}% chance)`);
        return decision;
    },

    /**
     * Evaluate jail decision (Pay or Roll) - SMARTER
     */
    shouldPayJailBail(player, settings) {
        // Always use Get Out of Jail Free card if available
        if (player.hasJailFreeCard) return true;

        // Early game: Don't pay, try to roll
        if (player.properties.length < 3) return false;

        // Late game with good money: Pay to get out and collect rent
        if (player.money > 800 && player.properties.length > 5) return true;

        // If we have a monopoly, definitely get out to build/collect rent
        const hasAnyMonopoly = Object.keys(PROPERTY_GROUPS).some(group =>
            player.hasMonopoly(group)
        );
        if (hasAnyMonopoly && player.money > 300) return true;

        // Hard bots are more aggressive about getting out
        if (settings && player.botDifficulty === 'hard' && player.money > 400) return true;

        return player.money > 600;
    },

    /**
     * Decide whether to build houses - AUTOMATIC BUILDING
     */
    async tryBuildHouses(player, gameState) {
        const settings = this.DIFFICULTY[this.getDifficulty(player)];

        if (Math.random() > settings.buildChance) return;

        // Find properties where we can build
        for (const tileId of player.properties) {
            const tile = getTile(tileId);
            if (!tile || tile.type !== 'property' || !tile.group) continue;

            // Check if we have monopoly
            if (!player.hasMonopoly(tile.group)) continue;

            // Check if we can afford to build
            const houseCost = tile.housePrice;
            const currentHouses = gameState.propertyHouses[tileId] || 0;

            if (currentHouses >= 5) continue; // Already max
            if (player.money < houseCost + settings.minMoneyBuffer) continue;

            // Build!
            if (gameState.buildHouse(player, tile)) {
                console.log(`🤖 ${player.name}: Built house on ${tile.name}!`);
                await this.sleep(300);
            }
        }
    },

    /**
     * Evaluate trade proposal - SMARTER
     */
    evaluateTrade(player, proposal, gameState) {
        const settings = this.DIFFICULTY[this.getDifficulty(player)];

        // Calculate value of what we receive vs give
        let receiveValue = proposal.requestMoney || 0;
        let giveValue = proposal.offerMoney || 0;

        // Add property values
        if (proposal.requestProperties) {
            proposal.requestProperties.forEach(tileId => {
                const tile = getTile(tileId);
                if (tile) receiveValue += tile.price;
            });
        }
        if (proposal.offerProperties) {
            proposal.offerProperties.forEach(tileId => {
                const tile = getTile(tileId);
                if (tile) giveValue += tile.price;
            });
        }

        // Check if we would complete a monopoly
        let completesMonopoly = false;
        if (proposal.requestProperties) {
            proposal.requestProperties.forEach(tileId => {
                const tile = getTile(tileId);
                if (tile && tile.group) {
                    const wouldOwn = player.countPropertiesInGroup(tile.group) + 1;
                    if (wouldOwn === getPropertiesInGroup(tile.group).length) {
                        completesMonopoly = true;
                    }
                }
            });
        }

        // HARD: Accept if it completes our monopoly
        if (player.botDifficulty === 'hard' && completesMonopoly && receiveValue > giveValue * 0.5) {
            return true;
        }

        // Basic value check
        if (receiveValue >= giveValue * 1.2) return true;

        // Random based on difficulty
        return Math.random() < settings.tradeAcceptChance;
    },

    /**
     * End the bot's turn automatically
     */
    async endTurn() {
        await this.sleep(this.DELAYS.action);
        if (elements.endTurnBtn && !elements.endTurnBtn.classList.contains('hidden')) {
            elements.endTurnBtn.click();
        }
    },

    /**
     * Helper to get difficulty
     */
    getDifficulty(player) {
        return player.botDifficulty || 'medium';
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
