/**
 * TRADING.JS - Trading system for Fortunopoly
 * Allows players to trade properties and money with each other
 */

/**
 * Trade Proposal Structure:
 * {
 *   fromPlayerId: number,
 *   toPlayerId: number,
 *   offeredProperties: [tileId, ...],
 *   offeredMoney: number,
 *   requestedProperties: [tileId, ...],
 *   requestedMoney: number
 * }
 */

const TradeSystem = {
    // Current active trade proposal
    activeTrade: null,

    /**
     * Create a new trade proposal
     */
    createProposal(fromPlayer, toPlayer) {
        this.activeTrade = {
            fromPlayerId: fromPlayer.id,
            toPlayerId: toPlayer.id,
            offeredProperties: [],
            offeredMoney: 0,
            requestedProperties: [],
            requestedMoney: 0
        };
        return this.activeTrade;
    },

    /**
     * Add property to offer
     */
    addOfferedProperty(tileId) {
        if (!this.activeTrade) return false;
        if (!this.activeTrade.offeredProperties.includes(tileId)) {
            this.activeTrade.offeredProperties.push(tileId);
            return true;
        }
        return false;
    },

    /**
     * Remove property from offer
     */
    removeOfferedProperty(tileId) {
        if (!this.activeTrade) return false;
        const index = this.activeTrade.offeredProperties.indexOf(tileId);
        if (index > -1) {
            this.activeTrade.offeredProperties.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Set offered money
     */
    setOfferedMoney(amount) {
        if (!this.activeTrade) return false;
        this.activeTrade.offeredMoney = Math.max(0, amount);
        return true;
    },

    /**
     * Add property to request
     */
    addRequestedProperty(tileId) {
        if (!this.activeTrade) return false;
        if (!this.activeTrade.requestedProperties.includes(tileId)) {
            this.activeTrade.requestedProperties.push(tileId);
            return true;
        }
        return false;
    },

    /**
     * Remove property from request
     */
    removeRequestedProperty(tileId) {
        if (!this.activeTrade) return false;
        const index = this.activeTrade.requestedProperties.indexOf(tileId);
        if (index > -1) {
            this.activeTrade.requestedProperties.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Set requested money
     */
    setRequestedMoney(amount) {
        if (!this.activeTrade) return false;
        this.activeTrade.requestedMoney = Math.max(0, amount);
        return true;
    },

    /**
     * Toggle property selection (for UI convenience)
     */
    toggleProperty(tileId, isOffer) {
        if (isOffer) {
            if (this.activeTrade.offeredProperties.includes(tileId)) {
                this.removeOfferedProperty(tileId);
            } else {
                this.addOfferedProperty(tileId);
            }
        } else {
            if (this.activeTrade.requestedProperties.includes(tileId)) {
                this.removeRequestedProperty(tileId);
            } else {
                this.addRequestedProperty(tileId);
            }
        }
    },

    /**
     * Validate trade is possible
     */
    validateTrade(gameState) {
        if (!this.activeTrade) return { valid: false, reason: 'No active trade' };

        const fromPlayer = gameState.players.find(p => p.id === this.activeTrade.fromPlayerId);
        const toPlayer = gameState.players.find(p => p.id === this.activeTrade.toPlayerId);

        if (!fromPlayer || !toPlayer) {
            return { valid: false, reason: 'Invalid players' };
        }

        if (fromPlayer.isBankrupt || toPlayer.isBankrupt) {
            return { valid: false, reason: 'Cannot trade with bankrupt player' };
        }

        // Check from player owns offered properties
        for (const tileId of this.activeTrade.offeredProperties) {
            if (!fromPlayer.ownsProperty(tileId)) {
                return { valid: false, reason: `${fromPlayer.name} doesn't own ${getTile(tileId).name}` };
            }
            // Check no houses on property - can't trade improved properties
            if (gameState.propertyHouses[tileId] > 0) {
                return { valid: false, reason: `Cannot trade ${getTile(tileId).name} - has buildings` };
            }
        }

        // Check to player owns requested properties
        for (const tileId of this.activeTrade.requestedProperties) {
            if (!toPlayer.ownsProperty(tileId)) {
                return { valid: false, reason: `${toPlayer.name} doesn't own ${getTile(tileId).name}` };
            }
            // Check no houses on property
            if (gameState.propertyHouses[tileId] > 0) {
                return { valid: false, reason: `Cannot trade ${getTile(tileId).name} - has buildings` };
            }
        }

        // Check money
        if (this.activeTrade.offeredMoney > fromPlayer.money) {
            return { valid: false, reason: `${fromPlayer.name} doesn't have $${this.activeTrade.offeredMoney}` };
        }

        if (this.activeTrade.requestedMoney > toPlayer.money) {
            return { valid: false, reason: `${toPlayer.name} doesn't have $${this.activeTrade.requestedMoney}` };
        }

        // Check trade has some content
        if (this.activeTrade.offeredProperties.length === 0 &&
            this.activeTrade.offeredMoney === 0 &&
            this.activeTrade.requestedProperties.length === 0 &&
            this.activeTrade.requestedMoney === 0) {
            return { valid: false, reason: 'Trade is empty' };
        }

        return { valid: true };
    },

    /**
     * Execute the trade
     */
    executeTrade(gameState) {
        const validation = this.validateTrade(gameState);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }

        const fromPlayer = gameState.players.find(p => p.id === this.activeTrade.fromPlayerId);
        const toPlayer = gameState.players.find(p => p.id === this.activeTrade.toPlayerId);

        // Transfer offered properties from -> to
        for (const tileId of this.activeTrade.offeredProperties) {
            fromPlayer.removeProperty(tileId);
            toPlayer.addProperty(tileId);
            gameState.propertyOwners[tileId] = toPlayer.id;
        }

        // Transfer requested properties to -> from
        for (const tileId of this.activeTrade.requestedProperties) {
            toPlayer.removeProperty(tileId);
            fromPlayer.addProperty(tileId);
            gameState.propertyOwners[tileId] = fromPlayer.id;
        }

        // Transfer money
        if (this.activeTrade.offeredMoney > 0) {
            fromPlayer.subtractMoney(this.activeTrade.offeredMoney);
            toPlayer.addMoney(this.activeTrade.offeredMoney);
        }

        if (this.activeTrade.requestedMoney > 0) {
            toPlayer.subtractMoney(this.activeTrade.requestedMoney);
            fromPlayer.addMoney(this.activeTrade.requestedMoney);
        }

        // Log the trade
        let logMessage = `🤝 Trade completed: ${fromPlayer.name} ↔ ${toPlayer.name}`;
        gameState.addLog(logMessage, 'trade');

        // Clear active trade
        this.activeTrade = null;

        return { success: true };
    },

    /**
     * Cancel the current trade
     */
    cancelTrade() {
        this.activeTrade = null;
    },

    /**
     * Get trade summary for display
     */
    getTradeSummary(gameState) {
        if (!this.activeTrade) return null;

        const fromPlayer = gameState.players.find(p => p.id === this.activeTrade.fromPlayerId);
        const toPlayer = gameState.players.find(p => p.id === this.activeTrade.toPlayerId);

        return {
            fromPlayer,
            toPlayer,
            offeredProperties: this.activeTrade.offeredProperties.map(id => getTile(id)),
            offeredMoney: this.activeTrade.offeredMoney,
            requestedProperties: this.activeTrade.requestedProperties.map(id => getTile(id)),
            requestedMoney: this.activeTrade.requestedMoney
        };
    }
};

