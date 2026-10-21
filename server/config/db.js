const mongoose = require('mongoose');

// Connects and only logs success AFTER the connection really succeeded.
async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env and fill it in.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected successfully (database: ${mongoose.connection.name})`);
  return mongoose.connection;
}
module.exports = connectDB;
