import SectionHeading from './SectionHeading'

function Workflow({ workflow }) {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered
          eyebrow="System process"
          title="From scheduled meeting to archived record"
          text="Create and schedule the meeting, define agenda details, invite people, capture minutes, assign tasks, and keep the record available through reports and search."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3 xl:grid-cols-6">
          {workflow.map((step, index) => (
            <div
              key={step.id}
              className="group relative min-h-[140px] rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                {index + 1}
              </div>
              <p className="mt-4 text-sm font-bold leading-relaxed text-slate-900 group-hover:text-blue-600">
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Workflow
