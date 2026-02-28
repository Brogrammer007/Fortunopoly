# 🎲 FORTUNOPOLY

A complete, browser-based property trading board game for 2-6 players.

> **Note**: This is NOT Monopoly®. It's an original game with Monopoly-like mechanics, created with original property names, artwork, and design.

## 🎮 How to Play

### Quick Start

1. Open `index.html` in any modern web browser
2. Select number of players (2-6)
3. Enter player names
4. Click "Start Game"
5. Pass the device between players for local multiplayer!

### Game Rules

**Objective**: Be the last player standing, or have the most wealth when other players go bankrupt.

**Turn Flow**:
1. Roll the dice
2. Move your token around the board
3. Take action based on where you land:
   - **Property**: Buy it or pay rent
   - **Fortune Card**: Draw and follow instructions
   - **Tax**: Pay the tax amount
   - **Go To Jail**: Go directly to jail
   - **Free Parking**: Rest (no action)
4. End your turn and pass to the next player

**Properties**:
- Buy unowned properties you land on
- Collect rent when opponents land on your properties
- Own all properties in a color group for double rent!

**Jail**:
- You can be sent to jail by landing on "Go To Jail" or drawing a card
- To escape: Roll doubles, pay $50, or use a Get Out of Jail Free card
- After 3 turns, you must pay $50 to leave

**Bankruptcy**:
- If you can't pay rent or taxes, you go bankrupt
- Your properties return to the bank (or creditor)
- Last player standing wins!

## 🎨 Assets & Credits

This game uses **CSS-based graphics** for all visual elements:

- **Dice**: Pure CSS with dot patterns
- **Player Tokens**: CSS circles with gradient backgrounds
- **Board**: DOM-based with CSS Grid layout
- **Icons**: Unicode emoji (freely usable)
- **Typography**: [Fredoka](https://fonts.google.com/specimen/Fredoka) & [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Google Fonts, OFL License)

**No external image assets are required** - everything is rendered with CSS and HTML!

### Design Inspiration

The visual design draws inspiration from:
- Classic board game aesthetics
- Modern dark UI themes
- Gold/copper accent colors for luxury feel

## 📁 Project Structure

```
Fortunopoly/
├── index.html          # Main HTML file
├── style.css           # All styling
├── main.js             # Main game controller
├── game/
│   ├── tiles.js        # Board tile definitions
│   ├── cards.js        # Fortune card definitions
│   ├── player.js       # Player class
│   ├── board.js        # Board rendering
│   └── gameState.js    # Game state management
└── README.md           # This file
```

## 🛠️ Technical Details

- **Pure Vanilla JavaScript** - No frameworks or libraries
- **CSS Grid** - For board layout
- **CSS Custom Properties** - For theming
- **Async/Await** - For smooth animations
- **ES6 Classes** - For player management

### Browser Compatibility

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 🎯 Features

- ✅ 2-6 player local multiplayer
- ✅ 8 property color groups
- ✅ 4 railroad stations
- ✅ 2 utility properties
- ✅ 22 Fortune (chance) cards
- ✅ Animated dice rolls
- ✅ Token movement animation
- ✅ Jail mechanics
- ✅ Bankruptcy system
- ✅ "Pass device" prompts for local play
- ✅ Game log tracking
- ✅ Final standings display
- ✅ Responsive design

## 📜 License

This game is released as open source. The code is free to use, modify, and distribute.

**Legal Note**: This is NOT affiliated with Hasbro or the Monopoly® brand. All property names, artwork, and game mechanics are original creations.

---

Made with ❤️ for board game enthusiasts

