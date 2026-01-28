import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TweetComposer, Feed, ProtectedRoute } from './components'
import { useTweets } from './hooks'
import { AuthProvider, useAuth } from './contexts'
import { LoginPage, RegisterPage } from './pages'
import './index.css'

function HomePage() {
  const { tweets, isLoading, postTweet, likeTweet, unlikeTweet } = useTweets()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-xl mx-auto bg-white min-h-screen shadow-sm">
        <header className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-500">twitter.net</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.displayName || user?.username}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </header>
        <TweetComposer onSubmit={postTweet} />
        <Feed tweets={tweets} isLoading={isLoading} onLike={likeTweet} onUnlike={unlikeTweet} />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
