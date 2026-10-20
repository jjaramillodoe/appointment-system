'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { hubCalendarToday } from '@/lib/slotDateTime';
import { toAppointmentClock } from '@/lib/appointmentTime';

interface AdminBookModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  userId: string;
  studentName: string;
  defaultHubId?: string;
  onBooked: () => void;
}

export default function AdminBookModal({
  open,
  onClose,
  token,
  userId,
  studentName,
  defaultHubId,
  onBooked,
}: AdminBookModalProps) {
  const [hubs, setHubs] = useState<Array<{ _id: string; name: string }>>([]);
  const [hubId, setHubId] = useState(defaultHubId || '');
  const [date, setDate] = useState(hubCalendarToday());
  const [time, setTime] = useState('9:00 AM');
  const [classInterest, setClassInterest] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [dayOffReason, setDayOffReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    fetch('/api/admin/hubs', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.hubs || [];
        setHubs(list);
        if (!hubId && (defaultHubId || list[0]?._id)) {
          setHubId(defaultHubId || list[0]._id);
        }
      })
      .catch(() => setError('Unable to load hubs'));
  }, [open, token, defaultHubId]);

  useEffect(() => {
    if (!open || !hubId || !date) return;
    fetch(`/api/availability?hubId=${hubId}&date=${date}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.data?.isDayOff) {
          setDayOffReason(data.data.dayOffReason || 'Closed');
          setSlots([]);
        } else {
          setDayOffReason('');
          setSlots((data.data?.slots || []).filter((slot: any) => slot.available > 0).map((slot: any) => toAppointmentClock(slot.time)));
        }
      })
      .catch(() => setDayOffReason(''));
  }, [open, hubId, date]);

  const handleBook = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/admin/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify({ userId, hubId, date, time, classInterest: classInterest || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');
      onBooked();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book or reschedule {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <select value={hubId} onChange={(event) => setHubId(event.target.value)} className="w-full rounded border px-3 py-2">
            {hubs.map((hub) => (
              <option key={hub._id} value={hub._id}>{hub.name}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded border px-3 py-2" />
          <select value={classInterest} onChange={(event) => setClassInterest(event.target.value)} className="w-full rounded border px-3 py-2">
            <option value="">Program (optional)</option>
            <option value="ESL">ESL</option>
            <option value="BE/HSE">BE/HSE</option>
          </select>
          {dayOffReason ? (
            <p className="text-sm text-amber-700">{dayOffReason}</p>
          ) : (
            <select value={time} onChange={(event) => setTime(event.target.value)} className="w-full rounded border px-3 py-2">
              {(slots.length ? slots : ['9:00 AM']).map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook} disabled={saving || Boolean(dayOffReason)}>{saving ? 'Saving…' : 'Book or reschedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
