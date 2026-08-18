const { setCors } = require('./_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'online',
    message: 'Event Countdown API is running smoothly on Vercel!',
    endpoints: {
      register: '/api/register/',
      token: '/api/token/',
      events: '/api/events/',
    },
  });
};
