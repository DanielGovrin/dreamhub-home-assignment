import { expect, test } from '@playwright/test'
import { alert, mockFeed } from './helpers/mockFeed'

test('shows connection status and recovers after a drop', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await expect(page.getByRole('status')).toHaveText('Connected')

  await feed.drop()
  await expect(page.getByRole('status')).toContainText(/Reconnecting|attempt/)

  // The app reconnects on its own; the mock accepts the new socket.
  await feed.waitForConnection(2)
  await expect(page.getByRole('status')).toHaveText('Connected')

  // Messages keep flowing without a reload.
  await feed.push(alert('success', 'Back online'))
  await expect(page.getByText('Back online')).toBeVisible()
})

test('sent messages appear immediately in their own lane', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await page.getByLabel('Message to send').fill('Restarting worker-3')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Restarting worker-3')).toBeVisible()
  await expect(page.getByText('You', { exact: true })).toBeVisible()

  // It actually went over the socket, not just into the UI.
  await expect.poll(() => feed.received).toContain('Restarting worker-3')

  // Input clears so the next message doesn't append to the last.
  await expect(page.getByLabel('Message to send')).toHaveValue('')
})

test('messages sent while disconnected are queued, then flushed on reconnect', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')
  await feed.waitForConnection(1)

  await feed.drop()
  await expect(page.getByRole('status')).toContainText(/Reconnecting|attempt/)

  await page.getByLabel('Message to send').fill('sent while offline')
  await page.getByRole('button', { name: 'Send' }).click()

  // Visible straight away, marked as not yet delivered.
  await expect(page.getByText('sent while offline')).toBeVisible()
  await expect(page.getByText('queued')).toBeVisible()

  await feed.waitForConnection(2)
  await expect(page.getByRole('status')).toHaveText('Connected')

  // Flushed to the new socket, and the queued marker is gone.
  await expect.poll(() => feed.received).toContain('sent while offline')
  await expect(page.getByText('queued')).toHaveCount(0)
})

test('queued messages flush in the order they were sent', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')
  await feed.waitForConnection(1)
  await feed.drop()

  for (const text of ['first', 'second', 'third']) {
    await page.getByLabel('Message to send').fill(text)
    await page.getByRole('button', { name: 'Send' }).click()
  }

  await feed.waitForConnection(2)
  await expect.poll(() => feed.received.length).toBeGreaterThanOrEqual(3)
  expect(feed.received.slice(0, 3)).toEqual(['first', 'second', 'third'])
})
