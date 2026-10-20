'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Archive, Database, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { logger } from '@/lib/logger';

type Threshold = '6_months' | '1_year' | '2_years' | '3_years';

const RESEED_PRESETS = [
  { label: '25 students · 50 appointments · 3 months', userCount: 25, appointmentCount: 50, monthsBack: 3 },
  { label: '50 students · 100 appointments · 4 months', userCount: 50, appointmentCount: 100, monthsBack: 4 },
  { label: '100 students · 250 appointments · 6 months', userCount: 100, appointmentCount: 250, monthsBack: 6 },
];

const THRESHOLDS: Array<{ value: Threshold; label: string }> = [
  { value: '6_months', label: 'Older than 6 months' },
  { value: '1_year', label: 'Older than 1 year' },
  { value: '2_years', label: 'Older than 2 years' },
  { value: '3_years', label: 'Older than 3 years (purge eligible)' },
];

export default function MaintenancePage() {
  const router = useRouter();
  const { token, isAdmin, isSuperAdmin } = useAuth();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const [production, setProduction] = useState(false);
  const [confirmProduction, setConfirmProduction] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [presetIndex, setPresetIndex] = useState(1);
  const [reseeding, setReseeding] = useState(false);
  const [threshold, setThreshold] = useState<Threshold>('6_months');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [preview, setPreview] = useState<{ appointments: number; slots: number; users: number; cutoffDate?: string; purgeEligible?: boolean } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveMode, setArchiveMode] = useState<'archive' | 'purge'>('archive');
  const [archiveText, setArchiveText] = useState('');
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/admin/dashboard');
      return;
    }
    if (!token || !isAdmin) return;

    fetch('/api/admin/maintenance/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => setProduction(Boolean(data.production)))
      .catch((error) => logger.error('Failed to load maintenance status:', error));
  }, [token, isAdmin, isSuperAdmin, router]);

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Maintenance tools are only available to super admins.</p>
      </div>
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const productionPayload = production ? { confirmProduction } : {};

  async function readError(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (data.production) setProduction(true);
    return data.error || `Request failed (${response.status})`;
  }

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch('/api/admin/maintenance/clear-data', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ confirmationText: 'CLEAR DATA', ...productionPayload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reset failed');
      showSuccess(`Cleared ${data.deleted?.users || 0} users and ${data.deleted?.appointments || 0} appointments. Super admins were kept.`);
      setResetOpen(false);
      setResetText('');
      setPreview(null);
    } catch (error: any) {
      showError(error.message || 'Failed to clear data');
    } finally {
      setResetting(false);
    }
  };

  const handleReseed = async () => {
    const preset = RESEED_PRESETS[presetIndex];
    setReseeding(true);
    try {
      const response = await fetch('/api/admin/maintenance/reseed-data', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          confirmationText: 'CONFIRM_RESEED',
          ...preset,
          ...productionPayload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reseed failed');
      showSuccess(`Seeded ${data.created?.users || 0} students and ${data.created?.appointments || 0} appointments.`);
    } catch (error: any) {
      showError(error.message || 'Failed to reseed data');
    } finally {
      setReseeding(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await fetch('/api/admin/maintenance/archive/preview', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ olderThan: threshold }),
      });
      const data = await response.json();
      if (data.production) setProduction(true);
      if (!response.ok) throw new Error(data.error || 'Failed to preview archive records');
      setPreview(data);
      showSuccess(`Found ${data.appointments} appointments, ${data.slots} slots, and ${data.users} inactive students.`);
    } catch (error: any) {
      showError(error.message || 'Failed to preview archive records');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/maintenance/archive/export', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ olderThan: threshold, format: exportFormat }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `archive-${threshold}.${exportFormat}`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess('Archive export downloaded.');
    } catch (error: any) {
      showError(error.message || 'Failed to export archive');
    } finally {
      setExporting(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const response = await fetch('/api/admin/maintenance/archive/execute', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          olderThan: threshold,
          confirmationText: archiveMode === 'purge' ? 'PURGE DATA' : 'ARCHIVE DATA',
          ...productionPayload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Archival failed');
      showSuccess(data.message || 'Archival complete.');
      setArchiveOpen(false);
      setArchiveText('');
      setPreview(null);
    } catch (error: any) {
      showError(error.message || 'Failed to execute archival');
    } finally {
      setArchiving(false);
    }
  };

  const requiredArchiveText = archiveMode === 'purge' ? 'PURGE DATA' : 'ARCHIVE DATA';

  return (
    <div className="max-w-5xl space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Database & Maintenance</h2>
        <p className="mt-1 text-sm text-gray-600">
          Super admin tools for resetting operational data, seeding analytics, and enforcing retention.
        </p>
      </div>

      {production && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-900">Production environment</p>
              <p className="mt-1 text-sm text-amber-800">
                Destructive actions are locked until you confirm this is intentional.
              </p>
              <label className="mt-3 flex items-center gap-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={confirmProduction}
                  onChange={(event) => setConfirmProduction(event.target.checked)}
                />
                I understand this is production and want to override the lock.
              </label>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <Trash2 className="h-6 w-6 text-red-700" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">Reset / Clear Data</h3>
            <p className="mt-2 text-sm text-red-800">
              Deletes appointments, slots, notifications, waitlist rows, and all non-super-admin users.
              Super admin accounts stay in place. Hub configuration and audit logs are not wiped.
            </p>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Clear operational data
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-6 w-6 text-blue-700" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Reseed Analytics Data</h3>
            <p className="mt-2 text-sm text-gray-600">
              Adds randomized students and historical plus upcoming appointments so Analytics can be verified.
              This does not wipe existing records.
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">Volume</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={presetIndex}
              onChange={(event) => setPresetIndex(Number(event.target.value))}
            >
              {RESEED_PRESETS.map((preset, index) => (
                <option key={preset.label} value={index}>{preset.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleReseed}
              disabled={reseeding}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {reseeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reseed Database
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <Archive className="h-6 w-6 text-slate-700" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Archival & Retention</h3>
            <p className="mt-2 text-sm text-gray-600">
              Preview, export, then move aged appointments and inactive student accounts into archive collections.
              Permanent purge is only available for records older than 3 years.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Threshold
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal"
                  value={threshold}
                  onChange={(event) => {
                    setThreshold(event.target.value as Threshold);
                    setPreview(null);
                  }}
                >
                  {THRESHOLDS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Export format
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal"
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value as 'json' | 'csv')}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {previewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Preview Eligible Records
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export Archive
              </button>
              <button
                type="button"
                onClick={() => {
                  setArchiveMode('archive');
                  setArchiveOpen(true);
                }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Execute Archival
              </button>
              {threshold === '3_years' && (
                <button
                  type="button"
                  onClick={() => {
                    setArchiveMode('purge');
                    setArchiveOpen(true);
                  }}
                  className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  Permanent purge
                </button>
              )}
            </div>
            {preview && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{preview.appointments}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Slots</p>
                  <p className="text-2xl font-semibold text-gray-900">{preview.slots}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-gray-500">Inactive students</p>
                  <p className="text-2xl font-semibold text-gray-900">{preview.users}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900">Confirm data reset</h4>
            <p className="mt-2 text-sm text-gray-600">
              Super admin accounts will remain. Type <span className="font-mono font-semibold">CLEAR DATA</span> to continue.
            </p>
            <input
              className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={resetText}
              onChange={(event) => setResetText(event.target.value)}
              placeholder="CLEAR DATA"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-md px-3 py-2 text-sm text-gray-600" onClick={() => setResetOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={resetText !== 'CLEAR DATA' || resetting}
                onClick={handleReset}
                className="inline-flex items-center rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset now
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-gray-900">
              {archiveMode === 'purge' ? 'Confirm permanent purge' : 'Confirm archival'}
            </h4>
            <p className="mt-2 text-sm text-gray-600">
              {archiveMode === 'purge'
                ? 'Records older than 36 months will be deleted and will not stay queryable. Export first if you need a compliance copy.'
                : 'Eligible records move into archive collections and remain available for audits. Active analytics will no longer include them.'}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Type <span className="font-mono font-semibold">{requiredArchiveText}</span> to continue.
            </p>
            <input
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={archiveText}
              onChange={(event) => setArchiveText(event.target.value)}
              placeholder={requiredArchiveText}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-md px-3 py-2 text-sm text-gray-600" onClick={() => setArchiveOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveText !== requiredArchiveText || archiving}
                onClick={handleArchive}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  archiveMode === 'purge' ? 'bg-red-700' : 'bg-indigo-600'
                }`}
              >
                {archiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {archiveMode === 'purge' ? 'Purge now' : 'Archive now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-gray-400">
        <Database className="h-3.5 w-3.5" />
        Hubs, system settings, templates, and super admin accounts are retained.
      </p>
    </div>
  );
}
