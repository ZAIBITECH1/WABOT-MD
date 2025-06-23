const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'clearsession',
    description: 'Delete extra session files',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }
            
            const sessionDir = path.join(__dirname, '../../sessions');
            const files = await fs.readdir(sessionDir);
            
            // Filter out current session files
            const filesToDelete = files.filter(file => 
                !file.startsWith('creds') && file.endsWith('.json')
            );
            
            if (filesToDelete.length === 0) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '✅ No extra session files found.' 
                });
            }
            
            // Delete files
            for (const file of filesToDelete) {
                await fs.unlink(path.join(sessionDir, file));
            }
            
            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Deleted ${filesToDelete.length} session files.` 
            });
            logger('COMMAND', 'Cleared session files', 'info');
        } catch (error) {
            logger('COMMAND', `Error clearing session: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to clear session files.' 
            });
        }
    }
};