import { useState } from 'react'
import About from '../components/About'
import CallToAction from '../components/CallToAction'
import Features from '../components/Features'
import Hero from '../components/Hero'
import Security from '../components/Security'
import Stats from '../components/Stats'
import Workflow from '../components/Workflow'

// Static data for frontend-only mode
const STATIC_FEATURES = [
  { id: 1, title: 'User Management', description: 'User registration and authentication, role-based access control, Admin, Meeting Organizer, and Participant roles, and profile management.', icon_name: 'users' },
  { id: 2, title: 'Meeting Scheduling', description: 'Create meetings, define meeting agenda, set date, time, and location, invite participants, and send meeting notifications.', icon_name: 'calendar' },
  { id: 3, title: 'Meeting Minutes Recording', description: 'Create and edit meeting minutes, use a structured minutes template, and record discussion points, decisions, and action items.', icon_name: 'minutes' },
  { id: 4, title: 'Real-Time Collaboration', description: 'Multiple participants can contribute to minutes, comment on meeting points, and use discussion threads.', icon_name: 'collab' },
  { id: 5, title: 'Action Item Management', description: 'Assign tasks to participants, set deadlines, track task progress, and mark tasks as completed.', icon_name: 'tasks' },
  { id: 6, title: 'Security and Access Control', description: 'Provide secure authentication, role-based permissions, and secure document storage.', icon_name: 'shield' },
]

const STATIC_WORKFLOW = [
  { id: 1, label: 'Register and authenticate users', display_order: 1 },
  { id: 2, label: 'Assign role-based access', display_order: 2 },
  { id: 3, label: 'Create meetings and define agenda', display_order: 3 },
  { id: 4, label: 'Invite participants and send notifications', display_order: 4 },
  { id: 5, label: 'Record minutes, decisions, and action items', display_order: 5 },
  { id: 6, label: 'Track tasks, reports, and secure records', display_order: 6 },
]

const STATIC_STATISTICS = [
  { metric_key: 'roles', label: 'Core roles', metric_value: '3', detail: 'Admin, Meeting Organizer, Participant' },
  { metric_key: 'filters', label: 'Search filters', metric_value: '4', detail: 'Date, organizer, project, participant' },
  { metric_key: 'exports', label: 'Export formats', metric_value: '2', detail: 'PDF and Word reports' },
  { metric_key: 'modules', label: 'System modules', metric_value: '12', detail: 'From user management to secure access control' },
]

function Home() {
  // Use static data directly to fulfill "only frontend" requirement for landing page
  const features = STATIC_FEATURES
  const workflow = STATIC_WORKFLOW
  const statistics = STATIC_STATISTICS

  return (
    <main>
      <Hero highlights={features} statistics={statistics} />
      <Features features={features} />
      <About features={features} />
      <Workflow workflow={workflow} />
      <Stats statistics={statistics} />
      <Security features={features} />
      <CallToAction />
    </main>
  )
}

export default Home
