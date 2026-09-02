const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

const db = {};

// Load all .model.js files dynamically
fs.readdirSync(__dirname).forEach((file) => {
  if (file.endsWith('.model.js')) {
    const modelModule = require(path.join(__dirname, file));

    let model;
    if (typeof modelModule === 'function' && modelModule.prototype instanceof Model) {
      model = modelModule.init(modelModule.schema || {}, { sequelize });
    } else if (typeof modelModule === 'function') {
      model = modelModule(sequelize, DataTypes);
    } else {
      model = modelModule;
    }

    if (model && model.name) {
      db[model.name] = model;
    }
  }
});

// Load associations after model registration
if (fs.existsSync(path.join(__dirname, 'associations.js'))) {
  require('./associations')(db);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
