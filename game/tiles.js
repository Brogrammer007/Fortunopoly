/**
 * TILES.JS - Board tile definitions for Fortunopoly
 * 
 * Tile Types:
 * - start: Starting tile, collect money when passing
 * - property: Buyable properties with rent
 * - railroad: Special properties (4 total)
 * - utility: Utility properties (2 total)
 * - chance: Draw a chance card
 * - tax: Pay tax to the bank
 * - jail: Just visiting / In jail
 * - gotojail: Go directly to jail
 * - parking: Free parking (no effect)
 */

// Property color groups for rent multipliers
const PROPERTY_GROUPS = {
    brown: { color: '#8B4513', properties: 2 },
    lightblue: { color: '#87CEEB', properties: 3 },
    pink: { color: '#FF69B4', properties: 3 },
    orange: { color: '#FF8C00', properties: 3 },
    red: { color: '#DC143C', properties: 3 },
    yellow: { color: '#FFD700', properties: 3 },
    green: { color: '#228B22', properties: 3 },
    blue: { color: '#0000CD', properties: 2 }
};

// All 40 tiles on the board (indexed 0-39, starting from START going clockwise)
const TILES = [
    // Bottom row (right to left when viewing board, index 0-10)
    {
        id: 0,
        type: 'start',
        name: 'START',
        icon: '🚀',
        description: 'Collect $200 when you pass'
    },
    {
        id: 1,
        type: 'property',
        name: 'Elm Street',
        group: 'brown',
        price: 60,
        rent: [2, 10, 30, 90, 160, 250],
        housePrice: 50
    },
    {
        id: 2,
        type: 'chance',
        subtype: 'fortune',
        name: 'Fortune',
        icon: '🎴'
    },
    {
        id: 3,
        type: 'property',
        name: 'Oak Lane',
        group: 'brown',
        price: 60,
        rent: [4, 20, 60, 180, 320, 450],
        housePrice: 50
    },
    {
        id: 4,
        type: 'tax',
        name: 'Income Tax',
        amount: 200,
        icon: '💸'
    },
    {
        id: 5,
        type: 'railroad',
        name: 'North Station',
        price: 200,
        rent: [25, 50, 100, 200],
        icon: '🚂'
    },
    {
        id: 6,
        type: 'property',
        name: 'Pine Avenue',
        group: 'lightblue',
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        housePrice: 50
    },
    {
        id: 7,
        type: 'chance',
        subtype: 'fate', /* Added subtype */
        name: 'Fate',
        icon: '🔮' /* New icon */
    },
    {
        id: 8,
        type: 'property',
        name: 'Cedar Road',
        group: 'lightblue',
        price: 100,
        rent: [6, 30, 90, 270, 400, 550],
        housePrice: 50
    },
    {
        id: 9,
        type: 'property',
        name: 'Maple Drive',
        group: 'lightblue',
        price: 120,
        rent: [8, 40, 100, 300, 450, 600],
        housePrice: 50
    },
    {
        id: 10,
        type: 'jail',
        name: 'Jail',
        icon: '🔒',
        description: 'Just Visiting'
    },

    // Left side (bottom to top, index 11-19)
    {
        id: 11,
        type: 'property',
        name: 'Rose Court',
        group: 'pink',
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        housePrice: 100
    },
    {
        id: 12,
        type: 'utility',
        name: 'Power Plant',
        price: 150,
        icon: '⚡',
        rentMultiplier: [4, 10]
    },
    {
        id: 13,
        type: 'property',
        name: 'Lily Lane',
        group: 'pink',
        price: 140,
        rent: [10, 50, 150, 450, 625, 750],
        housePrice: 100
    },
    {
        id: 14,
        type: 'property',
        name: 'Daisy Way',
        group: 'pink',
        price: 160,
        rent: [12, 60, 180, 500, 700, 900],
        housePrice: 100
    },
    {
        id: 15,
        type: 'railroad',
        name: 'East Station',
        price: 200,
        rent: [25, 50, 100, 200],
        icon: '🚂'
    },
    {
        id: 16,
        type: 'property',
        name: 'Sunset Blvd',
        group: 'orange',
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        housePrice: 100
    },
    {
        id: 17,
        type: 'chance',
        subtype: 'fortune', // Community Chest style
        name: 'Fortune',
        icon: '🎴'
    },
    {
        id: 18,
        type: 'property',
        name: 'Dawn Street',
        group: 'orange',
        price: 180,
        rent: [14, 70, 200, 550, 750, 950],
        housePrice: 100
    },
    {
        id: 19,
        type: 'property',
        name: 'Horizon Road',
        group: 'orange',
        price: 200,
        rent: [16, 80, 220, 600, 800, 1000],
        housePrice: 100
    },
    {
        id: 20,
        type: 'parking',
        name: 'Free Parking',
        icon: '🅿️',
        description: 'Rest here for free'
    },

    // Top row (left to right, index 21-29)
    {
        id: 21,
        type: 'property',
        name: 'Ruby Lane',
        group: 'red',
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        housePrice: 150
    },
    {
        id: 22,
        type: 'chance',
        subtype: 'fate',
        name: 'Fate',
        icon: '🔮'
    },
    {
        id: 23,
        type: 'property',
        name: 'Scarlet Ave',
        group: 'red',
        price: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        housePrice: 150
    },
    {
        id: 24,
        type: 'property',
        name: 'Crimson Way',
        group: 'red',
        price: 240,
        rent: [20, 100, 300, 750, 925, 1100],
        housePrice: 150
    },
    {
        id: 25,
        type: 'railroad',
        name: 'South Station',
        price: 200,
        rent: [25, 50, 100, 200],
        icon: '🚂'
    },
    {
        id: 26,
        type: 'property',
        name: 'Gold Street',
        group: 'yellow',
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        housePrice: 150
    },
    {
        id: 27,
        type: 'property',
        name: 'Amber Road',
        group: 'yellow',
        price: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        housePrice: 150
    },
    {
        id: 28,
        type: 'utility',
        name: 'Water Works',
        price: 150,
        icon: '💧',
        rentMultiplier: [4, 10]
    },
    {
        id: 29,
        type: 'property',
        name: 'Honey Lane',
        group: 'yellow',
        price: 280,
        rent: [24, 120, 360, 850, 1025, 1200],
        housePrice: 150
    },
    {
        id: 30,
        type: 'gotojail',
        name: 'Go To Jail',
        icon: '👮',
        description: 'Go directly to jail'
    },

    // Right side (top to bottom, index 31-39)
    {
        id: 31,
        type: 'property',
        name: 'Emerald Ave',
        group: 'green',
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        housePrice: 200
    },
    {
        id: 32,
        type: 'property',
        name: 'Jade Street',
        group: 'green',
        price: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        housePrice: 200
    },
    {
        id: 33,
        type: 'chance',
        subtype: 'fortune',
        name: 'Fortune',
        icon: '🎴'
    },
    {
        id: 34,
        type: 'property',
        name: 'Forest Road',
        group: 'green',
        price: 320,
        rent: [28, 150, 450, 1000, 1200, 1400],
        housePrice: 200
    },
    {
        id: 35,
        type: 'railroad',
        name: 'West Station',
        price: 200,
        rent: [25, 50, 100, 200],
        icon: '🚂'
    },
    {
        id: 36,
        type: 'chance',
        subtype: 'fate',
        name: 'Fate',
        icon: '🔮'
    },
    {
        id: 37,
        type: 'property',
        name: 'Royal Blvd',
        group: 'blue',
        price: 350,
        rent: [35, 175, 500, 1100, 1300, 1500],
        housePrice: 200
    },
    {
        id: 38,
        type: 'tax',
        name: 'Luxury Tax',
        amount: 100,
        icon: '💎'
    },
    {
        id: 39,
        type: 'property',
        name: 'Imperial Way',
        group: 'blue',
        price: 400,
        rent: [50, 200, 600, 1400, 1700, 2000],
        housePrice: 200
    }
];

// Get tile by ID
function getTile(id) {
    return TILES[id];
}

// Get all properties in a color group
function getPropertiesInGroup(group) {
    return TILES.filter(tile => tile.type === 'property' && tile.group === group);
}

// Get all railroads
function getRailroads() {
    return TILES.filter(tile => tile.type === 'railroad');
}

// Get all utilities
function getUtilities() {
    return TILES.filter(tile => tile.type === 'utility');
}

// Check if tile is buyable
function isTileBuyable(tile) {
    return tile.type === 'property' || tile.type === 'railroad' || tile.type === 'utility';
}

// Get group color
function getGroupColor(group) {
    return PROPERTY_GROUPS[group]?.color || '#888';
}

