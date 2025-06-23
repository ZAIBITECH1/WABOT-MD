const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'ownername',
    description: 'Change the owner name',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            const newName = args.join(' ');
            if (!newName || newName.length < 2) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please provide a valid name (at least 2 characters)' 
                });
            }

            // Update owner name
            config.ownerName = newName;
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Owner name changed to *${newName}*` 
            });
            logger('COMMAND', `Owner name changed to ${newName}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error changing owner name: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to change owner name.' 
            });
        }
    }
};