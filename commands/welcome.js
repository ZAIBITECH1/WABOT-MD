const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'welcome',
    description: 'Enable/disable welcome messages for new group members',
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
                    text: '❌ Usage: .welcome on/off' 
                });
            }

            // Update group-specific welcome settings
            if (!config.welcome) config.welcome = {};
            if (!config.welcome.groups) config.welcome.groups = {};
            
            config.welcome.groups[chatId] = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(chatId, { 
                text: `✅ Welcome messages are now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for this group` 
            });
            logger('COMMAND', `Welcome messages ${action} for ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in welcome command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update welcome settings.' 
            });
        }
    }
};