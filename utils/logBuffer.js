import { EventEmitter } from 'events';

const MAX_LOGS = 500; // keep last 500 lines in memory
const logs = [];
const emitter = new EventEmitter();

function addLog(level, message) {
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 8),
    level, // 'info' | 'warn' | 'error'
    message,
    timestamp: new Date().toISOString(),
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();

  emitter.emit('log', entry);
  return entry;
}

export const pollLogger = {
  info: (message) => {
    console.log(message);
    return addLog('info', message);
  },
  warn: (message) => {
    console.warn(message);
    return addLog('warn', message);
  },
  error: (message) => {
    console.error(message);
    return addLog('error', message);
  },
  getRecent: (limit = 200) => logs.slice(-limit),
  onLog: (callback) => {
    emitter.on('log', callback);
    return () => emitter.off('log', callback);
  },
};