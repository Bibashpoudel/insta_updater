'use strict';
const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class oauth2AccessTokens extends Model {
    static associate(models) {
      this.myAssociation = this.hasOne(models.RefreshToken, {
        foreignKey: 'access_token_id',
        onDelete: 'cascade',
        hooks: true,
      });
    }
  };

  oauth2AccessTokens.init({
    id: {
      primaryKey: true,
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
    modelName: 'AccessToken',
    tableName: 'oauth2_access_tokens',
    timestamps: false,
    underscored: true,
  });
  
  return oauth2AccessTokens;
};
