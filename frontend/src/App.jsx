import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Juegos from './pages/Juegos'
import MisTemas from './pages/MisTemas'
import StudyCards from './pages/StudyCards'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import TeacherDashboard from './pages/TeacherDashboard'
import Actividades from './pages/Actividades'

function App() {
  const [student, setStudent] = useState(null)

  useEffect(() => {
    // Cargar estudiante del localStorage
    const savedStudent = localStorage.getItem('student')
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent))
    }
  }, [])

  const handleSetStudent = (studentData) => {
    setStudent(studentData)
    localStorage.setItem('student', JSON.stringify(studentData))
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home student={student} setStudent={handleSetStudent} />} />
        <Route element={<Layout student={student} />}>
          <Route path="/chat" element={student ? <Chat student={student} /> : <Navigate to="/" />} />
          <Route path="/juegos" element={student ? <Juegos student={student} /> : <Navigate to="/" />} />
          <Route path="/mis-temas" element={student ? <MisTemas student={student} /> : <Navigate to="/" />} />
          <Route path="/cards" element={student ? <StudyCards student={student} /> : <Navigate to="/" />} />
          <Route path="/actividades" element={student ? <Actividades student={student} /> : <Navigate to="/" />} />
          <Route path="/progress" element={student ? <Progress student={student} /> : <Navigate to="/" />} />
          <Route path="/teacher-dashboard" element={student && student.role === 'teacher' ? <TeacherDashboard student={student} /> : <Navigate to="/" />} />
          <Route path="/settings" element={student ? <Settings student={student} setStudent={handleSetStudent} /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

