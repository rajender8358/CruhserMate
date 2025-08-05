const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/src/models/User');

const listUsers = async () => {
  try {
    const dbUri = process.env.DB_URI || 'mongodb://localhost:27017/crushermate';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const users = await User.find({}, 'username email role isActive lastLogin');

    if (users.length === 0) {
    } else {
      console.table(
        users.map(user => ({
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        })),
      );
    }
  } catch (error) {
    console.error('\n❌ An error occurred:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected.');
  }
};

listUsers();
