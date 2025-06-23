const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'goodbye',
    description: 'Enable/disable goodbye messages for leaving group members',
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
                    text: '❌ Usage: .goodbye on/off' 
                });
            }

            // Update group-specific goodbye settings
            if (!config.goodbye) config.goodbye = {};
            if (!config.goodbye.groups) config.goodbye.groups = {};
            
            config.goodbye.groups[chatId] = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(chatId, { 
                text: `✅ Goodbye messages are now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for this group` 
            });
            logger('COMMAND', `Goodbye messages ${action} for ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in goodbye command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update goodbye settings.' 
            });
        }
    }
};