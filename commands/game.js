module.exports = {
    name: 'game',
    description: 'Play a mini game',
    async execute(sock, message, args) {
        const games = ['🎯', '🎲', '🏀', '⚽', '🎳'];
        const chosenGame = games[Math.floor(Math.random() * games.length)];
        const result = Math.random() > 0.5 ? 'You won!' : 'You lost!';
        
        await sock.sendMessage(message.key.remoteJid, {
            text: `${chosenGame} *Game Result*\n\n` +
                  `You played: ${chosenGame}\n` +
                  `Result: ${result}\n\n` +
                  'Try again with `.game`!'
        });
    }
};