import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedParticipantRoute from './components/ProtectedParticipantRoute'
import ParticipantLayout from "./layouts/ParticipantLayout.jsx";
import ParticipantDashboard from './pages/ParticipantDashboard'
import MeetingDetails from './pages/MeetingDetails'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import ParticipantProfile from './pages/ParticipantProfile'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import MeetingManagement from './pages/MeetingManagement'
import AssignedTasksPage from './components/AssignedTasksPage'
import MyTasks from './pages/MyTasks'
import Collaboration from './pages/Collaboration'
import MyMeetings from './pages/MyMeetings'
import MeetingReports from './pages/MeetingReports'
import UserLogs from './pages/UserLogs'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard/overview" element={<Dashboard />} />
            <Route path="/dashboard/users" element={<UserManagement />} />
            <Route path="/dashboard/meetings" element={<MeetingManagement />} />
            <Route path="/dashboard/reports" element={<MeetingReports />} />
            <Route path="/dashboard/user-logs" element={<UserLogs />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/collaboration" element={<Collaboration />} />
            <Route path="/dashboard/tasks" element={<AssignedTasksPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedParticipantRoute/>}>
          <Route element={<ParticipantLayout/>}>
            <Route path="/participant/dashboard" element={<ParticipantDashboard/>} />
            <Route path="/participant/meetings" element={<MyMeetings/>} />
            <Route path="/participant/meetings/:id" element={<MeetingDetails/>} />
            <Route path="/participant/tasks" element={<MyTasks/>} />
            <Route path="/participant/profile" element={<ParticipantProfile/>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
