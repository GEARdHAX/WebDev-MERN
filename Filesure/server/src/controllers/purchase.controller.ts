import { Request, Response } from 'express';
import User from '../models/User.model';
import Referral from '../models/Referral.model';
import mongoose from 'mongoose';

export const simulatePurchase = async (req: Request, res: Response) => {
  // @ts-ignore - 'user' will be on req from auth middleware
  const userId = req.user._id;

  // Use a database transaction to ensure atomicity (all or nothing)
  // This prevents double-crediting in a concurrent environment [cite: 45, 46]
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Only process if it's the user's first purchase [cite: 37]
    if (user.hasMadeFirstPurchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ message: 'Purchase successful (no credits awarded)', credits: user.credits });
    }

    // Mark first purchase as complete
    user.hasMadeFirstPurchase = true;
    
    let creditsAwarded = 0;

    // Check if this user was referred
    const referral = await Referral.findOne({ referredId: userId, status: 'pending' }).session(session);

    if (referral) {
      // 1. Mark referral as converted
      referral.status = 'converted';
      
      // 2. Award credits to the referred user (Ryan) [cite: 21]
      user.credits += 2;
      creditsAwarded = 2;

      // 3. Award credits to the referrer (Lina) [cite: 20]
      const referrer = await User.findById(referral.referrerId).session(session);
      if (referrer) {
        referrer.credits += 2;
        await referrer.save({ session });
      }
      
      await referral.save({ session });
    }

    await user.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'First purchase successful! Credits awarded.',
      credits: user.credits,
      creditsAwarded: creditsAwarded
    });

  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Server error during purchase' });
  }
};