'use strict';
const {
  Model,
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerSubdomainSocialTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };

  CustomerSubdomainSocialTag.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    subdomain_id: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    social_media_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    query_tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'CustomerSubdomainSocialTag',
    tableName: 'customer_subdomain_social_tag',
    timestamps: false,
    underscored: true,
  });

  return CustomerSubdomainSocialTag;
};
