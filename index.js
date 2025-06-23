// Import all required modules
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./functions/logger');
const commandHandler = require('./functions/commandHandler');
const config = require('./config.json');
const moment = require('moment');

// Global variables
let sock;
let startTime = new Date();
global.commandCount = 0; // For stats tracking

// Initialize
async function startBot() {
    try {
        logger('SYSTEM', 'Booting bot...', 'info');
        
        // Auth setup
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'));
        
        // Socket setup
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: logger('BAILEYS', '', 'debug'),
            getMessage: async (key) => config.antiDelete ? { conversation: '[DELETED]' } : null
        });

        // Event handlers
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', handleConnection);
        sock.ev.on('messages.upsert', handleMessages);
        sock.ev.on('group-participants.update', handleGroupUpdates);
        sock.ev.on('messages.delete', handleDeletedMessages);

        // Load commands
        await commandHandler.loadCommands();
        
    } catch (error) {
        logger('SYSTEM', `Boot failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Connection handler
function handleConnection(update) {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger('SYSTEM', `Disconnected (${shouldReconnect ? 'Reconnecting...' : 'Logged out'})`, 'warn');
        if (shouldReconnect) startBot();
    } 
    else if (connection === 'open') {
        onConnected();
    }
}

// Message handler
async function handleMessages({ messages }) {
    for (const message of messages) {
        try {
            global.commandCount++;
            await commandHandler.handleCommand(sock, message, startTime, config);
            await handleAntiFeatures(sock, message, config);
        } catch (error) {
            logger('MESSAGE', `Handler error: ${error.message}`, 'error');
        }
    }
}

// Group updates handler
async function handleGroupUpdates({ id, participants, action }) {
    const welcomeMsg = config.welcome?.groups?.[id] && action === 'add' 
        ? config.welcome.message.replace('@user', `@${participants[0].split('@')[0]}`) 
        : null;
    
    const goodbyeMsg = config.goodbye?.groups?.[id] && action === 'remove' 
        ? config.goodbye.message.replace('@user', `@${participants[0].split('@')[0]}`) 
        : null;

    if (welcomeMsg || goodbyeMsg) {
        await sock.sendMessage(id, { 
            text: welcomeMsg || goodbyeMsg,
            mentions: participants
        });
    }
}

// Deleted messages handler
async function handleDeletedMessages(items) {
    if (!config.antiDelete) return;
    const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
    
    for (const { keys } of items) {
        for (const key of keys) {
            const msg = await sock.loadMessage(key.remoteJid, key.id);
            if (msg && !msg.key.fromMe) {
                await sock.sendMessage(ownerJid, {
                    text: `🗑 *Deleted Message*\n\n` +
                          `• Chat: ${key.remoteJid}\n` +
                          `• Sender: @${(key.participant || key.remoteJid).split('@')[0]}\n` +
                          `• Content: ${msg.message?.conversation || '[Media]'}`,
                    mentions: [key.participant || key.remoteJid]
                });
            }
        }
    }
}

// Anti-features handler
async function handleAntiFeatures(sock, message, config) {
    const chatId = message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    
    // Anti-link
    if (chatId.endsWith('@g.us') && /https?:\/\/\S+/i.test(text)) {
        const isAdmin = await checkAdmin(sock, chatId, message.key.participant);
        if (!isAdmin) {
            if (config.antilink?.groups?.[chatId]) {
                await sock.sendMessage(chatId, { delete: message.key });
                await sock.sendMessage(chatId, {
                    text: `⚠️ @${message.key.participant.split('@')[0]} - Links not allowed!`,
                    mentions: [message.key.participant]
                });
            }
            if (config.antilinkkick?.groups?.[chatId]) {
                await sock.groupParticipantsUpdate(chatId, [message.key.participant], 'remove');
            }
        }
    }
    
    // Anti-bad words
    if (config.antiBad && config.antiBadWords?.some(word => text.toLowerCase().includes(word))) {
        await sock.sendMessage(chatId, { delete: message.key });
        if (chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: `🚫 @${message.key.participant.split('@')[0]} - Mind your language!`,
                mentions: [message.key.participant]
            });
        }
    }
}

async function checkAdmin(sock, chatId, participant) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        return metadata.participants.find(p => p.id === participant)?.admin === 'admin';
    } catch {
        return false;
    }
}

// On connected handler
async function onConnected() {
    startTime = new Date();
    logger('SYSTEM', 'Bot connected!', 'success');
    
    // Set profile
    try {
        await sock.updateProfileName(config.botName);
        if (config.botImagePath) {
            await sock.updateProfilePicture(config.botNumber, fs.readFileSync(config.botImagePath));
        }
    } catch (error) {
        logger('PROFILE', `Update failed: ${error.message}`, 'error');
    }

    // Notify owner
    const ownerJid = `${config.ownerNumber}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, {
        text: `✅ *Bot Online*\n\n` +
              `🖥️ Host: ${os.hostname()}\n` +
              `⏱ Started: ${startTime.toLocaleString()}\n` +
              `💡 Use ${config.prefix}help for commands`
    });
}

// Start the bot
startBot();

// Crash handling
process.on('uncaughtException', (err) => {
    logger('CRASH', `Uncaught exception: ${err.message}`, 'error');
    startBot(); // Auto-restart
});

process.on('unhandledRejection', (err) => {
    logger('CRASH', `Unhandled rejection: ${err.message}`, 'error');
});