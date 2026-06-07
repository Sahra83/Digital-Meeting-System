import { Link } from 'react-router-dom'
import Icon from './Icon'

function CallToAction() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl bg-blue-700 px-6 py-12 text-center text-white sm:px-10">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Start managing meeting minutes as a connected digital record.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-blue-100">
          Schedule meetings, record decisions, assign follow-up tasks, secure documents, and retrieve meeting history from one modern platform.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
        >
          Get started
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

export default CallToAction
