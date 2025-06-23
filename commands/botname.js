const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'botname',
    description: 'Change the bot name',
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

            // Update bot name
            config.botName = newName;
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            // Update profile name
            await sock.updateProfileName(newName);

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Bot name changed to *${newName}*` 
            });
            logger('COMMAND', `Bot name changed to ${newName}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error changing bot name: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to change bot name.' 
            });
        }
    }
};