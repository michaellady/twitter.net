import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Feed } from './Feed'

describe('Feed', () => {
  it('should render list of Tweet components', () => {
    const tweets = [
      { id: '1', content: 'First tweet', userId: 'user1', createdAt: new Date().toISOString() },
      { id: '2', content: 'Second tweet', userId: 'user2', createdAt: new Date().toISOString() },
    ]

    render(<Feed tweets={tweets} isLoading={false} />)

    const tweetElements = screen.getAllByTestId('tweet')
    expect(tweetElements).toHaveLength(2)
  })

  it('should show loading state', () => {
    render(<Feed tweets={[]} isLoading={true} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should show empty state when no tweets', () => {
    render(<Feed tweets={[]} isLoading={false} />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
