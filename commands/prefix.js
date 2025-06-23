const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'prefix',
    description: 'Set a new command prefix',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            const newPrefix = args[0];
            if (!newPrefix || newPrefix.length > 1) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please provide a single character prefix (e.g., .prefix !)' 
                });
            }

            // Update config
            config.prefix = newPrefix;
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Command prefix changed to *${newPrefix}*` 
            });
            logger('COMMAND', `Prefix changed to ${newPrefix}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error changing prefix: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to change command prefix.' 
            });
        }
    }
};