const path = require('path');
const fs = require('fs-extra');
const { logger } = require('./logger');
const config = require('../config.json');

// Store all loaded commands
const commands = new Map();

async function loadCommands() {
    try {
        const commandsDir = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
        
        // Clear existing commands
        commands.clear();
        
        // Load each command file
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsDir, file));
                commands.set(command.name, command);
                logger('COMMAND', `Loaded command: ${command.name}`, 'success');
            } catch (error) {
                logger('COMMAND', `Error loading command ${file}: ${error.message}`, 'error');
            }
        }
        
        logger('COMMAND', `Successfully loaded ${commands.size} commands`, 'info');
    } catch (error) {
        logger('COMMAND', `Error loading commands: ${error.message}`, 'error');
    }
}

async function handleCommand(sock, message, startTime) {
    try {
        if (!message.message) return;
        
        const text = message.message.conversation || 
                    message.message.extendedTextMessage?.text || '';
        
        // Check if message starts with prefix
        if (!text.startsWith(config.prefix)) return;
        
        const args = text.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Find the command
        const command = Array.from(commands.values()).find(
            cmd => cmd.name === commandName || 
                  (cmd.aliases && cmd.aliases.includes(commandName))
        );
        
        if (!command) return;
        
        // Check if command is owner-only in private mode
        const sender = message.key.participant || message.key.remoteJid;
        const isOwner = sender.includes(config.ownerNumber);
        
        if (config.mode === 'private' && !isOwner) {
            return sock.sendMessage(message.key.remoteJid, { 
                text: '❌ This bot is in private mode. Only the owner can use commands.' 
            });
        }
        
        // Execute the command
        logger('COMMAND', `${sender} executed: ${commandName}`, 'info');
        await command.execute(sock, message, args, startTime, config);
        
    } catch (error) {
        logger('COMMAND', `Error executing command: ${error.message}`, 'error');
        await sock.sendMessage(message.key.remoteJid, { 
            text: '❌ An error occurred while executing the command.' 
        });
    }
}

module.exports = {
    loadCommands,
    handleCommand,
    commands
};