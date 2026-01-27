import { TweetComposer, Feed } from './components'
import { useTweets } from './hooks'
import './index.css'

function App() {
  const { tweets, isLoading, postTweet } = useTweets()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-xl mx-auto bg-white min-h-screen shadow-sm">
        <header className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-500">twitter.net</h1>
        </header>
        <TweetComposer onSubmit={postTweet} />
        <Feed tweets={tweets} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default App
