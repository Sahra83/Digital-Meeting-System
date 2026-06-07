import Icon from './Icon'
import SectionHeading from './SectionHeading'

function About({ features }) {
  const visibleFeatures = features.slice(0, 4)

  return (
    <section id="about" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="About the system"
          title="Structured, searchable, collaborative, and accountable meeting records"
          text="The system turns meeting management into a connected digital process: meetings are scheduled with agendas, participants are invited and notified, minutes are recorded in a structured format, and follow-up work is tracked through action items."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleFeatures.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-blue-300"
            >
              <Icon name="shield" className="h-5 w-5 text-blue-700" />
              <h3 className="mt-4 text-sm font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About
