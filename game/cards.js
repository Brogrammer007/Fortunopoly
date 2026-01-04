/**
 * CARDS.JS - Fortune (Chance) and Fate (Community Chest) cards
 */

// FATE CARDS (Community Chest style - Financial/Life Events)
const FATE_CARDS = [
    {
        id: 1,
        text: "Bank error in your favor! Collect $200.",
        icon: "🏦",
        effect: { type: 'money', amount: 200 }
    },
    {
        id: 2,
        text: "You won a crossword competition! Collect $100.",
        icon: "📰",
        effect: { type: 'money', amount: 100 }
    },
    {
        id: 3,
        text: "Tax refund! Collect $50.",
        icon: "💵",
        effect: { type: 'money', amount: 50 }
    },
    {
        id: 4,
        text: "Birthday gift from a rich uncle! Collect $150.",
        icon: "🎂",
        effect: { type: 'money', amount: 150 }
    },
    {
        id: 5,
        text: "You sold your vintage collection! Collect $75.",
        icon: "🏺",
        effect: { type: 'money', amount: 75 }
    },
    {
        id: 6,
        text: "Dividend payout! Collect $50.",
        icon: "📈",
        effect: { type: 'money', amount: 50 }
    },
    {
        id: 7,
        text: "Doctor's bill. Pay $50.",
        icon: "🏥",
        effect: { type: 'money', amount: -50 }
    },
    {
        id: 9,
        text: "Home repairs needed. Pay $100.",
        icon: "🔧",
        effect: { type: 'money', amount: -100 }
    },
    {
        id: 10,
        text: "School fees due. Pay $75.",
        icon: "🎓",
        effect: { type: 'money', amount: -75 }
    },
    {
        id: 19,
        text: "Get Out of Jail Free card! Keep this until needed.",
        icon: "🗝️",
        effect: { type: 'jailFree' }
    },
    {
        id: 20,
        text: "It's your lucky day! Collect $25 from each player.",
        icon: "🍀",
        effect: { type: 'collectFromAll', amount: 25 }
    },
    {
        id: 22,
        text: "Street repairs: Pay $25 per property you own.",
        icon: "🏗️",
        effect: { type: 'payPerProperty', amount: 25 }
    }
];

// FORTUNE CARDS (Chance style - Random/Movement/Heist)
const FORTUNE_CARDS = [
    {
        id: 8,
        text: "Speeding ticket. Pay $15.",
        icon: "🚗",
        effect: { type: 'money', amount: -15 }
    },
    {
        id: 11,
        text: "Parking fine. Pay $20.",
        icon: "🅿️",
        effect: { type: 'money', amount: -20 }
    },
    {
        id: 12,
        text: "Advance to START! Collect $200.",
        icon: "🚀",
        effect: { type: 'move', position: 0, collectStart: true }
    },
    {
        id: 13,
        text: "Take a trip to North Station.",
        icon: "🚂",
        effect: { type: 'move', position: 5, collectStart: true }
    },
    {
        id: 14,
        text: "Go to Free Parking for a break.",
        icon: "🅿️",
        effect: { type: 'move', position: 20, collectStart: true }
    },
    {
        id: 15,
        text: "Visit Ruby Lane.",
        icon: "💎",
        effect: { type: 'move', position: 21, collectStart: true }
    },
    {
        id: 16,
        text: "Move forward 3 spaces.",
        icon: "➡️",
        effect: { type: 'moveRelative', spaces: 3 }
    },
    {
        id: 17,
        text: "Move back 3 spaces.",
        icon: "⬅️",
        effect: { type: 'moveRelative', spaces: -3 }
    },
    {
        id: 18,
        text: "Go directly to Jail. Do not pass START.",
        icon: "👮",
        effect: { type: 'jail' }
    },
    {
        id: 21,
        text: "You're feeling generous. Pay each player $10.",
        icon: "🎁",
        effect: { type: 'payToAll', amount: 10 }
    },
    // HEIST / SPECIAL
    {
        id: 23,
        text: "🕵️ Corporate Espionage! Steal $100 from the richest player.",
        icon: "💼",
        effect: { type: 'stealFromRichest', amount: 100 }
    },
    {
        id: 24,
        text: "🔥 Arson! Remove 1 house from any opponent's property (free).",
        icon: "🔥",
        effect: { type: 'freeArson' }
    },
    {
        id: 25,
        text: "🎭 Con Artist! Steal $50 from each other player.",
        icon: "🎭",
        effect: { type: 'stealFromAll', amount: 50 }
    },
    {
        id: 26,
        text: "🏴‍☠️ Heist Opportunity! Steal $150 from a player of your choice.",
        icon: "🏴‍☠️",
        effect: { type: 'stealChoice', amount: 150 }
    },
    {
        id: 27,
        text: "📉 Market Crash! Everyone loses $75 (including you).",
        icon: "📉",
        effect: { type: 'everyoneLoses', amount: 75 }
    },
    {
        id: 28,
        text: "🎰 Lucky Gamble! Flip a coin: Heads = win $200, Tails = lose $100.",
        icon: "🎰",
        effect: { type: 'gamble', winAmount: 200, loseAmount: 100 }
    }
];

// Decks
let fortuneDeck = [];
let fateDeck = [];

// Initialize/shuffle decks
function shuffleDecks() {
    fortuneDeck = shuffleArray([...FORTUNE_CARDS]);
    fateDeck = shuffleArray([...FATE_CARDS]);
}

function shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Draw functions
function drawFortuneCard() {
    if (fortuneDeck.length === 0) fortuneDeck = shuffleArray([...FORTUNE_CARDS]);
    return fortuneDeck.pop();
}

function drawFateCard() {
    if (fateDeck.length === 0) fateDeck = shuffleArray([...FATE_CARDS]);
    return fateDeck.pop();
}

// Preserve global generic shuffle for backward compatibility if needed, but updated to shuffle both
function shuffleCards() {
    shuffleDecks();
}

// Initialize decks on load
shuffleDecks();
