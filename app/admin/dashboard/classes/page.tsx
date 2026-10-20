'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Edit2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface NamedRef {
  _id: string;
  name: string;
}

interface ClassRecord {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  schoolId?: NamedRef | string | null;
  hubId?: NamedRef | string | null;
  modality: 'in-person' | 'hybrid' | 'online';
  schedule?: string;
  status: 'active' | 'inactive';
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  schoolId: '',
  hubId: '',
  modality: 'in-person' as ClassRecord['modality'],
  schedule: '',
  status: 'active' as ClassRecord['status'],
};

function refId(value?: NamedRef | string | null) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id;
}

function refName(value?: NamedRef | string | null) {
  if (!value) return 'All schools';
  if (typeof value === 'string') return value;
  return value.name;
}

export default function ClassesPage() {
  const { token, isSuperAdmin } = useAuth();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [schools, setSchools] = useState<NamedRef[]>([]);
  const [hubs, setHubs] = useState<Array<NamedRef & { schoolId?: NamedRef | string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [classRes, schoolRes, hubRes] = await Promise.all([
        fetch('/api/admin/classes', { headers }),
        fetch('/api/admin/schools', { headers }),
        fetch('/api/admin/hubs', { headers }),
      ]);
      const classData = await classRes.json();
      const schoolData = await schoolRes.json();
      const hubData = await hubRes.json();
      if (!classRes.ok) throw new Error(classData.error || 'Failed to load classes');
      setClasses(classData.classes || []);
      setSchools(schoolData.schools || []);
      setHubs(Array.isArray(hubData) ? hubData : hubData.hubs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: ClassRecord | null = null) => {
    setEditing(item);
    setForm(item ? {
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      schoolId: refId(item.schoolId),
      hubId: refId(item.hubId),
      modality: item.modality,
      schedule: item.schedule || '',
      status: item.status,
    } : emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const url = editing ? `/api/admin/classes/${editing._id}` : '/api/admin/classes';
    const response = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to save class');
      return;
    }
    setShowModal(false);
    await loadAll();
  };

  const handleDelete = async (item: ClassRecord) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    const response = await fetch(`/api/admin/classes/${item._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to delete class');
      return;
    }
    await loadAll();
  };

  const hubsForSchool = form.schoolId
    ? hubs.filter((hub) => refId(hub.schoolId) === form.schoolId || !hub.schoolId)
    : hubs;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Catalog students can choose after they pick a school and hub.</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Class
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
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No classes yet</h3>
          <p className="text-gray-600 mt-1">Add ESL, ABE, HSE, or other offerings.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Modality</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                {isSuperAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classes.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.code || item.schedule || 'No code'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {refName(item.schoolId)}
                    {item.hubId && typeof item.hubId === 'object' ? ` · ${item.hubId.name}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-gray-700">{item.modality.replace('-', ' ')}</td>
                  <td className={`px-4 py-3 text-sm ${item.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800">
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
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Class' : 'Create Class'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Class name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="border rounded-lg px-3 py-2" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                <select className="border rounded-lg px-3 py-2" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as ClassRecord['modality'] })}>
                  <option value="in-person">In person</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2" value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value, hubId: '' })}>
                <option value="">All schools</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>{school.name}</option>
                ))}
              </select>
              <select className="w-full border rounded-lg px-3 py-2" value={form.hubId} onChange={(e) => setForm({ ...form, hubId: e.target.value })}>
                <option value="">All hubs</option>
                {hubsForSchool.map((hub) => (
                  <option key={hub._id} value={hub._id}>{hub.name}</option>
                ))}
              </select>
              <input className="w-full border rounded-lg px-3 py-2" placeholder="Schedule (optional)" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClassRecord['status'] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
