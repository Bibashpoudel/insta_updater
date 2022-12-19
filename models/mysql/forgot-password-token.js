'use strict';
const {
  Model,
} = require('sequelize');
const {addHours} = require('date-fns');

module.exports = (sequelize, DataTypes) => {
  class forgot_password_tokens extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  forgot_password_tokens.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    token: {
      type: DataTypes.STRING,
    },
    user_id: {
      type: DataTypes.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    expires_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: addHours(new Date(), process.env.FORGOT_PASS_TOKEN_LIFETIME),
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
    modelName: 'ForgotPasswordToken',
    tableName: 'forgot_password_tokens',
    timestamps: false,
    underscored: true,
  });
  return forgot_password_tokens;
};
