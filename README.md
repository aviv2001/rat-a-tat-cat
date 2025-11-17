# Rat-a-Tat-Cat Online

A multiplayer online implementation of the classic memory card game Rat-a-Tat-Cat with special action cards. Challenge your friends to remember card positions and achieve the lowest score!

## About the Game

Rat-a-Tat-Cat is a memory and strategy card game where players try to get the lowest score by remembering and swapping cards. This online version supports 2-6 players and includes special action cards (Peek, Swap, Draw, and Add) that add exciting twists to the classic gameplay.

## Technologies Used

This application is built with:

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web server framework
- **Socket.IO** - Real-time bidirectional communication for multiplayer functionality
- **HTML/CSS/JavaScript** - Frontend interface

## Prerequisites

Before running the application, you need to install:

### Node.js and npm

**Windows:**
1. Download the installer from [nodejs.org](https://nodejs.org/)
2. Run the installer (the LTS version is recommended)
3. Verify installation by opening Command Prompt and running:
   ```bash
   node --version
   npm --version
   ```

**macOS:**
1. Download from [nodejs.org](https://nodejs.org/) or use Homebrew:
   ```bash
   brew install node
   ```
2. Verify installation:
   ```bash
   node --version
   npm --version
   ```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### ngrok (Optional - for sharing with friends)

To make your local game accessible to friends over the internet:

1. Create a free account at [ngrok.com](https://ngrok.com/)
2. Download ngrok for your operating system
3. Follow the setup instructions on the ngrok website to add your authtoken

## Installation

1. **Clone or download this repository:**
   ```bash
   git clone <repository-url>
   cd rat-a-tat-cat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Running Locally

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The game will be accessible on your local machine

3. **Play with others on the same network:**
   - Find your local IP address:
     - **Windows:** Run `ipconfig` in Command Prompt
     - **macOS/Linux:** Run `ifconfig` or `ip addr` in Terminal
   - Other players on the same network can connect using `http://YOUR_IP_ADDRESS:3000`

### Running with ngrok (Share with Anyone)

To allow friends from anywhere to join your game:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **In a new terminal window, start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Share the URL:**
   - ngrok will display a public URL (e.g., `https://abc123.ngrok.io`)
   - Share this URL with your friends
   - They can access your game from anywhere in the world

4. **Note:** Keep both the server and ngrok running while playing

## How to Play

1. **Create a Game:**
   - One player creates a new game room
   - Share the game code with other players

2. **Join a Game:**
   - Other players enter the game code to join

3. **Gameplay:**
   - Each player has 4 face-down cards
   - Goal: Get the lowest score possible
   - Use action cards strategically to peek at cards, swap them, or draw new ones
   - Call "Rat-a-Tat-Cat" when you think you have the lowest score
   - All players get one final turn, then cards are revealed

## Game Controls

- Click on cards to select them
- Follow on-screen prompts for different actions
- Use special action cards: PEEK, SWAP, DRAW, and ADD

## Troubleshooting

**Port already in use:**
- If port 3000 is already taken, you can change it by modifying `server.js`

**Cannot connect to game:**
- Make sure the server is running
- Check that your firewall isn't blocking the connection
- Verify you're using the correct URL or game code

**ngrok session expired:**
- Free ngrok sessions expire after 2 hours
- Simply restart ngrok to get a new URL

## Development

Project structure:
```
rat-a-tat-cat/
├── public/
│   ├── assets/        # Card images
│   └── index.html     # Game interface
├── src/
│   └── GameLogic.js   # Core game logic
├── server.js          # Express + Socket.IO server
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## License

MIT License

## Credits

Based on the classic Rat-a-Tat-Cat card game with custom online multiplayer implementation.

---

**Enjoy the game and may the lowest score win!**
