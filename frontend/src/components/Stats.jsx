function Stats({ statistics }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((stat) => (
            <div
              key={stat.metric_key}
              className="rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300"
            >
              <p className="text-4xl font-semibold text-blue-700">{stat.metric_value}</p>
              <h3 className="mt-3 font-semibold text-slate-950">{stat.label}</h3>
              <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
