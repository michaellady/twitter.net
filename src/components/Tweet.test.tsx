import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tweet } from './Tweet'

describe('Tweet', () => {
  const mockTweet = {
    id: '1',
    content: 'Hello, world!',
    userId: 'user123',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  }

  it('should display tweet content', () => {
    render(<Tweet tweet={mockTweet} />)

    expect(screen.getByText('Hello, world!')).toBeInTheDocument()
  })

  it('should display relative timestamp (e.g., "2m ago")', () => {
    render(<Tweet tweet={mockTweet} />)

    expect(screen.getByTestId('tweet-timestamp')).toHaveTextContent(/2m ago/i)
  })

  it('should display user identifier', () => {
    render(<Tweet tweet={mockTweet} />)

    expect(screen.getByTestId('tweet-user')).toHaveTextContent('user123')
  })
})
