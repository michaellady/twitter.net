import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TweetComposer } from './TweetComposer'

describe('TweetComposer', () => {
  it('should render text input and Tweet button', () => {
    render(<TweetComposer onSubmit={vi.fn()} />)

    expect(screen.getByTestId('tweet-input')).toBeInTheDocument()
    expect(screen.getByTestId('tweet-button')).toBeInTheDocument()
  })

  it('should update character count as user types', async () => {
    const user = userEvent.setup()
    render(<TweetComposer onSubmit={vi.fn()} />)

    const input = screen.getByTestId('tweet-input')
    await user.type(input, 'Hello')

    expect(screen.getByTestId('char-counter')).toHaveTextContent('5/140')
  })

  it('should disable button when empty', () => {
    render(<TweetComposer onSubmit={vi.fn()} />)

    const button = screen.getByTestId('tweet-button')
    expect(button).toBeDisabled()
  })

  it('should disable button when > 140 chars', async () => {
    const user = userEvent.setup()
    render(<TweetComposer onSubmit={vi.fn()} />)

    const input = screen.getByTestId('tweet-input')
    const longText = 'a'.repeat(141)
    await user.type(input, longText)

    const button = screen.getByTestId('tweet-button')
    expect(button).toBeDisabled()
  })

  it('should call onSubmit with content when submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TweetComposer onSubmit={onSubmit} />)

    const input = screen.getByTestId('tweet-input')
    await user.type(input, 'Hello world!')

    const button = screen.getByTestId('tweet-button')
    await user.click(button)

    expect(onSubmit).toHaveBeenCalledWith('Hello world!', undefined)
  })

  it('should clear input after successful submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TweetComposer onSubmit={onSubmit} />)

    const input = screen.getByTestId('tweet-input')
    await user.type(input, 'Hello world!')
    await user.click(screen.getByTestId('tweet-button'))

    expect(input).toHaveValue('')
  })
})
