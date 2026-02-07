/**
 * Layout Component
 * Main layout with enhanced sidebar navigation
 */

import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Upload,
  List,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & stats' },
    { path: '/agents', icon: Users, label: 'Agents', description: 'Manage team' },
    { path: '/upload', icon: Upload, label: 'Upload CSV', description: 'Import data' },
    { path: '/lists', icon: List, label: 'Distributions', description: 'View assignments' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Menu Button - Only shows when sidebar is closed */}
      <button
        className={`mobile-menu-btn ${sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Glow Effect */}
        <div className="sidebar-glow"></div>

        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Shield size={22} />
            </div>
            <div className="logo-content">
              <span className="logo-text">AgentFlow</span>
              <span className="logo-badge">Pro</span>
            </div>
          </div>
          {/* Close button inside sidebar for mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Main Menu</span>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="nav-link-icon">
                  <item.icon size={20} />
                </div>
                <div className="nav-link-content">
                  <span className="nav-link-label">{item.label}</span>
                  <span className="nav-link-desc">{item.description}</span>
                </div>
                <ChevronRight className="nav-link-arrow" size={16} />
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User Card */}
          <div className="user-card">
            <div className="user-avatar">
              <span>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              <div className="user-status"></div>
            </div>
            <div className="user-details">
              <span className="user-greeting">{getGreeting()}</span>
              <span className="user-name">{user?.name || 'Admin User'}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
