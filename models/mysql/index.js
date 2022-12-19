/* eslint-disable object-curly-spacing */
/* eslint-disable comma-dangle */
/* eslint-disable indent */
/* eslint-disable no-invalid-this */
/* eslint-disable quotes */
"use strict";

const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");
const { production } = require("../../config/config");
const basename = path.basename(__filename);
const models = {};

const mysqlDbConnect = async () => {
  if (this.sequelizeInstance) {
    console.log("returning the existing instance");
    return this.sequelizeInstance;
  }

  // Option 1: Passing parameters separately
  const sequelize = new Sequelize(
    production.database,
    production.username,
    production.password,
    {
      host: production.host,
      dialect: production.dialect,
      port: production.port,
    }
  );

  try {
    await sequelize.authenticate();
    console.log("Connection to mysql db has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the mysql db:", error);
  }

  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
      );
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(sequelize, DataTypes);

      models[model.name] = model;
    });

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  models.sequelize = sequelize;
  models.DataTypes = DataTypes;

  console.log("creating new instance");

  this.sequelizeInstance = sequelize;

  return sequelize;
};

module.exports.mysqlDbConnect = mysqlDbConnect;

module.exports.default = models;

console.log(this);
