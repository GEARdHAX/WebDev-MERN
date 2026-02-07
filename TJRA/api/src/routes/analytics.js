const express = require('express');
const Joi = require('joi');
const { client: redisClient } = require('../services/redisClient');
const Event = require('../models/event');

const router = express.Router();

// Validation schema for the event payload [cite: 22]
const eventSchema = Joi.object({
  site_id: Joi.string().required(),
  event_type: Joi.string().required(),
  path: Joi.string().required(),
  user_id: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
});

/**
 * Service 1: The "Ingestion" API [cite: 9]
 * POST /event
 */
router.post('/event', async (req, res) => {
  // 1. Validate the JSON body [cite: 22]
  const { error, value } = eventSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    // 2. Place the event into an asynchronous processing queue [cite: 23]
    await redisClient.lPush('event-queue', JSON.stringify(value));

    // 3. Immediately return Success [cite: 24]
    res.status(202).json({ message: 'Event accepted' });
  } catch (err) {
    console.error('Failed to queue event:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Service 3: The "Reporting" API [cite: 30]
 * GET /stats
 */
router.get('/stats', async (req, res) => {
  const { site_id, date } = req.query; // [cite: 34]

  if (!site_id) {
    return res.status(400).json({ message: 'site_id is required' });
  }

  try {
    // 1. Build the base match query for aggregation
    const matchStage = { $match: { site_id: site_id } };

    if (date) {
      // Filter by the specified date
      const startDate = new Date(date);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setUTCHours(23, 59, 59, 999);

      matchStage.$match.timestamp = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // 2. Run aggregation for total_views and unique_users [cite: 36]
    const mainStatsPromise = Event.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          total_views: { $sum: 1 },
          unique_users_set: { $addToSet: '$user_id' },
        },
      },
      {
        $project: {
          _id: 0,
          total_views: 1,
          unique_users: { $size: '$unique_users_set' },
        },
      },
    ]);

    // 3. Run aggregation for top_paths [cite: 36]
    const topPathsPromise = Event.aggregate([
      matchStage,
      {
        $group: {
          _id: '$path', // Group by path
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 3 }, // Get top 3 paths as in the example
      {
        $project: {
          _id: 0,
          path: '$_id',
          views: 1,
        },
      },
    ]);

    // 4. Wait for both queries to finish
    const [mainStatsResult, topPaths] = await Promise.all([
      mainStatsPromise,
      topPathsPromise,
    ]);

    const mainStats = mainStatsResult[0] || {
      total_views: 0,
      unique_users: 0,
    };

    // 5. Format the final response [cite: 35, 37]
    const response = {
      site_id: site_id,
      date: date || 'all-time',
      total_views: mainStats.total_views,
      unique_users: mainStats.unique_users,
      top_paths: topPaths, // [cite: 44-48]
    };

    res.json(response);
  } catch (err) {
    console.error('Failed to get stats:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;