/**
 * Lists Page - View distributed lists
 */
import { useState, useEffect } from 'react';
import { listAPI, agentAPI } from '../services/api';
import { FileText, Users, Calendar, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Lists.css';

const Lists = () => {
  const [batches, setBatches] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, agentsRes] = await Promise.all([listAPI.getAll(), agentAPI.getAll()]);
      setBatches(batchesRes.data.data);
      setAgents(agentsRes.data.data);
    } catch (error) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const toggleBatch = async (batchId) => {
    if (expandedBatch === batchId) { setExpandedBatch(null); return; }
    setExpandedBatch(batchId);
    if (!batchDetails[batchId]) {
      try {
        const response = await listAPI.getBatch(batchId);
        setBatchDetails((prev) => ({ ...prev, [batchId]: response.data.data }));
      } catch (error) { toast.error('Failed to load batch details'); }
    }
  };

  const handleDelete = async (batch) => {
    try {
      await listAPI.deleteBatch(batch._id);
      toast.success('Batch deleted successfully');
      setDeleteConfirm(null);
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete batch'); }
  };

  if (loading) return <div className="lists-loading"><div className="spinner"></div><p>Loading lists...</p></div>;

  return (
    <div className="lists-page">
      <div className="page-header"><div><h1>Distributed Lists</h1><p className="page-subtitle">View all uploaded files and their distribution</p></div></div>
      {batches.length === 0 ? (
        <div className="empty-state card"><FileText className="empty-state-icon" /><h3 className="empty-state-title">No uploads yet</h3><p className="empty-state-text">Upload a CSV file to see distributed lists here</p></div>
      ) : (
        <div className="batches-list">
          {batches.map((batch) => (
            <div key={batch._id} className={`batch-card ${expandedBatch === batch._id ? 'expanded' : ''}`}>
              <div className="batch-header" onClick={() => toggleBatch(batch._id)}>
                <div className="batch-icon"><FileText size={24} /></div>
                <div className="batch-info">
                  <h3 className="batch-name">{batch.originalName}</h3>
                  <div className="batch-meta">
                    <span><Users size={14} /> {batch.agentCount} agents</span>
                    <span><FileText size={14} /> {batch.totalItems} items</span>
                    <span><Calendar size={14} /> {new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="batch-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(batch); }} title="Delete"><Trash2 size={18} /></button>
                  {expandedBatch === batch._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {expandedBatch === batch._id && (
                <div className="batch-content">
                  {batchDetails[batch._id] ? (
                    <div className="distribution-grid">
                      {batchDetails[batch._id].distribution.map((d, index) => (
                        <div key={index} className="agent-distribution">
                          <div className="agent-header-dist">
                            <div className="agent-avatar-list">{d.agent.name.charAt(0).toUpperCase()}</div>
                            <div><h4>{d.agent.name}</h4><span>{d.agent.email}</span></div>
                            <span className="item-count">{d.items.length} items</span>
                          </div>
                          <div className="items-table">
                            <table className="table">
                              <thead><tr><th>FirstName</th><th>Phone</th><th>Notes</th></tr></thead>
                              <tbody>
                                {d.items.map((item, i) => (
                                  <tr key={i}><td>{item.firstName}</td><td>{item.phone}</td><td>{item.notes || '-'}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="batch-loading"><div className="spinner"></div></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Batch</h2><button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}><X size={20} /></button></div>
            <div className="modal-body"><p>Delete <strong>{deleteConfirm.originalName}</strong>? This will remove all {deleteConfirm.totalItems} distributed items.</p></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists;
