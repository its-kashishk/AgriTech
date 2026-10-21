require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;

// Fail fast on missing secrets, connect to MongoDB FIRST, and only then start listening.
(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('JWT_SECRET is missing or too short (min 16 chars). Set it in server/.env');
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message);
    console.error('Check MONGO_URI in server/.env, the Atlas database user/password (URL-encode special characters) and Network Access (IP allow list).');
    process.exit(1);
  }
})();
