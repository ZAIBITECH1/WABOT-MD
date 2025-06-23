const os = require('os');
const process = require('process');

module.exports = {
    name: 'stats',
    description: 'Show bot system stats',
    async execute(sock, message, startTime) {
        const uptime = process.uptime();
        const stats = `🖥️ *Bot Statistics*\n\n` +
                     `⏱ *Uptime:* ${formatDuration(uptime)}\n` +
                     `💾 *Memory:* ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB\n` +
                     `📡 *CPU:* ${os.cpus()[0].model}\n` +
                     `👥 *Groups:* ${(await sock.groupFetchAllParticipating()).size}\n` +
                     `🔄 *Commands Executed:* ${global.commandCount || 0}`;

        await sock.sendMessage(message.key.remoteJid, { text: stats });
    }
};

function formatDuration(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    seconds %= 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    return `${days}d ${hours}h ${minutes}m`;
}