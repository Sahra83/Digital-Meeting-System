function SectionHeading({ eyebrow, title, text, centered = false, inverted = false }) {
  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} max-w-3xl`}>
      <p className={`text-sm font-semibold uppercase tracking-widest ${inverted ? 'text-blue-200' : 'text-blue-700'}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${inverted ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h2>
      <p className={`mt-4 text-base leading-8 ${inverted ? 'text-slate-300' : 'text-slate-600'}`}>
        {text}
      </p>
    </div>
  )
}

export default SectionHeading
