const { logger } = require('../functions/logger');

module.exports = {
    name: 'help',
    aliases: ['menu', 'commands'],
    description: 'Show all available commands',
    async execute(sock, message, args, startTime, config) {
        try {
            const commands = Array.from(require('../functions/commandHandler').commands.values());
            
            // Categorize commands
            const ownerCmds = commands.filter(c => c.name === 'clearsession' || c.name === 'botname' || c.name.startsWith('anti') || c.name === 'vv');
            const groupCmds = commands.filter(c => c.name === 'welcome' || c.name === 'tagall' || c.name.startsWith('antilink'));
            const generalCmds = commands.filter(c => !ownerCmds.includes(c) && !groupCmds.includes(c));

            let helpText = `🎯 *${config.botName} Command Menu*\n\n` +
                          `⏱ *Uptime:* ${moment(startTime).fromNow()}\n` +
                          `🔧 *Prefix:* ${config.prefix}\n` +
                          `👑 *Owner:* ${config.ownerName}\n\n` +
                          '📌 *General Commands*\n' +
                          generalCmds.map(c => `• *${config.prefix}${c.name}*: ${c.description}`).join('\n') + '\n\n';

            if (message.key.remoteJid.endsWith('@g.us')) {
                helpText += '👥 *Group Commands*\n' +
                            groupCmds.map(c => `• *${config.prefix}${c.name}*: ${c.description}`).join('\n') + '\n\n';
            }

            if ((message.key.participant || message.key.remoteJid).includes(config.ownerNumber)) {
                helpText += '⚙️ *Owner Commands*\n' +
                            ownerCmds.map(c => `• *${config.prefix}${c.name}*: ${c.description}`).join('\n');
            }

            await sock.sendMessage(message.key.remoteJid, { 
                text: helpText,
                footer: 'Bot by WhiskeySockets',
                templateButtons: [
                    { urlButton: { displayText: '🌟 Star on GitHub', url: 'https://github.com/whiskeysockets/baileys' }},
                    { quickReplyButton: { displayText: 'Ping', id: `${config.prefix}ping` }}
                ]
            });
        } catch (error) {
            logger('HELP', error.message, 'error');
            await sock.sendMessage(message.key.remoteJid, { text: '❌ Failed to load help menu.' });
        }
    }
};