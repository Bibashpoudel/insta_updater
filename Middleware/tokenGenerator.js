const crypto = require('crypto');
const mysqlModels = require('../models/mysql/index').default;
const { addDays, format, endOfWeek, endOfMonth, differenceInCalendarDays, sub } = require('date-fns');
const { Enums } = require('../Utils');


module.exports = async (user) => {
  const { accessToken, refreshToken } = await getUniqueToken();
  const currentDate = format(new Date(), Enums.DATE_FORMAT);
  const accessTokenLifeTime = addDays(new Date(currentDate), process.env.ACCESS_TOKEN_LIFETIME);
  const refreshTokenLifeTime = addDays(new Date(currentDate), process.env.REFRESH_TOKEN_LIFETIME);

  const aToken = await mysqlModels.AccessToken.create({
    id: accessToken,
    user_id: user.id,
    expires_at: accessTokenLifeTime,
  });
  if (aToken) {
    const rToken = await mysqlModels.RefreshToken.create({
      id: refreshToken,
      access_token_id: aToken.id,
      expires_at: refreshTokenLifeTime,
    });
    if (rToken) {
      return {
        user,
        access_token: aToken.id,
        refresh_token: rToken.id,
        expires_at: aToken.expires_at,
        token_type: 'Bearer',
      };
    }
  }
};

/**
 */
const getUniqueToken = async () => {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const aToken = await mysqlModels.AccessToken.findOne({ where: { id: accessToken } });
  const rToken = await mysqlModels.RefreshToken.findOne({ where: { id: refreshToken } });
  if (!aToken && !rToken) {
    return {
      accessToken,
      refreshToken,
    };
  } else {
    getUniqueToken();
  }
};
