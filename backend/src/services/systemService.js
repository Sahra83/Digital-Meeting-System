const db = require('../config/db');

/**
 * Stubbed system overview to return empty data since 
 * the requested tables were removed from setup.sql
 */
async function getSystemOverview() {
  return {
    features: [],
    workflow: [],
    statistics: [],
  };
}

module.exports = {
  getSystemOverview,
};
