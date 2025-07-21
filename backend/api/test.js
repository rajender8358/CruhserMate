module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
};
