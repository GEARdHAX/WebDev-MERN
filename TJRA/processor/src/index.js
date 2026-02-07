const { connectDB } = require('./config/db');
const { client: redisClient, connectRedis } = require('./services/redisClient');
const Event = require('./models/event');

require('dotenv').config();

const QUEUE_NAME = 'event-queue';

/**
 * Service 2: The "Processor" [cite: 25]
 */
const startWorker = async () => {
  console.log('Processor worker started, connecting to services...');

  // Connect to databases
  await connectDB();
  await connectRedis();

  console.log(`Worker connected. Waiting for events from queue: ${QUEUE_NAME}`);

  // Main worker loop
  while (true) {
    try {
      // 1. Pull event from the queue (blocking pop) [cite: 27]
      const result = await redisClient.brPop(QUEUE_NAME, 0); // 0 = block indefinitely
      const eventString = result.element;
      const eventData = JSON.parse(eventString);

      // 2. Process the event [cite: 28]
      // In this case, "processing" is just saving to DB
      const event = new Event(eventData);

      // 3. Write the event into the db [cite: 29]
      await event.save();

      console.log(`Processed event for site: ${event.site_id}`);
    } catch (err) {
      console.error('Error processing event:', err);
      // In a real system, this might move to a "dead-letter queue"
    }
  }
};

startWorker();