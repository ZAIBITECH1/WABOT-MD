const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'antilinkkick',
    description: 'Enable/disable anti-link with kick protection in groups',
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
                    text: '❌ Usage: .antilinkkick on/off' 
                });
            }

            // Update group-specific anti-link kick settings
            if (!config.antiLinkKick) config.antiLinkKick = {};
            if (!config.antiLinkKick.groups) config.antiLinkKick.groups = {};
            
            config.antiLinkKick.groups[chatId] = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(chatId, { 
                text: `✅ Anti-link with kick is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for this group` 
            });
            logger('COMMAND', `Anti-link kick ${action} for ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in antilinkkick command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update anti-link kick settings.' 
            });
        }
    }
};