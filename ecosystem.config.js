module.exports = {
    apps: [{
        name: 'whatsapp-bot',
        script: 'index.js',
        watch: true,
        ignore_watch: ['node_modules', 'sessions'],
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production'
        }
    }]
}
