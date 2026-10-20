'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Edit2, Plus, School, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface SchoolRecord {
  _id: string;
  name: string;
  slug: string;
  code: string;
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  website?: string;
}

const emptyForm = {
  name: '',
  slug: '',
  code: '',
  status: 'active' as 'active' | 'inactive',
  email: '',
  phone: '',
  website: '',
};

export default function SchoolsPage() {
  const { token, isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SchoolRecord | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (token) loadSchools();
  }, [token]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/schools', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load schools');
      setSchools(data.schools || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load schools');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (school: SchoolRecord | null = null) => {
    setEditing(school);
    setForm(school ? {
      name: school.name,
      slug: school.slug,
      code: school.code,
      status: school.status,
      email: school.email || '',
      phone: school.phone || '',
      website: school.website || '',
    } : emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const url = editing ? `/api/admin/schools/${editing._id}` : '/api/admin/schools';
    const response = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to save school');
      return;
    }
    setShowModal(false);
    await loadSchools();
  };

  const handleDelete = async (school: SchoolRecord) => {
    if (!window.confirm(`Delete ${school.name}?`)) return;
    const response = await fetch(`/api/admin/schools/${school._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to delete school');
      return;
    }
    await loadSchools();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-600 mt-1">District schools that own one or more hubs.</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add School
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No schools yet</h3>
          <p className="text-gray-600 mt-1">Seed the catalog or create School 1 through School 8.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Contact</th>
                {isSuperAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{school.name}</p>
                    <p className="text-xs text-gray-500">{school.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{school.code}</td>
                  <td className="px-4 py-3">
                    <span className={school.status === 'active' ? 'text-green-600 text-sm' : 'text-gray-500 text-sm'}>
                      {school.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{school.email || school.phone || '—'}</td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal(school)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(school)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit School' : 'Create School'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded-lg px-3 py-2" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <input className="border rounded-lg px-3 py-2" placeholder="Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <select className="w-full border rounded-lg px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
