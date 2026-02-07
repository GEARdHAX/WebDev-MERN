/**
 * Dashboard Page
 * Overview of agents and lists
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agentAPI, listAPI } from '../services/api';
import { Users, FileText, Upload, ArrowRight, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    agents: 0,
    batches: 0,
    totalItems: 0,
  });
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [agentsRes, listsRes] = await Promise.all([
        agentAPI.getAll(),
        listAPI.getAll(),
      ]);

      const agents = agentsRes.data.data;
      const batches = listsRes.data.data;

      // Calculate total items
      const totalItems = batches.reduce(
        (sum, batch) => sum + batch.totalItems,
        0
      );

      setStats({
        agents: agents.length,
        batches: batches.length,
        totalItems,
      });

      // Get recent batches (latest 5)
      setRecentBatches(batches.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Agents',
      value: stats.agents,
      icon: Users,
      color: 'primary',
      link: '/agents',
    },
    {
      title: 'Upload Batches',
      value: stats.batches,
      icon: FileText,
      color: 'secondary',
      link: '/lists',
    },
    {
      title: 'Distributed Items',
      value: stats.totalItems,
      icon: TrendingUp,
      color: 'accent',
      link: '/lists',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Overview of your agent management system
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <Link to={stat.link} key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-title">{stat.title}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/agents" className="action-card">
            <div className="action-icon primary">
              <Users size={24} />
            </div>
            <div className="action-content">
              <h3>Manage Agents</h3>
              <p>Add, edit, or remove agents</p>
            </div>
            <ArrowRight className="action-arrow" size={20} />
          </Link>

          <Link to="/upload" className="action-card">
            <div className="action-icon secondary">
              <Upload size={24} />
            </div>
            <div className="action-content">
              <h3>Upload CSV</h3>
              <p>Upload and distribute lists</p>
            </div>
            <ArrowRight className="action-arrow" size={20} />
          </Link>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Uploads</h2>
          {recentBatches.length > 0 && (
            <Link to="/lists" className="section-link">
              View All <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {recentBatches.length === 0 ? (
          <div className="empty-state card">
            <FileText className="empty-state-icon" />
            <h3 className="empty-state-title">No uploads yet</h3>
            <p className="empty-state-text">
              Upload a CSV file to distribute items among agents
            </p>
            <Link to="/upload" className="btn btn-primary">
              <Upload size={18} />
              Upload CSV
            </Link>
          </div>
        ) : (
          <div className="recent-uploads">
            {recentBatches.map((batch) => (
              <div key={batch._id} className="upload-card">
                <div className="upload-icon">
                  <FileText size={20} />
                </div>
                <div className="upload-content">
                  <h4>{batch.originalName}</h4>
                  <p>
                    {batch.totalItems} items • {batch.agentCount} agents
                  </p>
                </div>
                <span className="upload-date">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
