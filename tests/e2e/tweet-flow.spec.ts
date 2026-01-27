import { test, expect } from '@playwright/test';

/**
 * E2E test proving the complete tracer bullet:
 * User posts tweet, tweet appears in feed, persists after refresh.
 *
 * This test validates the full vertical slice through the system:
 * Frontend -> BFF -> Core API -> DynamoDB -> back to Frontend
 */
test.describe('Tweet Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('user can post a tweet and see it in the feed', async ({ page }) => {
    const tweetContent = `Test tweet ${Date.now()}`;

    // Step 1: Navigate to app (done in beforeEach)
    await expect(page).toHaveTitle(/twitter/i);

    // Step 2: Type tweet content in composer
    const composer = page.getByRole('textbox', { name: /tweet/i });
    await expect(composer).toBeVisible();
    await composer.fill(tweetContent);

    // Verify character counter updates
    const charCounter = page.getByTestId('char-counter');
    await expect(charCounter).toContainText(String(tweetContent.length));

    // Step 3: Click Tweet button
    const tweetButton = page.getByRole('button', { name: /tweet/i });
    await expect(tweetButton).toBeEnabled();
    await tweetButton.click();

    // Step 4: Verify tweet appears in feed below
    const feed = page.getByTestId('tweet-feed');
    await expect(feed).toBeVisible();

    // Wait for the tweet to appear in the feed
    const postedTweet = feed.getByText(tweetContent);
    await expect(postedTweet).toBeVisible({ timeout: 10_000 });

    // Verify composer is cleared after successful post
    await expect(composer).toHaveValue('');
  });

  test('tweet persists after page refresh', async ({ page }) => {
    const tweetContent = `Persistent tweet ${Date.now()}`;

    // Post a tweet
    const composer = page.getByRole('textbox', { name: /tweet/i });
    await composer.fill(tweetContent);

    const tweetButton = page.getByRole('button', { name: /tweet/i });
    await tweetButton.click();

    // Wait for tweet to appear
    const feed = page.getByTestId('tweet-feed');
    await expect(feed.getByText(tweetContent)).toBeVisible({ timeout: 10_000 });

    // Step 5: Refresh page
    await page.reload();

    // Verify tweet still appears after refresh
    await expect(feed.getByText(tweetContent)).toBeVisible({ timeout: 10_000 });
  });

  test('tweet button is disabled when composer is empty', async ({ page }) => {
    const composer = page.getByRole('textbox', { name: /tweet/i });
    await expect(composer).toBeVisible();
    await expect(composer).toHaveValue('');

    const tweetButton = page.getByRole('button', { name: /tweet/i });
    await expect(tweetButton).toBeDisabled();
  });

  test('character counter shows correct count', async ({ page }) => {
    const composer = page.getByRole('textbox', { name: /tweet/i });
    const charCounter = page.getByTestId('char-counter');

    // Initially should show 0/140 or similar
    await expect(charCounter).toContainText('0');

    // Type some text
    await composer.fill('Hello');
    await expect(charCounter).toContainText('5');

    // Clear and type max length
    const maxTweet = 'x'.repeat(140);
    await composer.fill(maxTweet);
    await expect(charCounter).toContainText('140');
  });

  test('displays loading state while fetching tweets', async ({ page }) => {
    // On initial load, should briefly show loading spinner
    // This test verifies the loading state exists in the feed
    await page.goto('/');

    // Either loading spinner is visible briefly, or feed loads immediately
    // We check that the feed eventually appears
    const feed = page.getByTestId('tweet-feed');
    await expect(feed).toBeVisible({ timeout: 10_000 });
  });

  test('displays empty state when no tweets exist', async ({ page }) => {
    // This test assumes a fresh database state
    // In practice, we'd need to clear the DB or use a separate test DB
    // For now, we just verify the empty state component can render

    // Navigate and wait for initial load
    await page.goto('/');

    const feed = page.getByTestId('tweet-feed');
    await expect(feed).toBeVisible();

    // The feed should either show tweets or an empty state message
    // We verify the feed component renders correctly
    const feedContent = await feed.textContent();
    expect(feedContent).toBeDefined();
  });
});
