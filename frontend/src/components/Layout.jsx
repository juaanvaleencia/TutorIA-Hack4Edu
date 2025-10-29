import { Outlet, Link, useLocation } from 'react-router-dom'
import { MessageCircle, BookOpen, CreditCard, TrendingUp, Settings, GraduationCap, FileText, Users, ClipboardList } from 'lucide-react'

function Layout({ student }) {
  const location = useLocation()

  // Navegación para estudiantes
  const studentNavigation = [
    { name: 'Chat', path: '/chat', icon: MessageCircle },
    { name: 'Mis Temas', path: '/mis-temas', icon: FileText },
    { name: 'Actividades', path: '/actividades', icon: ClipboardList },
    { name: 'Juegos', path: '/juegos', icon: BookOpen },
    { name: 'Tarjetas', path: '/cards', icon: CreditCard },
    { name: 'Progreso', path: '/progress', icon: TrendingUp },
    { name: 'Ajustes', path: '/settings', icon: Settings },
  ]

  // Navegación para profesores
  const teacherNavigation = [
    { name: 'Mis Clases', path: '/teacher-dashboard', icon: Users },
    { name: 'Chat', path: '/chat', icon: MessageCircle },
    { name: 'Mis Temas', path: '/mis-temas', icon: FileText },
    { name: 'Juegos', path: '/juegos', icon: BookOpen },
    { name: 'Tarjetas', path: '/cards', icon: CreditCard },
    { name: 'Ajustes', path: '/settings', icon: Settings },
  ]

  const navigation = student?.role === 'teacher' ? teacherNavigation : studentNavigation

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/tutoria-logo.png" 
                alt="TutorIA Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">TutorIA</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{student?.name}</p>
                <p className="text-xs text-gray-500">
                  {student?.role === 'teacher' ? '👨‍🏫 Profesor' : `🎓 ${student?.education_level || 'Estudiante'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

