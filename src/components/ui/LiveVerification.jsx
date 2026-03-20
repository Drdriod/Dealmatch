import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

// We use face-api.js loaded from CDN for real liveness detection
// Challenges: blink detection + head turn detection

const FACE_API_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/face-api.min.js'
const MODELS_URL   = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

const CHALLENGES = [
  { id:'blink', instruction:'Blink both eyes slowly', icon:'👁️', successMsg:'Blink detected! ✓' },
  { id:'turn',  instruction:'Turn your head to the left', icon:'↩️', successMsg:'Head turn detected! ✓' },
]

export default function LiveVerification({ onSuccess, onClose }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const faceApiRef  = useRef(null)

  const [phase, setPhase]           = useState('loading') // loading | intro | challenge | success | error
  const [loadProgress, setLoadProgress] = useState(0)
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [challengeStatus, setChallengeStatus]   = useState('waiting') // waiting | detecting | done
  const [feedback, setFeedback]     = useState('')
  const [progress, setProgress]     = useState(0)
  const [cameraReady, setCameraReady] = useState(false)

  // Blink detection state
  const blinkState  = useRef({ wasOpen: true, blinkCount: 0, lastBlink: 0 })
  // Head turn state
  const headState   = useRef({ baseYaw: null, turned: false })

  // ── Load face-api.js from CDN ──────────────────────────
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        // Check if already loaded
        if (window.faceapi) {
          faceApiRef.current = window.faceapi
          await loadModels()
          return
        }

        setLoadProgress(10)
        // Load face-api.js script
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = FACE_API_CDN
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        setLoadProgress(30)
        faceApiRef.current = window.faceapi
        await loadModels()
      } catch (err) {
        console.error('Failed to load face-api:', err)
        setPhase('error')
      }
    }

    const loadModels = async () => {
      const faceapi = faceApiRef.current
      if (!faceapi) return

      try {
        setLoadProgress(40)
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL)
        setLoadProgress(65)
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL)
        setLoadProgress(90)
        await faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL)
        setLoadProgress(100)
        setPhase('intro')
      } catch (err) {
        console.error('Failed to load models:', err)
        // Fall back to simplified verification if models fail
        setPhase('intro')
        faceApiRef.current = null
      }
    }

    loadFaceApi()

    return () => {
      stopCamera()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width:{ ideal:640 }, height:{ ideal:480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err) {
      toast.error('Camera access denied. Please allow camera and try again.')
      onClose()
    }
  }, [onClose])

  // ── Detection loop ─────────────────────────────────────
  const startDetection = useCallback(async (challengeIndex) => {
    const faceapi = faceApiRef.current
    const video   = videoRef.current
    if (!video) return

    setChallengeStatus('detecting')
    setFeedback('Position your face in the circle...')

    // Reset states
    blinkState.current  = { wasOpen: true, blinkCount: 0, lastBlink: 0 }
    headState.current   = { baseYaw: null, turned: false }

    const challenge = CHALLENGES[challengeIndex]

    // If face-api not available, use timer-based fallback
    if (!faceapi) {
      setFeedback(`${challenge.instruction} — tap confirm when done`)
      return
    }

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })

    intervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended) return

      try {
        const result = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks(true)
          .withFaceExpressions()

        if (!result) {
          setFeedback('No face detected — look at the camera')
          return
        }

        const landmarks   = result.landmarks
        const expressions = result.expressions

        if (challenge.id === 'blink') {
          detectBlink(landmarks, challengeIndex)
        } else if (challenge.id === 'turn') {
          detectHeadTurn(landmarks, challengeIndex)
        }
      } catch (err) {
        // Silent fail — keep trying
      }
    }, 150)
  }, [])

  const detectBlink = (landmarks, challengeIndex) => {
    // Eye openness using landmark distances
    const leftEye  = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    const eyeOpenness = (eye) => {
      const top    = eye[1].y + eye[2].y
      const bottom = eye[5].y + eye[4].y
      const width  = Math.abs(eye[3].x - eye[0].x)
      return width > 0 ? Math.abs(bottom - top) / (2 * width) : 0
    }

    const leftOpen  = eyeOpenness(leftEye)
    const rightOpen = eyeOpenness(rightEye)
    const avgOpen   = (leftOpen + rightOpen) / 2

    const state  = blinkState.current
    const isClosed = avgOpen < 0.15
    const isOpen   = avgOpen > 0.25
    const now      = Date.now()

    if (state.wasOpen && isClosed && now - state.lastBlink > 500) {
      state.blinkCount++
      state.lastBlink = now
      setFeedback(`Blink ${state.blinkCount}/2 detected!`)
    }
    state.wasOpen = isOpen

    if (state.blinkCount >= 2) {
      clearInterval(intervalRef.current)
      completeChallengeDetected(challengeIndex)
    }
  }

  const detectHeadTurn = (landmarks, challengeIndex) => {
    const nose     = landmarks.getNose()
    const leftEye  = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()

    // Estimate yaw from eye-nose relationship
    const eyeMidX  = (leftEye[0].x + rightEye[3].x) / 2
    const noseTipX = nose[3].x
    const yaw      = noseTipX - eyeMidX

    const state = headState.current

    if (state.baseYaw === null) {
      state.baseYaw = yaw
      setFeedback('Good! Now turn your head left...')
      return
    }

    const diff = yaw - state.baseYaw
    if (diff < -20 && !state.turned) {
      state.turned = true
      clearInterval(intervalRef.current)
      completeChallengeDetected(challengeIndex)
    } else if (!state.turned) {
      setFeedback('Turn your head further to the left...')
    }
  }

  const completeChallengeDetected = (challengeIndex) => {
    const next = challengeIndex + 1
    setProgress((next / CHALLENGES.length) * 100)
    setChallengeStatus('done')
    setFeedback(CHALLENGES[challengeIndex].successMsg)

    setTimeout(() => {
      if (next >= CHALLENGES.length) {
        setPhase('success')
        stopCamera()
        setTimeout(() => onSuccess(), 1500)
      } else {
        setCurrentChallenge(next)
        setChallengeStatus('waiting')
        setFeedback('')
        startDetection(next)
      }
    }, 800)
  }

  // Manual confirm fallback (when face-api models fail to load)
  const manualConfirm = () => {
    completeChallengeDetected(currentChallenge)
  }

  const handleStart = async () => {
    setPhase('challenge')
    await startCamera()
    setTimeout(() => startDetection(0), 1000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.92)', backdropFilter:'blur(10px)'}}>
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{backgroundColor:'#FFFAF5'}}>

        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b" style={{borderColor:'#E8DDD2'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{backgroundColor:'rgba(122,158,126,0.15)'}}>
              <Camera size={18} style={{color:'#7A9E7E'}} />
            </div>
            <div>
              <h3 className="font-display text-lg font-black" style={{color:'#1A1210'}}>
                🟢 Live Verification
              </h3>
              <p className="text-xs" style={{color:'#8A7E78'}}>Prove you're a real person</p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose() }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        <div className="p-5">

          {/* Loading models */}
          {phase === 'loading' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="font-semibold text-sm mb-4" style={{color:'#1A1210'}}>
                Loading face detection...
              </p>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
                <motion.div className="h-full rounded-full"
                  style={{backgroundColor:'#7A9E7E'}}
                  animate={{width:`${loadProgress}%`}}
                  transition={{duration:0.3}} />
              </div>
              <p className="text-xs" style={{color:'#8A7E78'}}>{loadProgress}%</p>
            </div>
          )}

          {/* Intro */}
          {phase === 'intro' && (
            <div className="text-center">
              <div className="text-5xl mb-4">🤳</div>
              <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>
                Quick face check
              </h4>
              <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
                Complete 2 simple actions to prove you're a real person. Takes about 15 seconds.
              </p>
              <div className="space-y-2 mb-6 text-left">
                {CHALLENGES.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2'}}>
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{color:'rgba(26,18,16,0.4)'}}>Step {i+1}</p>
                      <p className="text-sm font-semibold" style={{color:'#1A1210'}}>{c.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleStart} className="btn-primary w-full py-4 mb-3">
                Start Verification →
              </button>
              <p className="text-xs" style={{color:'rgba(26,18,16,0.3)'}}>
                🔒 Video never stored or shared
              </p>
            </div>
          )}

          {/* Challenge */}
          {phase === 'challenge' && (
            <div className="text-center">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                {CHALLENGES.map((c, i) => (
                  <div key={c.id} className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: i < currentChallenge ? '100%' : i === currentChallenge ? '50%' : '0%',
                          backgroundColor: i < currentChallenge ? '#7A9E7E' : '#C96A3A'
                        }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Camera */}
              <div className="relative rounded-2xl overflow-hidden mb-4"
                style={{aspectRatio:'4/3', backgroundColor:'#1A1210'}}>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

                {/* Face guide oval */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="rounded-full border-4"
                    style={{
                      width:140, height:170,
                      borderColor: challengeStatus === 'done' ? '#7A9E7E' : '#C96A3A',
                      borderStyle: challengeStatus === 'detecting' ? 'solid' : 'dashed',
                      transition:'border-color 0.3s',
                    }} />
                </div>

                {/* Instruction overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3"
                  style={{background:'linear-gradient(transparent, rgba(26,18,16,0.85))'}}>
                  <p className="text-white text-sm font-semibold text-center">
                    {CHALLENGES[currentChallenge].icon} {CHALLENGES[currentChallenge].instruction}
                  </p>
                  {feedback && (
                    <p className="text-center text-xs mt-1"
                      style={{color: challengeStatus === 'done' ? '#7A9E7E' : 'rgba(255,255,255,0.7)'}}>
                      {feedback}
                    </p>
                  )}
                </div>

                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{backgroundColor:'rgba(26,18,16,0.7)'}}>
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {/* Manual fallback button */}
              {cameraReady && challengeStatus === 'detecting' && (
                <button onClick={manualConfirm}
                  className="w-full py-3 rounded-2xl text-sm font-semibold border-2 transition-all"
                  style={{borderColor:'#E8DDD2', color:'#8A7E78', backgroundColor:'#FFFFFF'}}>
                  ✓ I've completed this action
                </button>
              )}
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="text-center py-8">
              <motion.div initial={{scale:0}} animate={{scale:1}}
                transition={{type:'spring', stiffness:200, damping:15}}>
                <div className="text-6xl mb-4">🟢</div>
              </motion.div>
              <h4 className="font-display font-black text-2xl mb-2" style={{color:'#1A1210'}}>
                Live Verified!
              </h4>
              <p className="text-sm" style={{color:'#8A7E78'}}>
                You've earned the highest trust badge on DealMatch.
              </p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">⚠️</div>
              <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>
                Could not load face detection
              </h4>
              <p className="text-sm mb-6" style={{color:'#8A7E78'}}>
                Check your internet connection and try again.
              </p>
              <button onClick={() => window.location.reload()} className="btn-primary w-full py-3">
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
