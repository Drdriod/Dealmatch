import { useState } from 'react';
import { Star, AlertTriangle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Review {
  id: number;
  rating: number;
  comment: string;
  category: string;
  reviewerName: string;
  createdAt: Date;
}

interface Dispute {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  priority: string;
  createdAt: Date;
}

export default function ReviewsDisputes() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'reviews' | 'disputes'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputeResponse, setDisputeResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [newDispute, setNewDispute] = useState({
    title: '',
    description: '',
    category: 'payment' as const,
    rentalId: 0,
  });

  const handleCreateDispute = async () => {
    if (!newDispute.title || !newDispute.description) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await trpc.disputes.create.useMutation().mutateAsync({
        rentalId: newDispute.rentalId,
        title: newDispute.title,
        description: newDispute.description,
        category: newDispute.category,
      });

      setNewDispute({ title: '', description: '', category: 'payment', rentalId: 0 });
      toast.success('Dispute created. Our team will review it soon.');
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: number) => {
    if (!disputeResponse.trim()) {
      toast.error('Please provide a resolution');
      return;
    }

    setLoading(true);
    try {
      // In a real app, we'd call an API to update the dispute
      setDisputes(disputes.map(d =>
        d.id === disputeId ? { ...d, status: 'resolved' as const } : d
      ));
      setSelectedDispute(null);
      setDisputeResponse('');
      toast.success('Dispute marked as resolved');
    } catch (err) {
      toast.error('Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
    );
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'in_review':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'escalated':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Reviews & Disputes</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setTab('reviews')}
            className={`px-4 py-3 font-medium border-b-2 transition-all ${
              tab === 'reviews'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star size={18} className="inline mr-2" />
            Reviews
          </button>
          <button
            onClick={() => setTab('disputes')}
            className={`px-4 py-3 font-medium border-b-2 transition-all ${
              tab === 'disputes'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={18} className="inline mr-2" />
            Disputes
          </button>
        </div>

        {/* Reviews Tab */}
        {tab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Your Reviews</h2>

                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Star size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                            <p className="text-xs text-slate-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-slate-700">{review.comment}</p>
                        <p className="text-xs text-slate-500 mt-2">Category: {review.category}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Rating Summary */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Rating Summary</h3>

                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-orange-500">4.8</p>
                  <div className="flex justify-center my-2">
                    {renderStars(5)}
                  </div>
                  <p className="text-sm text-slate-600">Based on {reviews.length} reviews</p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-8">{rating}★</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8 text-right">
                        {Math.floor(Math.random() * 10)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {tab === 'disputes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Disputes List */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Disputes</h2>

                {disputes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50 text-green-500" />
                    <p>No active disputes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disputes.map(dispute => (
                      <button
                        key={dispute.id}
                        onClick={() => setSelectedDispute(dispute)}
                        className={`w-full p-4 border rounded-lg text-left hover:bg-slate-50 transition-all ${
                          selectedDispute?.id === dispute.id ? 'border-orange-500 bg-orange-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{dispute.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{dispute.description}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getDisputeStatusColor(dispute.status)}`}>
                                {dispute.status}
                              </span>
                              <span className="text-xs text-slate-600">
                                {new Date(dispute.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Dispute Details & New Dispute */}
            <div className="space-y-6">
              {selectedDispute ? (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Dispute Details</h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Title</p>
                      <p className="text-slate-900">{selectedDispute.title}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Description</p>
                      <p className="text-slate-700 text-sm">{selectedDispute.description}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Category</p>
                      <p className="text-slate-900">{selectedDispute.category}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Status</p>
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${getDisputeStatusColor(selectedDispute.status)}`}>
                        {selectedDispute.status}
                      </span>
                    </div>
                  </div>

                  {selectedDispute.status !== 'resolved' && (
                    <div className="space-y-3">
                      <textarea
                        value={disputeResponse}
                        onChange={e => setDisputeResponse(e.target.value)}
                        placeholder="Add your response or resolution..."
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                      <Button
                        onClick={() => handleResolveDispute(selectedDispute.id)}
                        disabled={loading}
                        className="w-full"
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Report a Dispute</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={newDispute.title}
                        onChange={e => setNewDispute({ ...newDispute, title: e.target.value })}
                        placeholder="Brief title"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                      <select
                        value={newDispute.category}
                        onChange={e => setNewDispute({ ...newDispute, category: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="payment">Payment Issue</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="damage">Damage</option>
                        <option value="behavior">Behavior</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                      <textarea
                        value={newDispute.description}
                        onChange={e => setNewDispute({ ...newDispute, description: e.target.value })}
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleCreateDispute}
                      disabled={loading}
                      className="w-full"
                    >
                      Report Dispute
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
