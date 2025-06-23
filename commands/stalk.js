module.exports = {
    name: 'stalk',
    description: 'Check user last seen',
    async execute(sock, message, args) {
        const jid = message.mentionedJid?.[0] || args[0]?.replace('@', '') + '@s.whatsapp.net' || message.key.participant;
        const user = await sock.onWhatsApp(jid);
        if (!user[0]?.exists) return sock.sendMessage(message.key.remoteJid, { text: '❌ User not found.' });
        
        const status = await sock.fetchStatus(jid);
        await sock.sendMessage(message.key.remoteJid, {
            text: `👀 *User Info*\n\n` +
                  `📞 *Number:* @${jid.split('@')[0]}\n` +
                  `⏱ *Last Seen:* ${status.status || 'Hidden'}\n` +
                  `📅 *Updated:* ${status.setAt ? new Date(status.setAt).toLocaleString() : 'Unknown'}`,
            mentions: [jid]
        });
    }
};