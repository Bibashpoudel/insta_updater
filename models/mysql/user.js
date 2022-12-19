'use strict';
const {
  Model,
} = require('sequelize');
const bcrypt = require('bcrypt');
const { CustomerSubdomain } = require('.');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.myAssociation = this.hasMany(models.AccessToken, {
        foreignKey: 'user_id',
        onDelete: 'cascade',
        hooks: true,
      });

      this.myAssociation = this.belongsTo(models.CustomerSubdomain, {
        foreignKey: 'subdomain_id',
        as: 'CustomerSubdomain',
        hooks: true,
      });
    }
  };

  User.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    subdomain_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: CustomerSubdomain,
        key: 'id',
      },
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: {
      type: DataTypes.STRING,
      set(val) {
        this.setDataValue('password', val);
      },
    },
    role: DataTypes.STRING,
    employee_number: {
      type: DataTypes.STRING, DataTypes
    },
    position: {
      type: DataTypes.STRING,
    },
    contact_number: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    last_login_at: {
      type: DataTypes.DATE,
      defaultValue: null,
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
    timezone: {
      allowNull: false,
      type: DataTypes.STRING,
      defaultValue: 'Australia/Sydney',
    },
    last_login_with: {
      allowNull: false,
      type: DataTypes.STRING,
      defaultValue: 'msv',
    },
  }, {
    sequelize,
    modelName: 'User',
    underscored: true,
    timestamps: false,
  });

  const encryptPasswordIfChanged = (user, options) => {
    if (user.changed('password')) {
      const hash = bcrypt.hashSync(user.password, 10);

      user.set('password', hash);
    }
  };

  // triggers when password created or updated
  User.beforeCreate(encryptPasswordIfChanged);
  User.beforeUpdate(encryptPasswordIfChanged);

  // Proting password property

  User.prototype.comparePassword = function (userPassword) {
    const password = this.password;

    if (password == null) {
      return false;
    }

    const match = bcrypt.compareSync(userPassword, password);

    return match;
  };

  return User;
};
