'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Users, CheckCircle, Award } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Define types for your stats
interface DashboardStats {
  totalReferred: number;
  convertedUsers: number;
}

// Mock API functions - replace with actual API calls from `lib/api.ts`
const getDashboardStats = async (token: string) => {
  // In a real app, this would be:
  // const res = await axios.get('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
  // return res.data;
  
  // Mock data for now:
  return Promise.resolve({ totalReferred: 10, convertedUsers: 4 });
};

const simulatePurchase = async (token: string) => {
  // In a real app:
  // const res = await axios.post('/api/purchase/simulate', {}, { headers: { Authorization: `Bearer ${token}` } });
  // return res.data;

  // Mock data:
  return Promise.resolve({ message: 'Purchase successful!', credits: 2 });
};

export default function DashboardPage() {
  const { userInfo, logout, updateCredits } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      router.push('/login');
    } else {
      // Fetch dashboard stats
      getDashboardStats(userInfo.token)
        .then(setStats)
        .catch((err) => toast.error('Failed to fetch stats'));
    }
  }, [userInfo, router]);

  const handleCopy = () => {
    const referralLink = `${process.env.NEXT_PUBLIC_CLIENT_URL}/register?r=${userInfo?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const handlePurchase = async () => {
    if (!userInfo) return;
    setLoadingPurchase(true);
    try {
      const data = await simulatePurchase(userInfo.token);
      updateCredits(data.credits);
      toast.success(data.message);
    } catch (error) {
      toast.error('Purchase simulation failed.');
    } finally {
      setLoadingPurchase(false);
    }
  };

  if (!userInfo) {
    return null; // or a loading spinner
  }

  const referralLink = `${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/register?r=${userInfo.referralCode}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Toaster />
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold">Welcome, {userInfo.email}</h1>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="bg-red-600 px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        {/* Stat Cards */}
        <StatCard icon={<Users />} title="Referred Users" value={stats?.totalReferred ?? 0} />
        <StatCard icon={<CheckCircle />} title="Converted Users" value={stats?.convertedUsers ?? 0} />
        <StatCard icon={<Award />} title="Total Credits Earned" value={userInfo.credits} isMain={true} />
      </motion.div>

      {/* Referral Link Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 p-3 bg-gray-700 rounded-md border border-gray-600 outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-blue-600 p-3 rounded-md hover:bg-blue-700 transition flex items-center"
          >
            <Copy size={20} />
            <span className="ml-2">Copy</span>
          </button>
        </div>
      </div>

      {/* Simulate Purchase Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Simulate a Purchase</h2>
        <p className="text-gray-400 mb-4">
          Click this button to simulate your first purchase. If you were referred, you and your referrer will
          each earn 2 credits.
        </p>
        <button
          onClick={handlePurchase}
          disabled={loadingPurchase}
          className="w-full md:w-auto bg-green-600 px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition disabled:bg-gray-500"
        >
          {loadingPurchase ? 'Processing...' : 'Buy Product (Simulate)'}
        </button>
      </div>
    </div>
  );
}

// A simple StatCard component (you can move this to /components)
const StatCard = ({ icon, title, value, isMain = false }: { icon: React.ReactNode, title: string, value: number, isMain?: boolean }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`p-6 rounded-lg ${isMain ? 'bg-blue-600' : 'bg-gray-800'}`}
  >
    <div className="flex items-center space-x-3 mb-3">
      <div className={isMain ? 'text-white' : 'text-blue-400'}>{icon}</div>
      <h3 className="text-lg font-medium text-gray-300">{title}</h3>
    </div>
    <p className="text-4xl font-bold">{value}</p>
  </motion.div>
);