/**
 * Agents Page
 * CRUD operations for agents
 */

import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Agents.css';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    countryCode: '+91',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await agentAPI.getAll();
      setAgents(response.data.data);
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // Filter agents based on search
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal for new agent
  const handleAddAgent = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      countryCode: '+91',
      password: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      mobile: agent.mobile,
      countryCode: agent.countryCode || '+91',
      password: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile must be 10 digits';
    }

    if (!formData.countryCode.trim()) {
      errors.countryCode = 'Country code is required';
    } else if (!/^\+\d{1,4}$/.test(formData.countryCode)) {
      errors.countryCode = 'Invalid format (e.g., +91)';
    }

    if (!editingAgent && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      if (editingAgent) {
        await agentAPI.update(editingAgent._id, payload);
        toast.success('Agent updated successfully');
      } else {
        await agentAPI.create(payload);
        toast.success('Agent created successfully');
      }

      setShowModal(false);
      fetchAgents();
    } catch (error) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete agent
  const handleDelete = async (agent) => {
    try {
      await agentAPI.delete(agent._id);
      toast.success('Agent deleted successfully');
      setDeleteConfirm(null);
      fetchAgents();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete agent';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="agents-loading">
        <div className="spinner"></div>
        <p>Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="agents-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p className="page-subtitle">
            Manage your agents who receive distributed tasks
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAddAgent}>
          <Plus size={18} />
          Add Agent
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search agents by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={() => setSearchTerm('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <div className="empty-state card">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">
            {searchTerm ? 'No agents found' : 'No agents yet'}
          </h3>
          <p className="empty-state-text">
            {searchTerm
              ? 'Try a different search term'
              : 'Add agents to start distributing tasks'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={handleAddAgent}>
              <Plus size={18} />
              Add First Agent
            </button>
          )}
        </div>
      ) : (
        <div className="agents-grid">
          {filteredAgents.map((agent) => (
            <div key={agent._id} className="agent-card">
              <div className="agent-header">
                <div className="agent-avatar">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="agent-actions">
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => handleEditAgent(agent)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setDeleteConfirm(agent)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="agent-info">
                <h3 className="agent-name">{agent.name}</h3>
                <div className="agent-detail">
                  <Mail size={14} />
                  <span>{agent.email}</span>
                </div>
                <div className="agent-detail">
                  <Phone size={14} />
                  <span>
                    {agent.countryCode} {agent.mobile}
                  </span>
                </div>
              </div>
              <div className="agent-footer">
                <span className={`badge ${agent.isActive ? 'badge-success' : 'badge-error'}`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter agent name"
                  />
                  {formErrors.name && (
                    <span className="form-error">{formErrors.name}</span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="agent@example.com"
                  />
                  {formErrors.email && (
                    <span className="form-error">{formErrors.email}</span>
                  )}
                </div>

                {/* Mobile with Country Code */}
                <div className="form-row">
                  <div className="form-group" style={{ width: '120px' }}>
                    <label className="form-label" htmlFor="countryCode">
                      Code *
                    </label>
                    <input
                      id="countryCode"
                      type="text"
                      className={`form-input ${formErrors.countryCode ? 'error' : ''}`}
                      value={formData.countryCode}
                      onChange={(e) =>
                        setFormData({ ...formData, countryCode: e.target.value })
                      }
                      placeholder="+91"
                    />
                    {formErrors.countryCode && (
                      <span className="form-error">{formErrors.countryCode}</span>
                    )}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="mobile">
                      Mobile Number *
                    </label>
                    <input
                      id="mobile"
                      type="text"
                      className={`form-input ${formErrors.mobile ? 'error' : ''}`}
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="10-digit number"
                    />
                    {formErrors.mobile && (
                      <span className="form-error">{formErrors.mobile}</span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password {!editingAgent && '*'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      editingAgent
                        ? 'Leave blank to keep current'
                        : 'Minimum 6 characters'
                    }
                  />
                  {formErrors.password && (
                    <span className="form-error">{formErrors.password}</span>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <div className="spinner" style={{ width: 18, height: 18 }}></div>
                      Saving...
                    </>
                  ) : editingAgent ? (
                    'Update Agent'
                  ) : (
                    'Add Agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div
            className="modal-content delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Delete Agent</h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setDeleteConfirm(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
