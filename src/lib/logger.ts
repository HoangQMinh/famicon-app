const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
