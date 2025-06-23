const axios = require('axios');

module.exports = {
    name: 'translate',
    description: 'Translate text to another language',
    async execute(sock, message, args) {
        if (!args[0] || !args[1]) {
            return sock.sendMessage(message.key.remoteJid, {
                text: '❌ Usage: .translate <lang-code> <text>\nExample: .translate es Hello'
            });
        }

        const [lang, ...textParts] = args;
        const text = textParts.join(' ');
        const response = await axios.get(`https://api.popcat.xyz/translate?to=${lang}&text=${encodeURIComponent(text)}`);
        
        await sock.sendMessage(message.key.remoteJid, {
            text: `🌐 *Translation*\n\n` +
                  `📜 *Original:* ${text}\n` +
                  `🔄 *Translated (${lang.toUpperCase()}):* ${response.data.translated}`
        });
    }
};