import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

type Category = 'All' | 'Ancient' | 'Modern' | 'Anime'

const slides = [
  {
    id: 'sun-tzu',
    person: 'Sun Tzu',
    era: 'Ancient strategist',
    category: 'Ancient',
    quote: 'The supreme excellence is breaking the enemy’s resistance without fighting.',
    source: 'The Art of War, Chapter III',
    quoteSource: 'https://en.wikiquote.org/wiki/Sun_Tzu',
    reflection: 'Good strategy begins before the visible contest. Study the terrain, prepare carefully, and spend effort where it can change the outcome.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/%E5%90%B4%E5%8F%B8%E9%A9%AC%E5%AD%99%E6%AD%A6.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Sun_Tzu',
  },
  {
    id: 'confucius',
    person: 'Confucius',
    era: 'Chinese philosopher',
    category: 'Ancient',
    quote: 'When you see a person of worth, think how you may equal them.',
    source: 'The Analects, Book IV',
    quoteSource: 'https://en.wikiquote.org/wiki/Confucius',
    reflection: 'Admiration can become a practice. Notice what you respect in another person, then turn that observation into one small habit of your own.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Confucius%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg/330px-Confucius%2C_fresco_from_a_Western_Han_tomb_of_Dongping_County%2C_Shandong_province%2C_China.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Confucius',
  },
  {
    id: 'marcus-aurelius',
    person: 'Marcus Aurelius',
    era: 'Roman emperor and Stoic',
    category: 'Ancient',
    quote: 'Waste no more time arguing what a good person should be. Be one.',
    source: 'Meditations, Book X.16',
    quoteSource: 'https://en.wikiquote.org/wiki/Marcus_Aurelius',
    reflection: 'Move from intention to a useful action. The next honest, careful step matters more than a perfect speech about the person you hope to become.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/MSR-ra-61-b-1-DM.jpg/330px-MSR-ra-61-b-1-DM.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Marcus_Aurelius',
  },
  {
    id: 'miyamoto-musashi',
    person: 'Miyamoto Musashi',
    era: 'Japanese strategist and writer',
    category: 'Ancient',
    quote: 'From one thing, know ten thousand things.',
    source: 'The Book of Five Rings, Ground Book',
    quoteSource: 'https://en.wikiquote.org/wiki/Miyamoto_Musashi',
    reflection: 'Learn the principle beneath the example. A skill becomes durable when you can carry it into a new problem, not just repeat it in familiar conditions.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Portrait_of_Miyamoto_Musashi_%28detail%29.webp/330px-Portrait_of_Miyamoto_Musashi_%28detail%29.webp',
    imageSource: 'https://en.wikipedia.org/wiki/Miyamoto_Musashi',
  },
  {
    id: 'mahatma-gandhi',
    person: 'Mahatma Gandhi',
    era: 'Indian independence leader',
    category: 'Modern',
    quote: 'A man is but the product of his thoughts. What he thinks, he becomes.',
    source: 'Ethical Religion (1922), p. 62',
    quoteSource: 'https://en.wikiquote.org/wiki/Mahatma_Gandhi',
    reflection: 'Attention shapes direction. Choose one thought worth returning to today, then let your work make that value visible.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Mahatma-Gandhi%2C_studio%2C_1931.jpg/330px-Mahatma-Gandhi%2C_studio%2C_1931.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Mahatma_Gandhi',
  },
  {
    id: 'maya-angelou',
    person: 'Maya Angelou',
    era: 'Writer and poet',
    category: 'Modern',
    quote: 'But still, like dust, I’ll rise.',
    source: '“Still I Rise,” And Still I Rise (1978)',
    quoteSource: 'https://en.wikiquote.org/wiki/Maya_Angelou',
    reflection: 'A setback can be part of the story without becoming its ending. Keep the next attempt small enough to begin, and meaningful enough to matter.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Angelou_at_Clinton_inauguration_%28cropped_2%29.jpg/330px-Angelou_at_Clinton_inauguration_%28cropped_2%29.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Maya_Angelou',
  },
  {
    id: 'nelson-mandela',
    person: 'Nelson Mandela',
    era: 'South African leader',
    category: 'Modern',
    quote: 'Education is the great engine of personal development.',
    source: 'Long Walk to Freedom (1995)',
    quoteSource: 'https://en.wikiquote.org/wiki/Nelson_Mandela',
    reflection: 'Large changes are hard to picture before people begin them together. Break the distant goal into work that can be shared and started now.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Nelson_Mandela_1994.jpg/330px-Nelson_Mandela_1994.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Nelson_Mandela',
  },
  {
    id: 'katherine-johnson',
    person: 'Katherine Johnson',
    era: 'NASA mathematician',
    category: 'Modern',
    quote: 'I like to learn. That’s an art and a science.',
    source: 'Interview quotes collected by Wikiquote',
    quoteSource: 'https://en.wikiquote.org/wiki/Katherine_Johnson',
    reflection: 'Curiosity is useful work. Ask the next question, check the result, and keep learning until the problem becomes clear enough to solve.',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Katherine_Johnson_1983.jpg/330px-Katherine_Johnson_1983.jpg',
    imageSource: 'https://en.wikipedia.org/wiki/Katherine_Johnson',
  },
  {
    id: 'naruto',
    person: 'Naruto Uzumaki',
    era: 'Anime character · Naruto',
    category: 'Anime',
    quote: 'I’m not gonna run away. I never go back on my word.',
    source: 'Naruto, character dialogue',
    quoteSource: 'https://en.wikipedia.org/wiki/Naruto_Uzumaki',
    reflection: 'Determination is not pretending that things are easy. It is choosing a next move, asking for help when you need it, and staying accountable to what matters.',
    image: 'https://upload.wikimedia.org/wikipedia/en/9/9a/NarutoUzumaki.png',
    imageSource: 'https://en.wikipedia.org/wiki/Naruto_Uzumaki',
  },
  {
    id: 'luffy',
    person: 'Monkey D. Luffy',
    era: 'Anime character · One Piece',
    category: 'Anime',
    quote: 'I’m gonna be King of the Pirates!',
    source: 'One Piece, character dialogue',
    quoteSource: 'https://en.wikipedia.org/wiki/Monkey_D._Luffy',
    reflection: 'A bold goal gives a crew a direction. Progress still comes from trust, shared effort, and taking the next stretch of the journey together.',
    image: 'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
    imageSource: 'https://en.wikipedia.org/wiki/Monkey_D._Luffy',
  },
]

