let appPromise;

const getApp = () => {
  if (!appPromise) {
    appPromise = import('../server/src/app.js').then((module) => module.default);
  }
  return appPromise;
};

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
