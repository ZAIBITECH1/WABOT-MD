const moment = require('moment');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'ping',
    description: 'Check bot connectivity and uptime',
    aliases: ['pong'],
    async execute(sock, message, args, startTime, config) {
        try {
            const uptime = moment(startTime).fromNow();
            const now = new Date();
            const latency = now - message.messageTimestamp * 1000;
            
            const pingMessage = `
🏓 *PONG!*
            
⏱ *Uptime:* ${uptime}
📶 *Latency:* ${latency}ms
🌍 *Server Region:* ${process.env.REGION || 'Unknown'}
🕒 *Current Time:* ${now.toLocaleString()}
            `;
            
            await sock.sendMessage(message.key.remoteJid, { text: pingMessage });
            logger('COMMAND', 'Ping command executed', 'info');
        } catch (error) {
            logger('COMMAND', `Error in ping command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to execute ping command.' 
            });
        }
    }
};