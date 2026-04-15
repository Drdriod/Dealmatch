import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

type VerificationStep = 'face' | 'document' | 'complete';

export default function ProfileSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<VerificationStep>('face');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('national_id');

  // Initialize camera
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Camera error:', err);
          toast.error('Could not access camera. Please check permissions.');
          setCameraActive(false);
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  // Capture face photo
  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setCameraActive(false);
        toast.success('Face captured successfully!');
      }
    }
  };

  // Handle document upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setDocumentFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setDocumentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Document uploaded successfully!');
    }
  };

  // Submit verification
  const handleSubmitVerification = async () => {
    if (!capturedImage) {
      toast.error('Please capture a face photo');
      return;
    }

    if (!documentFile) {
      toast.error('Please upload an ID document');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would upload these files to S3 and get URLs
      // For now, we'll use data URLs
      await trpc.profile.updateVerification.useMutation().mutateAsync({
        isLiveVerified: true,
        idDocumentUrl: documentPreview || '',
        idDocumentType: documentType,
        idVerificationStatus: 'pending',
        verificationCompleted: true,
      });

      toast.success('Verification submitted! Your documents are being reviewed.');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error('Could not submit verification: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Verification</h1>
          <p className="text-slate-600 mt-2">
            We need to verify your identity to ensure a safe and trustworthy platform for all users.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex gap-4 mb-8">
          {(['face', 'document', 'complete'] as const).map((s, idx) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  step === s ? 'bg-orange-500' : step > s ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
              <p className="text-xs mt-2 text-slate-600 capitalize">{s === 'face' ? 'Face Check' : s === 'document' ? 'ID Upload' : 'Complete'}</p>
            </div>
          ))}
        </div>

        {/* Face Verification Step */}
        {step === 'face' && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Camera className="text-orange-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-900">Live Face Verification</h2>
            </div>

            <p className="text-slate-600 mb-6">
              We'll use your device camera to verify you're a real person. This helps us prevent fraud and keep the platform safe.
            </p>

            {!capturedImage ? (
              <div className="space-y-4">
                {!cameraActive ? (
                  <Button
                    onClick={() => setCameraActive(true)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Camera size={20} />
                    Start Camera
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: '400px' }}
                    />
                    <canvas ref={canvasRef} className="hidden" width={640} height={480} />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCameraActive(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={captureFace}
                        className="flex-1 gap-2"
                      >
                        <Camera size={20} />
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full rounded-lg"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">Face captured successfully</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCapturedImage(null);
                    setCameraActive(true);
                  }}
                  className="w-full"
                >
                  Retake Photo
                </Button>
                <Button
                  onClick={() => setStep('document')}
                  className="w-full"
                >
                  Next: Upload ID Document
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Document Upload Step */}
        {step === 'document' && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="text-orange-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-900">Upload ID Document</h2>
            </div>

            <p className="text-slate-600 mb-6">
              Please upload a clear photo of your ID document (Passport, Driver's License, or National ID).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver's License</option>
                </select>
              </div>

              {!documentPreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer block">
                    <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, or PDF (max 5MB)</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={documentPreview}
                    alt="Document preview"
                    className="w-full rounded-lg border"
                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                  />
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">Document uploaded successfully</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="document-upload-retry"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('document-upload-retry')?.click()}
                    className="w-full"
                  >
                    Upload Different Document
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('face')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep('complete')}
                  disabled={!documentPreview}
                  className="flex-1"
                >
                  Review & Submit
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Review & Submit Step */}
        {step === 'complete' && (
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900">Ready to Submit</h2>
              <p className="text-slate-600 mt-2">
                Your verification documents are ready to be reviewed by our team.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Our team will review your documents within 24 hours</li>
                    <li>You'll receive a notification once verified</li>
                    <li>Full platform access will be available after approval</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSubmitVerification}
                disabled={loading}
                className="w-full gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Verification'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('document')}
                disabled={loading}
                className="w-full"
              >
                Back to Edit
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
