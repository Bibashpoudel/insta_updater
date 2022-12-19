'use strict';
const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class oauth2RefreshTokens extends Model {
    static associate(models) {
    }DataTypes
  };

  oauth2RefreshTokens.init({
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
    },
    access_token_id: {
      type: DataTypes.STRING,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    expires_at: {
      type: DataTypes.DATE,
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
    modelName: 'RefreshToken',
    tableName: 'oauth2_refresh_tokens',
    timestamps: false,
    underscored: true,
  });

  return oauth2RefreshTokens;
};
