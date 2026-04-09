const getHealth = () => {
  return {
    ok: true,
    service: 'trackify-api',
    timestamp: new Date().toISOString(),
  };
};

module.exports = { getHealth };

