import { Link } from 'react-router-dom'
import Icon from './Icon'

function Hero({ highlights = [], statistics = [] }) {
  const visibleHighlights = highlights.slice(0, 3)
  const visibleStatistics = statistics.slice(0, 2)

  return (
    <section id="home" className="overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
            <Icon name="shield" className="h-4 w-4" />
            Secure collaboration for meeting records
          </div>
          <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Digital Meeting Minutes Management and Collaboration System
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A modern web platform for scheduling meetings, recording structured minutes, collaborating in real time,
            assigning action items, managing documents, retrieving past records, and protecting access through secure
            role-based permissions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#features"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Explore features
              <Icon name="arrow" className="h-4 w-4" />
            </a>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:border-blue-700 hover:text-blue-700"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Project Review Meeting</p>
                <p className="text-xs text-slate-500">Agenda, minutes, tasks, and reports</p>
              </div>
              <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">Live</span>
            </div>
            <div className="grid gap-3">
              {visibleHighlights.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {visibleStatistics.map((stat) => (
                <div key={stat.metric_key} className="rounded-lg bg-white p-4">
                  <p className="text-2xl font-semibold text-slate-950">{stat.metric_value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
