
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * iPOS Audit & System Logger
 * Writes persistent logs to the local filesystem for hardware and financial audit trails.
 */
class Logger {
    constructor() {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        this.logPath = path.join(logsDir, 'ipos-audit.log');
    }

    info(msg) { this._write('INFO', msg); }
    warn(msg) { this._write('WARN', msg); }
    error(msg) { this._write('ERROR', msg); }
    
    audit(type, msg) {
        this._write(`AUDIT:${type}`, msg);
    }

    _write(level, msg) {
        const entry = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
        try {
            fs.appendFileSync(this.logPath, entry);
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }
}

module.exports = Logger;
