import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTweets } from './useTweets'

const mockTweets = [
  { id: '1', content: 'First tweet', userId: 'user1', createdAt: new Date().toISOString() },
  { id: '2', content: 'Second tweet', userId: 'user2', createdAt: new Date().toISOString() },
]

describe('useTweets', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch tweets on mount', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTweets),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useTweets())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/feed'))
    expect(result.current.tweets).toEqual(mockTweets)
  })

  it('should provide postTweet function', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTweets),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '3', content: 'New tweet' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([...mockTweets, { id: '3', content: 'New tweet', userId: 'user1', createdAt: new Date().toISOString() }]),
      })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useTweets())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.postTweet).toBe('function')

    await act(async () => {
      await result.current.postTweet('New tweet')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tweets'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'New tweet' }),
      })
    )
  })

  it('should update tweets after posting', async () => {
    const newTweet = { id: '3', content: 'New tweet', userId: 'user1', createdAt: new Date().toISOString() }
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTweets),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTweet),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([...mockTweets, newTweet]),
      })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useTweets())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.postTweet('New tweet')
    })

    await waitFor(() => {
      expect(result.current.tweets).toHaveLength(3)
    })
  })
})
