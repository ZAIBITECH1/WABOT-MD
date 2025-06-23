const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'mode',
    description: 'Set bot mode (public/private)',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }
            
            const mode = args[0]?.toLowerCase();
            if (!mode || !['public', 'private'].includes(mode)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please specify mode: .mode public or .mode private' 
                });
            }
            
            // Update config
            config.mode = mode;
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });
            
            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Bot mode set to *${mode}*` 
            });
            logger('COMMAND', `Bot mode changed to ${mode}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error changing mode: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to change bot mode.' 
            });
        }
    }
};