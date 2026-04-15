import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, MapPin, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface VerificationTask {
  id: number;
  propertyId: number;
  property: {
    id: number;
    title: string;
    address: string;
    city: string;
    state: string;
    price: string;
    photos: string[];
  };
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('pending');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: pendingVerifications } = trpc.verification.getPending.useQuery();

  useEffect(() => {
    if (pendingVerifications) {
      setTasks(pendingVerifications as any);
    }
  }, [pendingVerifications]);

  const handleApprove = async (propertyId: number) => {
    setLoading(true);
    try {
      await trpc.verification.approveProperty.useMutation().mutateAsync({
        propertyId,
        notes: 'Approved by agent',
      });

      setTasks(tasks.filter(t => t.property.id !== propertyId));
      setSelectedTask(null);
      toast.success('Property approved and published!');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Failed to approve property');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (propertyId: number) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await trpc.verification.rejectProperty.useMutation().mutateAsync({
        propertyId,
        reason: rejectReason,
      });

      setTasks(tasks.filter(t => t.property.id !== propertyId));
      setSelectedTask(null);
      setRejectReason('');
      setShowRejectForm(false);
      toast.success('Property rejected. Owner has been notified.');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Failed to reject property');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const stats = [
    { label: 'Pending Review', value: tasks.filter(t => t.status === 'pending').length, color: 'text-yellow-500' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-500' },
    { label: 'Total Tasks', value: tasks.length, color: 'text-slate-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
              <p className="text-sm text-slate-600">Manage property verifications</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Logged in as</p>
              <p className="font-semibold text-slate-900">{user?.name || 'Agent'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-6">
              <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Verification Tasks</h2>
                <div className="flex gap-2">
                  {(['all', 'pending', 'in_progress'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'In Progress'}
                    </button>
                  ))}
                </div>
              </div>

              {loading && <div className="text-center py-8 text-slate-500">Loading...</div>}

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                  <p className="text-slate-600">No tasks in this category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full p-4 border rounded-lg text-left hover:bg-slate-50 transition-all ${
                        selectedTask?.id === task.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{task.property.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {task.property.city}, {task.property.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} />
                              ₦{parseInt(task.property.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Task Details */}
          <div>
            {selectedTask ? (
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Details</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Property</p>
                    <p className="text-slate-900 font-medium">{selectedTask.property.title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Location</p>
                    <p className="text-slate-900">
                      {selectedTask.property.address}, {selectedTask.property.city}, {selectedTask.property.state}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Price</p>
                    <p className="text-lg font-bold text-orange-500">
                      ₦{parseInt(selectedTask.property.price).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Photos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTask.property.photos.slice(0, 4).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-3">Verification Checklist</p>
                  <div className="space-y-2">
                    {[
                      'Physical verification',
                      'Photos verification',
                      'Safety check',
                      'Legal documentation',
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleApprove(selectedTask.property.id)}
                      disabled={loading}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 size={18} />
                      Approve & Publish
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      disabled={loading}
                      className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle size={18} />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Explain why you're rejecting this property..."
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowRejectForm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedTask.property.id)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Confirm Reject
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center text-slate-500">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Select a task to view details</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
