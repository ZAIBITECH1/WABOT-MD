const { logger } = require('../functions/logger');

module.exports = {
    name: 'tagall',
    description: 'Tag all group members',
    async execute(sock, message, args, startTime, config) {
        try {
            const chatId = message.key.remoteJid;
            if (!chatId.endsWith('@g.us')) {
                return sock.sendMessage(chatId, { 
                    text: '❌ This command can only be used in groups.' 
                });
            }

            // Check if user has admin permissions
            const metadata = await sock.groupMetadata(chatId);
            const participant = message.key.participant || message.key.remoteJid;
            const isAdmin = metadata.participants.find(p => p.id === participant)?.admin === 'admin';

            if (config.mode === 'private' && !participant.includes(config.ownerNumber)) {
                return sock.sendMessage(chatId, { 
                    text: '❌ This bot is in private mode. Only the owner can use commands.' 
                });
            }

            if (!isAdmin && !participant.includes(config.ownerNumber)) {
                return sock.sendMessage(chatId, { 
                    text: '❌ You need to be an admin to use this command.' 
                });
            }

            // Get all participants
            const participants = metadata.participants;
            const mentions = participants.map(p => p.id).filter(id => !id.includes(sock.user.id));

            if (mentions.length === 0) {
                return sock.sendMessage(chatId, { 
                    text: '❌ No members found to tag.' 
                });
            }

            // Create the message with mentions
            const mentionText = mentions.map(id => `@${id.split('@')[0]}`).join(' ');
            const messageText = args.length > 0 ? 
                `${args.join(' ')}\n\n${mentionText}` : 
                `🌟 *Attention Everyone!* 🌟\n\n${mentionText}`;

            await sock.sendMessage(chatId, { 
                text: messageText,
                mentions: mentions
            });

            logger('COMMAND', `Tagged ${mentions.length} members in ${chatId}`, 'info');
        } catch (error) {
            logger('COMMAND', `Error in tagall: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to tag group members.' 
            });
        }
    }
};