const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'antilink',
    description: 'Enable/disable anti-link protection in groups',
    async execute(sock, message, args, startTime, config) {
        try {
            const chatId = message.key.remoteJid;
            if (!chatId.endsWith('@g.us')) {
                return sock.sendMessage(chatId, { 
                    text: '❌ This command can only be used in groups.' 
                });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(chatId, { 
                    text: '❌ Usage: .antilink on/off' 
                });
            }

            // Update group-specific anti-link settings
            if (!config.antiLink) config.antiLink = {};
            if (!config.antiLink.groups) config.antiLink.groups = {};
            
            config.antiLink.groups[chatId] = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(chatId, { 
                text: `✅ Anti-link protection is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for this group` 
            });
            logger('COMMAND', `Anti-link ${action} for ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in antilink command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update anti-link settings.' 
            });
        }
    }
};