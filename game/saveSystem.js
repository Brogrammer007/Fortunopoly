/**
 * SAVESYSTEM.JS - Save and Load functionality for Fortunopoly
 * Handles persistence using localStorage
 */

const SaveSystem = {
    SAVE_KEY: 'fortunopoly_save_v1',

    /**
     * Save current game state
     */
    save(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                version: 1,
                state: gameState.toJSON()
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            console.log('Game saved successfully');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },

    /**
     * Load game state
     */
    load() {
        try {
            const dataString = localStorage.getItem(this.SAVE_KEY);
            if (!dataString) return null;

            const data = JSON.parse(dataString);
            return data.state;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    },

    /**
     * Check if a saved game exists
     */
    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    /**
     * Delete saved game
     */
    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log('Save deleted');
    },

    /**
     * Get save info (timestamp, etc)
     */
    getSaveInfo() {
        try {
            const dataString = localStorage.getItem(this.SAVE_KEY);
            if (!dataString) return null;

            const data = JSON.parse(dataString);
            return {
                timestamp: new Date(data.timestamp),
                playerCount: data.state.players.length,
                round: data.state.round
            };
        } catch (e) {
            return null;
        }
    },

    // Aliases for compatibility with main.js
    saveGame(gameState) {
        return this.save(gameState);
    },

    loadGame() {
        return this.load();
    },

    hasSavedGame() {
        return this.hasSave();
    },

    clearSave() {
        return this.deleteSave();
    },

    autoSave(gameState) {
        // We can add throttling here if needed
        return this.save(gameState);
    }
};
