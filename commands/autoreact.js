const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'autoreact',
    description: 'Enable/disable automatic reactions to messages',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            const action = args[0]?.toLowerCase();
            const target = args[1]?.toLowerCase();

            if (!action || !['on', 'off'].includes(action)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Usage: .autoreact on/off [all|ib|groups|channels]' 
                });
            }

            if (action === 'on' && !target) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Please specify target: all, ib (individual chats), groups, or channels' 
                });
            }

            // Update config
            config.autoReaction = {
                enabled: action === 'on',
                target: action === 'on' ? target : 'all'
            };
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Auto reaction is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}* for *${target || 'N/A'}*` 
            });
            logger('COMMAND', `Auto reaction set to ${action} for ${target}`, 'info');

            // Listen for messages if enabled
            if (action === 'on') {
                sock.ev.on('messages.upsert', async ({ messages }) => {
                    for (const msg of messages) {
                        try {
                            const chatId = msg.key.remoteJid;
                            const isGroup = chatId.endsWith('@g.us');
                            const isBroadcast = chatId.endsWith('@broadcast');
                            const isIndividual = !isGroup && !isBroadcast;

                            // Check if we should react based on target
                            const shouldReact = 
                                (target === 'all') ||
                                (target === 'ib' && isIndividual) ||
                                (target === 'groups' && isGroup) ||
                                (target === 'channels' && isBroadcast);

                            if (shouldReact && !msg.key.fromMe) {
                                const reactionMessage = {
                                    react: {
                                        text: '👍', // Default reaction
                                        key: msg.key
                                    }
                                };
                                await sock.sendMessage(chatId, reactionMessage);
                                logger('AUTOREACT', `Reacted to message in ${chatId}`, 'info');
                            }
                        } catch (error) {
                            logger('AUTOREACT', `Error reacting to message: ${error.message}`, 'error');
                        }
                    }
                });
            } else {
                sock.ev.off('messages.upsert');
            }
        } catch (error) {
            logger('COMMAND', `Error in autoreact: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update auto reaction setting.' 
            });
        }
    }
};