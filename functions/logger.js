const chalk = require('chalk');
const moment = require('moment');

function logger(module, message, type = 'info') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    let logMessage = `[${timestamp}] [${module}] ${message}`;
    
    switch (type.toLowerCase()) {
        case 'error':
            console.error(chalk.red(logMessage));
            break;
        case 'warn':
            console.warn(chalk.yellow(logMessage));
            break;
        case 'success':
            console.log(chalk.green(logMessage));
            break;
        case 'debug':
            console.log(chalk.blue(logMessage));
            break;
        default:
            console.log(chalk.white(logMessage));
    }
}

module.exports = logger;