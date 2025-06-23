const { logger } = require('../functions/logger');

module.exports = {
    name: 'vv',
    description: 'Recover expired view-once messages',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            if (!message.message.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessage) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please reply to a view-once message to recover it' 
                });
            }

            const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessage;
            const mediaType = Object.keys(quoted.message)[0];
            const mediaMessage = quoted.message[mediaType];

            // Download and send the media
            const stream = await sock.downloadMediaMessage(quoted);
            const caption = mediaMessage.caption || 'Recovered view-once media';

            await sock.sendMessage(message.key.remoteJid, {
                [mediaType]: stream,
                caption: caption,
                mimetype: mediaMessage.mimetype
            });

            logger('COMMAND', 'Recovered view-once message', 'info');
        } catch (error) {
            logger('COMMAND', `Error recovering view-once: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to recover view-once message.' 
            });
        }
    }
};