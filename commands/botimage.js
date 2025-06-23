const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'botimage',
    description: 'Change the bot profile picture',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            if (!message.message.imageMessage) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please reply to an image to set as bot profile picture' 
                });
            }

            // Download the image
            const stream = await sock.downloadMediaMessage(message);
            const imagePath = path.join(__dirname, '../../bot-image.jpg');
            await fs.writeFile(imagePath, stream);

            // Update profile picture
            await sock.updateProfilePicture(config.botNumber, fs.readFileSync(imagePath));

            // Update config
            config.botImagePath = imagePath;
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: '✅ Bot profile picture updated successfully!' 
            });
            logger('COMMAND', 'Bot profile picture updated', 'info');
        } catch (error) {
            logger('COMMAND', `Error changing bot image: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update bot profile picture.' 
            });
        }
    }
};