// import { MongoClient } from 'mongodb';
// import dotenv from 'dotenv';

// dotenv.config();

// let client;
// let db;

// // export async function connectDB() {
// //   if (!client) {
// //     client = new MongoClient(process.env.MONGODB_URI);
// //     await client.connect();
// //     db = client.db();
// //     console.log('Connected to MongoDB');
// //   }
// //   return db;
// // }

// // export async function saveMessage(messageData) {
// //   const database = await connectDB();
// //   return await database.collection('messages').insertOne({
// //     ...messageData,
// //     createdAt: new Date()
// //   });
// // }

// // export async function checkMessageExists(messageId) {
// //   const database = await connectDB();
// //   const existing = await database.collection('messages').findOne({ messageId });
// //   return !!existing;
// // }

// // export async function saveChatMessage(customerId, message, isBot) {
// //   const database = await connectDB();
// //   return await database.collection('chat_history').insertOne({
// //     customerId,
// //     message,
// //     isBot,
// //     timestamp: new Date()
// //   });
// // }

// // export async function getChatHistory(customerId, limit = 10) {
// //   const database = await connectDB();
// //   return await database.collection('chat_history')
// //     .find({ customerId })
// //     .sort({ timestamp: -1 })
// //     .limit(limit)
// //     .toArray();
// // }

// export async function connectDB() {
//   if (!client) {
//     try {
//       client = new MongoClient(process.env.MONGODB_URI, {
//         serverSelectionTimeoutMS: 5000,
//         socketTimeoutMS: 45000,
//       });
//       await client.connect();
//       db = client.db();
//       console.log('✅ Connected to MongoDB');
//     } catch (error) {
//       console.error('❌ MongoDB connection failed:', error.message);
//       return null;
//     }
//   }
//   return db;
// }

// export async function saveMessage(messageData) {
//   try {
//     const database = await connectDB();
//     if (!database) return null;
//     return await database.collection('messages').insertOne({
//       ...messageData,
//       createdAt: new Date()
//     });
//   } catch (error) {
//     console.error('Save message failed:', error.message);
//     return null;
//   }
// }

// export async function checkMessageExists(messageId) {
//   try {
//     const database = await connectDB();
//     if (!database) return false;
//     const existing = await database.collection('messages').findOne({ messageId });
//     return !!existing;
//   } catch (error) {
//     console.error('Check message failed:', error.message);
//     return false;
//   }
// }

// export async function saveChatMessage(customerId, message, isBot) {
//   try {
//     const database = await connectDB();
//     if (!database) return null;
//     return await database.collection('chat_history').insertOne({
//       customerId,
//       message,
//       isBot,
//       timestamp: new Date()
//     });
//   } catch (error) {
//     console.error('Save chat message failed:', error.message);
//     return null;
//   }
// }



// Temporary - disable all database operations
export async function connectDB() {
  console.log('⚠️ Database disabled temporarily');
  return null;
}

export async function saveMessage(messageData) {
  console.log('📝 Message saved (memory only):', messageData.messageId);
  return null;
}

export async function checkMessageExists(messageId) {
  console.log('🔍 Checking message (always false):', messageId);
  return false;
}

export async function saveChatMessage(customerId, message, isBot) {
  console.log('💬 Chat saved (memory only):', { customerId, message, isBot });
  return null;
}

export async function getChatHistory(customerId, limit = 10) {
  console.log('📚 Getting history (empty):', customerId);
  return [];
}
