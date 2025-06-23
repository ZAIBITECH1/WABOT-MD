const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../functions/logger');

module.exports = {
    name: 'autostatusview',
    description: 'Enable/disable automatic viewing of status updates',
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
                    text: '❌ Usage: .autostatusview on/off' 
                });
            }

            // Update config
            config.autoStatusView = action === 'on';
            await fs.writeJson(path.join(__dirname, '../../config.json'), config, { spaces: 2 });

            await sock.sendMessage(message.key.remoteJid, { 
                text: `✅ Auto status view is now *${action === 'on' ? 'ENABLED' : 'DISABLED'}*` 
            });
            logger('COMMAND', `Auto status view set to ${action}`, 'info');

            // Listen for status updates if enabled
            if (action === 'on') {
                sock.ev.on('status.update', async (update) => {
                    try {
                        const statusJid = update.jid;
                        await sock.readMessages([{ remoteJid: statusJid, id: update.messages[0].key.id }]);
                        logger('STATUS', `Viewed status from ${statusJid}`, 'info');
                    } catch (error) {
                        logger('STATUS', `Error viewing status: ${error.message}`, 'error');
                    }
                });
            } else {
                sock.ev.off('status.update');
            }
        } catch (error) {
            logger('COMMAND', `Error in autostatusview: ${error.message}`, 'error');
            await sock.sendMessage(message.key.remoteJid, { 
                text: '❌ Failed to update auto status view setting.' 
            });
        }
    }
};