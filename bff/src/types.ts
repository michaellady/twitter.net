export interface Tweet {
  id: string;
  content: string;
  createdAt: string;
}

export interface CreateTweetRequest {
  content: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
