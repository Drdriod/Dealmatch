import { useState } from 'react';
import { useLocation } from 'wouter';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PropertyList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('residential');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed');
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        setPhotos(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (videos.length + files.length > 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        setVideos(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!title || !state || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    setLoading(true);
    try {
      await trpc.properties.create.useMutation().mutateAsync({
        title,
        description,
        category: category as any,
        propertyType: 'Residential',
        state,
        city,
        address,
        price,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        photos,
        videos,
      });

      toast.success('Property listed! Awaiting agent verification...');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">List Your Property</h1>
        <p className="text-slate-600 mb-8">
          Share your property with DealMatch. Our agents will verify it within 24 hours.
        </p>

        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                step === s
                  ? 'bg-orange-500 text-white'
                  : step > s
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s === 1 ? 'Details' : s === 2 ? 'Media' : 'Review'}
            </button>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Property Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., 3-Bedroom Apartment in Lekki"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your property..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                    <option value="hotel">Hotel</option>
                    <option value="shortlet">Shortlet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select state</option>
                    {['Lagos', 'Abuja', 'Rivers', 'Akwa Ibom', 'Delta', 'Oyo', 'Kano'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Address"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price (₦) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g., 50000000"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value)}
                  placeholder="Bedrooms"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="number"
                  value={bathrooms}
                  onChange={e => setBathrooms(e.target.value)}
                  placeholder="Bathrooms"
                  className="px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Next: Add Photos & Videos
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Add Photos & Videos</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Photos ({photos.length}/10) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer block">
                    <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">Click to upload photos</p>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Videos ({videos.length}/3)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer block">
                    <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium">Click to upload videos</p>
                  </label>
                </div>

                {videos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {videos.map((video, idx) => (
                      <div key={idx} className="relative group">
                        <video
                          src={video}
                          className="w-full h-24 object-cover rounded-lg bg-slate-900"
                        />
                        <button
                          onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Review
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Review Your Listing</h2>
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Verification Process</p>
                    <p>
                      A DealMatch agent will verify your property within 24 hours. Your listing will be published after approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Location:</strong> {address}, {city}, {state}</p>
                <p><strong>Price:</strong> ₦{parseInt(price).toLocaleString()}</p>
                <p><strong>Media:</strong> {photos.length} photos, {videos.length} videos</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Listing'
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