const categories: Category[] = ['All', 'Ancient', 'Modern', 'Anime']

function MotivationSlideshow() {
  const [category, setCategory] = useState<Category>('All')
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const visibleSlides = slides.filter((slide) => category === 'All' || slide.category === category)
  const active = visibleSlides[index] ?? visibleSlides[0]

  useEffect(() => {
    if (isPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % visibleSlides.length), 8000)
    return () => window.clearInterval(timer)
  }, [isPaused, visibleSlides.length])

  const move = (direction: number) => {
    setIndex((current) => (current + direction + visibleSlides.length) % visibleSlides.length)
  }

  const selectCategory = (next: Category) => {
    setCategory(next)
    setIndex(0)
  }

  if (!active) return null

  return (
    <section aria-label="Motivation slideshow" className="overflow-hidden rounded-xl bg-[#172322] text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7">
        <div>
          <p className="text-xs font-semibold uppercase text-amber-300">Motivation wall</p>
          <h3 className="mt-1 text-xl font-extrabold">Words for the work ahead</h3>
        </div>
        <div className="flex flex-wrap gap-1 rounded-md bg-white/5 p-1" aria-label="Filter quotes">
          {categories.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => selectCategory(item)} className={`rounded px-3 py-1.5 text-xs font-semibold ${category === item ? 'bg-amber-300 text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div key={active.id} className="grid min-h-[22rem] md:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-64 overflow-hidden bg-slate-800 md:min-h-full">
          <img src={active.image} alt={`Portrait or character image of ${active.person}`} className="absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <p className="text-xs font-semibold uppercase text-amber-300">{active.era}</p>
            <h4 className="mt-1 text-2xl font-black">{active.person}</h4>
            <a href={active.imageSource} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-white/75 underline decoration-white/40 underline-offset-4 hover:text-white">
              Image and biography source
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-7 p-5 md:p-8">
          <div aria-live="polite" aria-atomic="true">
            <p className="text-xs font-semibold uppercase text-amber-300">{active.category} · {index + 1} of {visibleSlides.length}</p>
            <blockquote className="mt-4 text-2xl font-extrabold leading-tight md:text-3xl">“{active.quote}”</blockquote>
            <p className="mt-3 text-xs text-slate-300">{active.source}</p>
            <h5 className="mt-7 text-xs font-bold uppercase text-amber-300">Reflection</h5>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">{active.reflection}</p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <a href={active.quoteSource} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-300 underline decoration-white/30 underline-offset-4 hover:text-white">
              Quote attribution source
            </a>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous quote" title="Previous quote" onClick={() => move(-1)} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white hover:bg-white/10">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'} title={isPaused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setIsPaused((paused) => !paused)} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white hover:bg-white/10">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button type="button" aria-label="Next quote" title="Next quote" onClick={() => move(1)} className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white hover:bg-white/10">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MotivationSlideshow