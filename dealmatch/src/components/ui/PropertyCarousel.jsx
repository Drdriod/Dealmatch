import { useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import clsx from 'clsx'

export default function PropertyCarousel({ images = [], title = '', height = '320px' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [current, setCurrent]   = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const scrollPrev = useCallback(() => {
    if (emblaApi) { emblaApi.scrollPrev(); setCurrent(emblaApi.selectedScrollSnap()) }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) { emblaApi.scrollNext(); setCurrent(emblaApi.selectedScrollSnap()) }
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (emblaApi) setCurrent(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  // Fallback when no images
  if (!images.length) {
    return (
      <div className="w-full flex items-center justify-center bg-gradient-to-br from-blush to-terracotta/20 rounded-t-3xl text-7xl"
        style={{ height }}>
        🏡
      </div>
    )
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-t-3xl group" style={{ height }}>
        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden h-full" onMouseUp={onSelect}>
          <div className="flex h-full">
            {images.map((img, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
                <img
                  src={img.url}
                  alt={`${title} - photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls — show on hover */}
        {images.length > 1 && (
          <>
            <button onClick={scrollPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
              <ChevronLeft size={18} className="text-deep" />
            </button>
            <button onClick={scrollNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
              <ChevronRight size={18} className="text-deep" />
            </button>
          </>
        )}

        {/* Expand button */}
        <button onClick={() => setLightbox(current)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
          <Expand size={14} className="text-white" />
        </button>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => { emblaApi?.scrollTo(i); setCurrent(i) }}
                className={clsx('rounded-full transition-all', i === current ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5')} />
            ))}
          </div>
        )}

        {/* Photo count */}
        <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <img
            src={images[lightbox]?.url}
            alt={title}
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length) }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length) }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
