const isDevelopment = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV)
  ? process.env.NODE_ENV !== 'production'
  : true;

const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

export default logger;
