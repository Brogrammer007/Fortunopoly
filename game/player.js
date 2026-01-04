/**
 * PLAYER.JS - Player class and management for Fortunopoly
 */

// Character SVGs (Simple geometric characters)
const CHARACTERS = {
    tycoon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#333"/><rect x="25" y="45" width="50" height="10" fill="white"/><rect x="35" y="20" width="30" height="35" fill="white"/><circle cx="65" cy="55" r="10" stroke="gold" stroke-width="3" fill="none"/><line x1="65" y1="65" x2="65" y2="80" stroke="gold" stroke-width="2"/></svg>`,
    cat: `<svg viewBox="0 0 100 100"><path d="M20 80 Q20 20 50 20 Q80 20 80 80 Z" fill="white"/><polygon points="25,30 35,5 45,25" fill="white"/><polygon points="55,25 65,5 75,30" fill="white"/><circle cx="35" cy="45" r="5" fill="#333"/><circle cx="65" cy="45" r="5" fill="#333"/><path d="M45 55 Q50 60 55 55" stroke="#333" stroke-width="3" fill="none"/></svg>`,
    car: `<svg viewBox="0 0 100 100"><rect x="20" y="50" width="60" height="20" rx="5" fill="white"/><path d="M30 50 L40 30 L60 30 L70 50 Z" fill="white"/><circle cx="30" cy="70" r="10" fill="#333"/><circle cx="70" cy="70" r="10" fill="#333"/></svg>`,
    robot: `<svg viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" rx="5" fill="white"/><rect x="40" y="20" width="20" height="10" fill="#888"/><line x1="50" y1="20" x2="50" y2="5" stroke="#888" stroke-width="3"/><circle cx="50" cy="5" r="4" fill="red"/><circle cx="40" cy="45" r="4" fill="#333"/><circle cx="60" cy="45" r="4" fill="#333"/><rect x="40" y="55" width="20" height="5" fill="#333"/></svg>`,
    ship: `<svg viewBox="0 0 100 100"><path d="M20 60 Q50 90 80 60 L80 50 L20 50 Z" fill="white"/><path d="M50 50 L50 10 L80 40 Z" fill="#ccc"/><path d="M50 50 L50 15 L20 40 Z" fill="#eee"/></svg>`,
    dog: `<svg viewBox="0 0 100 100"><path d="M30 50 Q30 20 50 20 Q70 20 70 50 L70 80 L30 80 Z" fill="white"/><ellipse cx="30" cy="40" rx="10" ry="20" fill="#ccc"/><ellipse cx="70" cy="40" rx="10" ry="20" fill="#ccc"/><circle cx="40" cy="45" r="4" fill="#333"/><circle cx="60" cy="45" r="4" fill="#333"/><circle cx="50" cy="55" r="5" fill="#333"/></svg>`
};

// Player colors (matches CSS variables)
const PLAYER_COLORS = [
    { name: 'Tycoon Red', hex: '#E74C3C', svg: CHARACTERS.tycoon },
    { name: 'Cyber Blue', hex: '#3498DB', svg: CHARACTERS.robot },
    { name: 'Lucky Green', hex: '#2ECC71', svg: CHARACTERS.cat },
    { name: 'Speed Orange', hex: '#F39C12', svg: CHARACTERS.car },
    { name: 'Royal Purple', hex: '#9B59B6', svg: CHARACTERS.ship },
    { name: 'Loyal Teal', hex: '#1ABC9C', svg: CHARACTERS.dog }
];

// Starting money for each player
const STARTING_MONEY = 1500;

// Money collected when passing START
const START_BONUS = 200;

// Cost to leave jail by paying
const JAIL_BAIL = 50;

// Maximum turns in jail before forced to pay
const MAX_JAIL_TURNS = 3;

/**
 * Player class representing a single player
 */
class Player {
    constructor(id, name, colorIndex) {
        this.id = id;
        this.name = name;
        this.colorIndex = colorIndex;
        this.color = PLAYER_COLORS[colorIndex];
        this.money = STARTING_MONEY;
        this.position = 0;
        this.properties = []; // Array of tile IDs
        this.mortgagedProperties = []; // Array of mortgaged tile IDs
        this.inJail = false;
        this.jailTurns = 0;
        this.hasJailFreeCard = false;
        this.isBankrupt = false;
        this.doublesCount = 0; // For tracking consecutive doubles
    }

    /**
     * Add money to player's balance
     */
    addMoney(amount) {
        this.money += amount;
        return this.money;
    }

