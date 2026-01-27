import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTweets } from './useTweets'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useTweets', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should fetch tweets on mount', async () => {
    const mockTweets = [
      { id: '1', content: 'Hello', userId: 'user1', createdAt: new Date().toISOString() },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTweets),
    })

    const { result } = renderHook(() => useTweets())

    await waitFor(() => {
      expect(result.current.tweets).toEqual(mockTweets)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/tweets')
  })

  it('should provide postTweet function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const { result } = renderHook(() => useTweets())

    expect(typeof result.current.postTweet).toBe('function')
  })

  it('should update tweets after posting', async () => {
    const initialTweets = [
      { id: '1', content: 'Hello', userId: 'user1', createdAt: new Date().toISOString() },
    ]
    const newTweet = { id: '2', content: 'New tweet', userId: 'user1', createdAt: new Date().toISOString() }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialTweets),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTweet),
      })

    const { result } = renderHook(() => useTweets())

    await waitFor(() => {
      expect(result.current.tweets).toEqual(initialTweets)
    })

    await act(async () => {
      await result.current.postTweet('New tweet')
    })

    await waitFor(() => {
      expect(result.current.tweets).toContainEqual(newTweet)
    })
  })
})
