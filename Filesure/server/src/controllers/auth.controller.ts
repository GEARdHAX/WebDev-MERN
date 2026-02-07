import { Request, Response } from 'express';
import User from '../models/User.model';
import Referral from '../models/Referral.model';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// Helper to generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

// Helper to generate a unique referral code
const generateReferralCode = () => randomBytes(3).toString('hex').toUpperCase();

export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { r: referralCode } = req.query; // Get referral code from query param ?r=CODE

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referredBy = null;
    let referrer = null;

    // Check if a valid referral code was used
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode as string });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const newUser = new User({
      email,
      password,
      referralCode: generateReferralCode(),
      referredBy,
    });

    const user = await newUser.save();

    // If referred, create the pending referral link
    if (referrer && user) {
      await Referral.create({
        referrerId: referrer._id,
        referredId: user._id,
        status: 'pending',
      });
    }

    // Return token and user info
    const token = generateToken(user._id.toString());
    res.status(201).json({
      _id: user._id,
      email: user.email,
      credits: user.credits,
      referralCode: user.referralCode,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id.toString());
      res.json({
        _id: user._id,
        email: user.email,
        credits: user.credits,
        referralCode: user.referralCode,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};