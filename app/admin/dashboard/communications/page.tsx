"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Plus, Send, Loader, AlertCircle, CheckCircle, Eye, X } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  subject: string;
  description?: string;
}

interface BulkCommFormData {
  templateId: string;
  subject: string;
  body: string;
  criteria: {
    hubName?: string;
    appointmentStatus?: string;
    preferredLanguage?: string;
    profileCompleted?: boolean;
  };
}

export default function BulkCommunicationPage() {
  const { token, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<BulkCommFormData>({
    templateId: '',
    subject: '',
    body: '',
    criteria: {},
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
  });

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ar', label: 'Arabic' },
    { code: 'ko', label: 'Korean' },
    { code: 'vi', label: 'Vietnamese' },
  ];

  const appointmentStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  const hubs = ['Washington Heights', 'Upper West Side', 'Harlem', 'Midtown', 'Downtown'];

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadTemplates();
  }, [token, isSuperAdmin]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/communications/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        body: template.subject, // Would need full body from API
      }));
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      setError('Template name, subject, and body are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/communications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        await loadTemplates();
        setShowTemplateModal(false);
        setNewTemplate({ name: '', subject: '', body: '', description: '' });
        setSuccess('Template created successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create template');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.templateId || !formData.subject || !formData.body) {
      setError('Template, subject, and body are required');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: formData.templateId,
          subject: formData.subject,
          body: formData.body,
          criteria: formData.criteria,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${data.emailsSent} emails sent successfully, ${data.emailsFailed} failed`);
        setFormData({
          templateId: '',
          subject: '',
          body: '',
          criteria: {},
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send communications');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Only super admins can access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            Bulk Communications
          </h1>
          <p className="text-gray-600 mt-1">Send emails to users based on specific criteria</p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Template
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSendCommunication} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Select Template</label>
          <select
            value={formData.templateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose a template...</option>
            {templates.map(template => (
              <option key={template._id} value={template._id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Subject</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Message Body</label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        {/* Preview Button */}
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview Email
        </button>

        {/* Criteria Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hub (Optional)</label>
              <select
                value={formData.criteria.hubName || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, hubName: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All hubs</option>
                {hubs.map(hub => (
                  <option key={hub} value={hub}>{hub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Appointment Status (Optional)</label>
              <select
                value={formData.criteria.appointmentStatus || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, appointmentStatus: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                {appointmentStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Language (Optional)</label>
              <select
                value={formData.criteria.preferredLanguage || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, preferredLanguage: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All languages</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Profile Status (Optional)</label>
              <select
                value={formData.criteria.profileCompleted === undefined ? '' : formData.criteria.profileCompleted ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, profileCompleted: e.target.value === '' ? undefined : e.target.value === 'true' }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All profiles</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={sending}
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Communication
              </>
            )}
          </button>
        </div>
      </form>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create New Template</h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Subject</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Body</label>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description (Optional)</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="When is this template used?"
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">From:</p>
                <p className="font-medium text-gray-900">Appointment System &lt;noreply@appointmentsystem.com&gt;</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Subject:</p>
                <p className="font-medium text-gray-900">{formData.subject}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">Message:</p>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-900">
                  {formData.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
