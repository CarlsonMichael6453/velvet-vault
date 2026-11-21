const app = require('./app.json');

/** Project Pages live at /velvet-vault/. Local `expo start` keeps the site at /. */
module.exports = () => {
  const baseUrl = (process.env.EXPO_PAGES_BASE || '').replace(/\/$/, '');
  return {
    expo: {
      ...app.expo,
      experiments: {
        ...app.expo.experiments,
        ...(baseUrl ? { baseUrl } : {}),
      },
    },
  };
};
