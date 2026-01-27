import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Feed } from './Feed'

describe('Feed', () => {
  const mockTweets = [
    {
      id: '1',
      content: 'First tweet',
      userId: 'user1',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      content: 'Second tweet',
      userId: 'user2',
      createdAt: new Date().toISOString(),
    },
  ]

  it('should render list of Tweet components', () => {
    render(<Feed tweets={mockTweets} loading={false} />)

    expect(screen.getByText('First tweet')).toBeInTheDocument()
    expect(screen.getByText('Second tweet')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<Feed tweets={[]} loading={true} />)

    expect(screen.getByTestId('feed-loading')).toBeInTheDocument()
  })

  it('should show empty state when no tweets', () => {
    render(<Feed tweets={[]} loading={false} />)

    expect(screen.getByTestId('feed-empty')).toBeInTheDocument()
  })
})
