import { expect, test } from '@playwright/test'
import { alert, mockFeed } from './helpers/mockFeed'

test('renders each alert type with its own icon and label', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(
    alert('info', 'Deployment started'),
    alert('warning', 'High memory'),
    alert('error', 'Returned 500'),
    alert('success', 'Job finished'),
  )

  const items = page.getByRole('log').getByRole('listitem')
  await expect(items).toHaveCount(4)

  // The visually-hidden label is what makes type available without colour.
  for (const type of ['info', 'warning', 'error', 'success']) {
    await expect(page.getByText(`${type}:`, { exact: true })).toBeAttached()
  }
})

test('renders markdown but never executes embedded HTML', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await page.evaluate(() => {
    ;(window as unknown as { __pwned?: boolean }).__pwned = false
  })

  await feed.push(
    alert('info', 'Deploy to **production** with `kubectl`'),
    alert('error', `<script>window.__pwned = true</script>`),
    alert('error', `<img src=x onerror="window.__pwned = true">`),
    alert('error', `<iframe src="https://example.com"></iframe>`),
    alert('error', `[click me](javascript:window.__pwned=true)`),
  )

  await expect(page.getByRole('log').getByRole('listitem')).toHaveCount(5)

  // Markdown still renders.
  await expect(page.getByRole('log').locator('strong')).toHaveText('production')
  await expect(page.getByRole('log').locator('code')).toHaveText('kubectl')

  // Raw HTML is never parsed, so no element is created from it.
  await expect(page.getByRole('log').locator('script, iframe, img')).toHaveCount(0)

  // `javascript:` is stripped by react-markdown's url transform.
  await expect(page.getByRole('log').getByRole('link', { name: 'click me' })).toHaveAttribute(
    'href',
    '',
  )

  expect(await page.evaluate(() => (window as unknown as { __pwned: boolean }).__pwned)).toBe(false)
})

test('type filters and search intersect', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(
    alert('info', 'Deployment to production completed'),
    alert('success', 'Deployment finished'),
    alert('error', 'Deployment failed'),
    alert('info', 'Unrelated message'),
  )

  const items = page.getByRole('log').getByRole('listitem')
  await expect(items).toHaveCount(4)

  await page.getByLabel('Search messages').fill('deployment')
  await expect(items).toHaveCount(3)

  // Hiding errors must narrow the search results, not replace them.
  await page.getByRole('button', { name: /^error/ }).click()
  await expect(items).toHaveCount(2)
  await expect(page.getByText('Deployment failed')).toHaveCount(0)
})

test('empty states distinguish "waiting" from "no match"', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await expect(page.getByText('Waiting for alerts…')).toBeVisible()

  await feed.push(alert('info', 'Something happened'))
  await page.getByLabel('Search messages').fill('nothing matches this')
  await expect(page.getByText('No alerts match the current filters.')).toBeVisible()
})
