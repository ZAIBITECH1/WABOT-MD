module.exports = {
    name: 'block',
    description: 'Block a user (owner only)',
    async execute(sock, message, args, _, config) {
        const sender = message.key.participant || message.key.remoteJid;
        if (!sender.includes(config.ownerNumber)) {
            return sock.sendMessage(message.key.remoteJid, { text: '❌ Owner only command.' });
        }

        const jid = args[0]?.replace('@', '') + '@s.whatsapp.net';
        await sock.updateBlockStatus(jid, 'block');
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ Blocked @${jid.split('@')[0]}`,
            mentions: [jid]
        });
    }
};