    /**
     * Subtract money from player's balance
     * Returns true if successful, false if would cause bankruptcy
     */
    subtractMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    /**
     * Check if player can afford an amount
     */
    canAfford(amount) {
        return this.money >= amount;
    }

    /**
     * Add a property to player's portfolio
     */
    addProperty(tileId) {
        if (!this.properties.includes(tileId)) {
            this.properties.push(tileId);
        }
    }

    /**
     * Remove a property from player's portfolio
     */
    removeProperty(tileId) {
        const index = this.properties.indexOf(tileId);
        if (index > -1) {
            this.properties.splice(index, 1);
        }
    }

    /**
     * Check if player owns a property
     */
    ownsProperty(tileId) {
        return this.properties.includes(tileId);
    }

    /**
     * Count properties owned in a specific group
     */
    countPropertiesInGroup(group) {
        return this.properties.filter(tileId => {
            const tile = getTile(tileId);
            return tile && tile.group === group;
        }).length;
    }

    /**
     * Check if player owns all properties in a group (monopoly)
     */
    hasMonopoly(group) {
        const groupInfo = PROPERTY_GROUPS[group];
        if (!groupInfo) return false;
        return this.countPropertiesInGroup(group) === groupInfo.properties;
    }

    /**
     * Count railroads owned
     */
    countRailroads() {
        return this.properties.filter(tileId => {
            const tile = getTile(tileId);
            return tile && tile.type === 'railroad';
        }).length;
    }

    /**
     * Count utilities owned
     */
    countUtilities() {
        return this.properties.filter(tileId => {
            const tile = getTile(tileId);
            return tile && tile.type === 'utility';
        }).length;
    }

    /**
     * Move player to a new position
     * Returns true if passed START
     */
    moveTo(newPosition, collectStartBonus = true) {
        const passedStart = newPosition < this.position && newPosition !== 10; // 10 is jail
        this.position = newPosition;

        if (passedStart && collectStartBonus && !this.inJail) {
            this.addMoney(START_BONUS);
            return true;
        }
        return false;
    }

    /**
     * Move player by a number of spaces
     * Returns the new position and whether START was passed
     */
    moveSpaces(spaces) {
        const oldPosition = this.position;
        let newPosition = (this.position + spaces) % 40;
        if (newPosition < 0) newPosition += 40;

        const passedStart = spaces > 0 && newPosition < oldPosition;
        this.position = newPosition;

        if (passedStart && !this.inJail) {
            this.addMoney(START_BONUS);
        }

        return { newPosition, passedStart };
    }

    /**
     * Send player to jail
     */
    goToJail() {
        this.position = 10; // Jail position
        this.inJail = true;
        this.jailTurns = 0;
    }

    /**
     * Release player from jail
     */
    leaveJail() {
        this.inJail = false;
        this.jailTurns = 0;
    }

    /**
     * Increment jail turn counter
     */
    incrementJailTurn() {
        this.jailTurns++;
        return this.jailTurns >= MAX_JAIL_TURNS;
    }

    /**
     * Declare bankruptcy
     */
    goBankrupt() {
        this.isBankrupt = true;
        this.money = 0;
        // Properties will be handled by game state
    }

    /**
     * Get player's net worth (money + property values)
     */
    getNetWorth() {
        let worth = this.money;
        this.properties.forEach(tileId => {
            const tile = getTile(tileId);
            if (tile && tile.price) {
                worth += tile.price;
            }
        });
        return worth;
    }

    /**
     * Get display initial for token
     */
    getInitial() {
        return this.name.charAt(0).toUpperCase();
    }

    /**
     * Get SVG content
     */
    getSVG() {
        return this.color.svg;
    }

    /**
     * Serialize player state
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            colorIndex: this.colorIndex,
            money: this.money,
            position: this.position,
            properties: [...this.properties],
            inJail: this.inJail,
            jailTurns: this.jailTurns,
            hasJailFreeCard: this.hasJailFreeCard,
            isBankrupt: this.isBankrupt,
            mortgagedProperties: this.mortgagedProperties,
            isBot: this.isBot || false,
            botDifficulty: this.botDifficulty || 'medium'
        };
    }

    /**
     * Check if property is mortgaged
     */
    isMortgaged(tileId) {
        return this.mortgagedProperties.includes(tileId);
    }
}

/**
 * Create a new player
 */
function createPlayer(id, name, colorIndex) {
    return new Player(id, name, colorIndex);
}

/**
 * Get player color by index
 */
function getPlayerColor(index) {
    return PLAYER_COLORS[index] || PLAYER_COLORS[0];
}
