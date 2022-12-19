module.exports = async (status, message, status_code, res_type, data = {}, res) => {
  return await res.status(status_code).json({
    status,
    message,
    status_code,
    res_type,
    data,
  });
};
