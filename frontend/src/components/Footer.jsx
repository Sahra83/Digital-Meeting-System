import { Link } from 'react-router-dom'
import { navItems } from '../utils/navigation'

function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1.3fr_0.7fr_0.7fr] lg:px-8">
        <div>
          <p className="font-semibold text-slate-950">Digital Meeting Minutes Management and Collaboration System</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            A React, Node.js, PostgreSQL, and Tailwind CSS system for meeting scheduling, minutes recording,
            collaboration, reporting, analytics, and secure access control.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-950">Quick links</p>
          <div className="mt-3 grid gap-2">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-slate-500 transition hover:text-blue-700">
                {item.label}
              </a>
            ))}
            <Link to="/login" className="text-sm text-slate-500 transition hover:text-blue-700">
              Login
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-950">Contact</p>
          <div className="mt-3 grid gap-2 text-sm">
            <a className="text-slate-500 transition hover:text-blue-700" href="mailto:info@digitalminutes.local">
              info@digitalminutes.local
            </a>
            <a className="text-slate-500 transition hover:text-blue-700" href="/#contact">
              LinkedIn
            </a>
            <a className="text-slate-500 transition hover:text-blue-700" href="/#contact">
              X
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
        Copyright 2026 Digital Meeting Minutes Management and Collaboration System. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
