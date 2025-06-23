const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'cleartemp',
    description: 'Clear temporary files',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '✅ No temporary files found' 
                });
            }

            // Delete all files in temp directory except current session
            const files = await fs.readdir(tempDir);
            let deletedCount = 0;

            for (const file of files) {
                try {
                    if (!file.startsWith('creds')) {
                        await fs.unlink(path.join(tempDir, file));
                        deletedCount++;
                    }
                } catch (error) {
                    logger('COMMAND', `Error deleting ${file}: ${error.message}`, 'warn');
                }
            }

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Deleted ${deletedCount} temporary files` 
            });
            logger('COMMAND', `Deleted ${deletedCount} temporary files`, 'info');
        } catch (error) {
            logger('COMMAND', `Error clearing temp files: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to clear temporary files.' 
            });
        }
    }
};