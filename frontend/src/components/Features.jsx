import Icon from './Icon'
import SectionHeading from './SectionHeading'

function Features({ features }) {
  return (
    <section id="features" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered
          eyebrow="System features"
          title="A complete meeting minutes and collaboration platform"
          text="The system demonstrates practical meeting management through scheduling, structured records, collaboration, search, reporting, and secure access."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
                <Icon name={feature.icon_name} className="h-6 w-6" />
              </span>
              <h3 className="mt-6 text-xl font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
