type Quote = {
  person: string
  title: string
  quote: string
  image: string
}

type InspirationalQuotesProps = {
  quotes: Quote[]
  heading?: string
  eyebrow?: string
  className?: string
}

export const inspirationalPortraits = {
  sunTzu: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/%E5%90%B4%E5%8F%B8%E9%A9%AC%E5%AD%99%E6%AD%A6.jpg',
  confucius: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/%E5%AD%94%E5%AD%90%E7%87%95%E5%B1%85%E5%83%8F.jpg',
  mencius: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Mencius.jpg',
  naruto: 'https://naruto-official.com/anime/series/naruto1_visual.webp',
  luffy: 'https://www.onepiece-film.jp/wordpress/wp-content/themes/onepiece-film-red/common/character/chara03.png',
  warrenBuffett: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit.jpg',
}

export default function InspirationalQuotes({ quotes, heading = 'Wisdom for the road ahead', eyebrow = 'Words to build by', className = '' }: InspirationalQuotesProps) {
  return (
    <section className={`rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-extrabold text-slate-900">{heading}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quotes.map((note) => (
          <article key={`${note.person}-${note.quote}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
            <div className="relative h-36 overflow-hidden rounded-2xl bg-orange-100">
              <div aria-hidden="true" className="flex h-full items-center justify-center text-3xl font-extrabold text-orange-700">
                {note.person.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
              </div>
              <img src={note.image} alt={`Portrait of ${note.person}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full object-cover object-top" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">{note.title}</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-900">{note.person}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">“{note.quote}”</p>
          </article>
        ))}
      </div>
    </section>
  )
}
