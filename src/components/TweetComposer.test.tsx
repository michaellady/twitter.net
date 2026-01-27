import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TweetComposer } from './TweetComposer'

describe('TweetComposer', () => {
  it('should render text input and Tweet button', () => {
    render(<TweetComposer onSubmit={() => {}} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tweet/i })).toBeInTheDocument()
  })

  it('should update character count as user types', () => {
    render(<TweetComposer onSubmit={() => {}} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Hello' } })

    expect(screen.getByTestId('char-count')).toHaveTextContent('5')
  })

  it('should disable button when empty', () => {
    render(<TweetComposer onSubmit={() => {}} />)

    const button = screen.getByRole('button', { name: /tweet/i })
    expect(button).toBeDisabled()
  })

  it('should disable button when > 140 chars', () => {
    render(<TweetComposer onSubmit={() => {}} />)

    const input = screen.getByRole('textbox')
    const longText = 'a'.repeat(141)
    fireEvent.change(input, { target: { value: longText } })

    const button = screen.getByRole('button', { name: /tweet/i })
    expect(button).toBeDisabled()
  })

  it('should call onSubmit with content when submitted', () => {
    const onSubmit = vi.fn()
    render(<TweetComposer onSubmit={onSubmit} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Hello world' } })

    const button = screen.getByRole('button', { name: /tweet/i })
    fireEvent.click(button)

    expect(onSubmit).toHaveBeenCalledWith('Hello world')
  })

  it('should clear input after successful submit', () => {
    const onSubmit = vi.fn()
    render(<TweetComposer onSubmit={onSubmit} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Hello world' } })

    const button = screen.getByRole('button', { name: /tweet/i })
    fireEvent.click(button)

    expect(input).toHaveValue('')
  })
})
