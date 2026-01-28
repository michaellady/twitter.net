import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Tweet } from './Tweet'

describe('Tweet', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display tweet content', () => {
    const tweet = {
      id: '1',
      content: 'Hello, Twitter!',
      userId: 'user123',
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLikedByCurrentUser: false,
    }

    render(<Tweet tweet={tweet} />)

    expect(screen.getByTestId('tweet-content')).toHaveTextContent('Hello, Twitter!')
  })

  it('should display relative timestamp (e.g., "2m ago")', () => {
    const twoMinutesAgo = new Date('2024-01-15T11:58:00Z').toISOString()
    const tweet = {
      id: '1',
      content: 'Test tweet',
      userId: 'user123',
      createdAt: twoMinutesAgo,
      likeCount: 0,
      isLikedByCurrentUser: false,
    }

    render(<Tweet tweet={tweet} />)

    expect(screen.getByTestId('tweet-timestamp')).toHaveTextContent('2m ago')
  })

  it('should display user identifier', () => {
    const tweet = {
      id: '1',
      content: 'Test tweet',
      userId: 'johndoe',
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLikedByCurrentUser: false,
    }

    render(<Tweet tweet={tweet} />)

    expect(screen.getByTestId('tweet-user')).toHaveTextContent('johndoe')
  })
})
