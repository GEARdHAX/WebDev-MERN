/**
 * Upload Page
 * CSV/XLSX file upload and distribution
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAPI, agentAPI } from '../services/api';
import { Upload as UploadIcon, FileSpreadsheet, AlertCircle, CheckCircle, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    try {
      const response = await agentAPI.getAll();
      setAgents(response.data.data.filter((a) => a.isActive));
    } catch (error) { toast.error('Failed to load agents'); }
    finally { setLoadingAgents(false); }
  };

  const allowedExtensions = ['.csv', '.xlsx', '.xls'];

  const validateFile = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) return 'Invalid file type. Please upload CSV, XLSX, or XLS file.';
    if (file.size > 10 * 1024 * 1024) return 'File size too large. Maximum allowed size is 10MB.';
    return null;
  };

  const handleFileSelect = (selectedFile) => {
    const error = validateFile(selectedFile);
    if (error) { toast.error(error); return; }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first'); return; }
    if (agents.length === 0) { toast.error('Please add at least one agent before uploading'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await listAPI.upload(formData);
      setResult(response.data);
      toast.success(response.data.message);
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
      if (error.response?.data?.errors) setResult({ success: false, errors: error.response.data.errors });
    } finally { setUploading(false); }
  };

  const clearFile = () => { setFile(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const formatFileSize = (bytes) => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  if (loadingAgents) return <div className="upload-loading"><div className="spinner"></div><p>Loading...</p></div>;

  return (
    <div className="upload-page">
      <div className="page-header"><div><h1>Upload CSV</h1><p className="page-subtitle">Upload a CSV or Excel file to distribute items among agents</p></div></div>
      {agents.length === 0 && <div className="upload-warning card"><AlertCircle size={20} /><div><strong>No active agents</strong><p>Please add at least one agent before uploading.</p></div><button className="btn btn-primary btn-sm" onClick={() => navigate('/agents')}>Add Agents</button></div>}
      {agents.length > 0 && <div className="agents-summary card"><Users size={20} /><span><strong>{agents.length}</strong> active agents available</span></div>}
      <div className="upload-section">
        {!result ? (
          <>
            <div className={`upload-dropzone ${dragActive ? 'dragging' : ''} ${file ? 'has-file' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleChange} style={{ display: 'none' }} />
              {file ? <div className="file-preview"><FileSpreadsheet size={48} className="file-icon" /><div className="file-info"><span className="file-name">{file.name}</span><span className="file-size">{formatFileSize(file.size)}</span></div><button className="file-remove" onClick={(e) => { e.stopPropagation(); clearFile(); }}><X size={20} /></button></div>
                : <div className="upload-placeholder"><UploadIcon size={48} className="upload-icon" /><h3>Drop your file here</h3><p>or click to browse</p><span className="upload-formats">Supports CSV, XLSX, XLS (max 10MB)</span></div>}
            </div>
            <div className="format-info card"><h4>Required CSV Format</h4><p>Columns: FirstName (text), Phone (number), Notes (optional)</p></div>
            <button className="btn btn-primary btn-lg upload-btn" onClick={handleUpload} disabled={!file || uploading || agents.length === 0}>{uploading ? <><div className="spinner" style={{ width: 20, height: 20 }}></div>Uploading...</> : <><UploadIcon size={20} />Upload & Distribute</>}</button>
          </>
        ) : (
          <div className="upload-result">
            {result.success ? (
              <>
                <div className="result-header success"><CheckCircle size={48} /><h2>Distribution Complete!</h2><p>{result.message}</p></div>
                <div className="distribution-summary"><div className="summary-stats"><div className="summary-stat"><span className="stat-value">{result.data.totalItems}</span><span className="stat-label">Total Items</span></div><div className="summary-stat"><span className="stat-value">{result.data.agentCount}</span><span className="stat-label">Agents</span></div></div></div>
                <div className="distribution-details"><h3>Items per Agent</h3>{result.data.distribution.map((d, i) => <div key={i} className="distribution-row"><div className="distribution-agent"><div className="agent-avatar-sm">{d.agent.name.charAt(0).toUpperCase()}</div><div><span className="agent-name">{d.agent.name}</span><span className="agent-email">{d.agent.email}</span></div></div><span className="distribution-count">{d.itemCount} items</span></div>)}</div>
                <div className="result-actions"><button className="btn btn-secondary" onClick={() => { clearFile(); setResult(null); }}>Upload Another</button><button className="btn btn-primary" onClick={() => navigate('/lists')}>View All Lists</button></div>
              </>
            ) : (
              <><div className="result-header error"><AlertCircle size={48} /><h2>Upload Failed</h2></div>{result.errors && <div className="result-errors"><ul>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}<div className="result-actions"><button className="btn btn-primary" onClick={() => { clearFile(); setResult(null); }}>Try Again</button></div></>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
