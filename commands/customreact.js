const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'customreact',
    description: 'Set custom reactions for messages',
    async execute(sock, message, args, startTime, config) {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            if (!sender.includes(config.ownerNumber)) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ This command can only be used by the owner.' 
                });
            }

            // Check if we're in setup mode
            if (args[0]?.toLowerCase() === 'setup') {
                await sock.sendMessage(message.key.remoteJid, { 
                    text: '✨ *Custom Reaction Setup*\n\nPlease send the emojis you want to use as reactions, separated by spaces.\nExample: 👍 😍 🎉\n\nType *cancel* to abort.'
                });

                // Store the chat ID to listen for the next message
                config.customReactSetup = {
                    active: true,
                    chatId: message.key.remoteJid
                };
                await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });
                return;
            }

            // Handle cancelation
            if (args[0]?.toLowerCase() === 'cancel' && config.customReactSetup?.active) {
                config.customReactSetup.active = false;
                await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });
                return sock.sendMessage(message.key.remoteJid, { 
                    text: '❌ Custom reaction setup canceled.' 
                });
            }

            // If we're in setup mode and this is the emoji input
            if (config.customReactSetup?.active && config.customReactSetup.chatId === message.key.remoteJid) {
                const emojis = message.message.conversation?.trim().split(/\s+/) || [];
                
                // Validate emojis
                const validEmojis = emojis.filter(emoji => {
                    // Simple emoji validation (could be improved)
                    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
                    return emojiRegex.test(emoji);
                });

                if (validEmojis.length === 0) {
                    return sock.sendMessage(message.key.remoteJid, { 
                        text: '❌ No valid emojis provided. Please try again or type *cancel* to abort.' 
                    });
                }

                // Save custom reactions
                config.customReactions = validEmojis;
                config.customReactSetup.active = false;
                await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

                await sock.sendMessage(message.key.remoteJid, { 
                    text: `✅ Custom reactions set: ${validEmojis.join(' ')}\n\nAuto-reaction will now use these emojis randomly.` 
                });
                logger('COMMAND', `Custom reactions set: ${validEmojis.join(', ')}`, 'info');

                // Enable auto-reaction if not already enabled
                if (!config.autoReaction?.enabled) {
                    config.autoReaction = { enabled: true, target: 'all' };
                    await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });
                    await sock.sendMessage(message.key.remoteJid, { 
                        text: 'ℹ️ Auto-reaction has been enabled automatically with target *all*.' 
                    });
                }

                return;
            }

            // Show current custom reactions
            if (config.customReactions?.length > 0) {
                return sock.sendMessage(message.key.remoteJid, { 
                    text: `Current custom reactions: ${config.customReactions.join(' ')}\n\nTo change them, use *.customreact setup*` 
                });
            }

            // No custom reactions set
            await sock.sendMessage(message.key.remoteJid, { 
                text: 'No custom reactions set. Use *.customreact setup* to configure them.' 
            });

        } catch (error) {
            logger('COMMAND', `Error in customreact: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to set custom reactions.' 
            });
        }
    }
};