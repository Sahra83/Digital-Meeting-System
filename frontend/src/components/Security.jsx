import Icon from './Icon'
import SectionHeading from './SectionHeading'

function Security({ features }) {
  const securityFeatures = features.slice(-4)

  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <SectionHeading
          eyebrow="Why choose this system"
          title="Collaboration, accountability, retrieval, and security in one workflow"
          text="The modules work together to reduce scattered meeting records, missed action items, weak follow-up, and difficult retrieval of past meeting information."
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {securityFeatures.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-slate-100 py-4 last:border-0">
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-700 text-white">
                <Icon name={item.icon_name} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Security
