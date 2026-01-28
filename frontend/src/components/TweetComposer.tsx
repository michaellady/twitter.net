import { useState, useRef } from 'react'

const MAX_CHARS = 140
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface TweetComposerProps {
  onSubmit: (content: string, imageFile?: File) => Promise<void>
}

export function TweetComposer({ onSubmit }: TweetComposerProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = content.length
  const isEmpty = charCount === 0
  const isOverLimit = charCount > MAX_CHARS
  const isDisabled = isEmpty || isOverLimit || isSubmitting || !!imageError

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)

    if (!file) {
      setSelectedImage(null)
      setImagePreview(null)
      return
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Invalid image type. Allowed: JPG, PNG, GIF, WebP')
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image too large. Maximum size: 5MB')
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setImageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDisabled) return

    setIsSubmitting(true)
    try {
      await onSubmit(content, selectedImage || undefined)
      setContent('')
      removeImage()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
        rows={3}
        data-testid="tweet-input"
      />

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-48 rounded-lg"
            data-testid="image-preview"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70"
            data-testid="remove-image"
          >
            x
          </button>
        </div>
      )}

      {/* Image Error */}
      {imageError && (
        <p className="text-red-500 text-sm mt-2" data-testid="image-error">
          {imageError}
        </p>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-blue-500 hover:text-blue-600">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              ref={fileInputRef}
              data-testid="image-input"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </label>
          <span
            className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}
            data-testid="char-count"
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <button
          type="submit"
          disabled={isDisabled}
          className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
          data-testid="tweet-button"
        >
          Tweet
        </button>
      </div>
    </form>
  )
}
