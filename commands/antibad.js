const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'antibad',
    description: 'Enable/disable anti-bad content protection',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            const action = args[0]?.toLowerCase();
            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Usage: .antibad on/off' 
                });
            }

            // Update anti-bad settings
            config.antiBad = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Anti-bad content protection is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}*` 
            });
            logger('COMMAND', `Anti-bad content ${action}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in antibad command: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update anti-bad settings.' 
            });
        }
    }
};