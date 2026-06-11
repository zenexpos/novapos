
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logPath = path.join(app.getPath('userData'), 'ipos-audit.log');
    }

    info(msg) { this._write('INFO', msg); }
    error(msg) { this._write('ERROR', msg); }
    
    audit(type, msg) {
        this._write(`AUDIT:${type}`, msg);
    }

    _write(level, msg) {
        const entry = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
        fs.appendFileSync(this.logPath, entry);
    }
}

module.exports = Logger;
