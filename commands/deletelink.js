const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'deletelink',
    description: 'Enable/disable automatic link deletion in groups',
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
                    text: '❌ Usage: .deletelink on/off' 
                });
            }

            // Update group-specific delete link settings
            if (!config.deleteLink) config.deleteLink = {};
            if (!config.deleteLink.groups) config.deleteLink.groups = {};
            
            config.deleteLink.groups[chatId] = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(chatId, { 
                text: `✅ Automatic link deletion is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for this group` 
            });
            logger('COMMAND', `Delete link ${action} for ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in deletelink command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update link deletion settings.' 
            });
        }
    }
};