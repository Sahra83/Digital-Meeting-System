const systemService = require('../services/systemService');

async function getOverview(req, res, next) {
  try {
    const overview = await systemService.getSystemOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
};
