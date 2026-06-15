import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Link } from 'react-router-dom'
import type { House, VoteType } from '../types'

interface SwipeCardProps {
  house: House
  current_vote: VoteType | null
  on_vote: (house_id: string, vote_type: VoteType) => void
}

export function SwipeCard({ house, current_vote, on_vote }: SwipeCardProps) {
  const [swipe_offset, set_swipe_offset] = useState(0)
  const [swipe_direction, set_swipe_direction] = useState<'left' | 'right' | null>(null)
  const [image_index, set_image_index] = useState(0)

  const handle_vote = (vote_type: VoteType) => {
    set_swipe_direction(vote_type === 'match' ? 'right' : 'left')
    setTimeout(() => {
      on_vote(house.id, vote_type)
      set_swipe_offset(0)
      set_swipe_direction(null)
    }, 300)
  }

  const handlers = useSwipeable({
    onSwiping: (e) => set_swipe_offset(e.deltaX),
    onSwipedLeft: () => handle_vote('dislike'),
    onSwipedRight: () => handle_vote('match'),
    trackMouse: true,
  })

  const images = house.screenshot_urls.length > 0 ? house.screenshot_urls : []

  const transform =
    swipe_direction === 'right'
      ? 'translateX(150%) rotate(20deg)'
      : swipe_direction === 'left'
        ? 'translateX(-150%) rotate(-20deg)'
        : `translateX(${swipe_offset}px) rotate(${swipe_offset * 0.05}deg)`

  return (
    <div className="max-w-md mx-auto">
      <div
        {...handlers}
        className="relative bg-tibia-panel rounded-2xl border border-amber-800/30 overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing transition-transform duration-300"
        style={{ transform, opacity: swipe_direction ? 0.5 : 1 }}
      >
        {swipe_offset > 50 && (
          <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-lg border-4 border-green-500 text-green-500 font-bold text-2xl rotate-[-15deg]">
            MATCH
          </div>
        )}
        {swipe_offset < -50 && (
          <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-lg border-4 border-red-500 text-red-500 font-bold text-2xl rotate-[15deg]">
            NOPE
          </div>
        )}

        {images.length > 0 ? (
          <div className="aspect-[3/4] relative bg-black/40">
            <img
              src={images[image_index]}
              alt={house.custom_name}
              className="w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => set_image_index(i)}
                    className={`w-2 h-2 rounded-full ${i === image_index ? 'bg-tibia-gold' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center text-8xl bg-tibia-dark">
            🏠
          </div>
        )}

        <div className="p-5">
          <Link to={`/house/${house.id}`} className="hover:underline">
            <h3 className="text-xl font-bold text-tibia-gold">{house.custom_name}</h3>
          </Link>
          <p className="text-sm text-amber-200/70 mt-1 italic">"{house.theme}"</p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-amber-200/50">
            <span>📍 {house.location}</span>
            <span>🏢 {house.floor}</span>
            <span>🎯 {house.dummies_count} dummies</span>
            <span>👥 {house.hirelings_count} hirelings</span>
          </div>
          {house.honorable_mention && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-tibia-gold/20 text-tibia-gold text-xs">
              🎖️ Menção Honrosa
            </span>
          )}
          {current_vote && (
            <p className="mt-2 text-xs text-amber-200/40">
              O seu voto atual: {current_vote === 'match' ? '❤️ Match' : '👎 Dislike'}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <button
          onClick={() => handle_vote('dislike')}
          className="w-16 h-16 rounded-full bg-tibia-red/80 hover:bg-tibia-red text-2xl shadow-lg transition-all hover:scale-110"
          aria-label="Dislike"
        >
          👎
        </button>
        <button
          onClick={() => handle_vote('match')}
          className="w-16 h-16 rounded-full bg-tibia-green/80 hover:bg-tibia-green text-2xl shadow-lg transition-all hover:scale-110"
          aria-label="Match"
        >
          ❤️
        </button>
      </div>
    </div>
  )
}
