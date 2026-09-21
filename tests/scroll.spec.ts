import { expect, test, type Page } from '@playwright/test'
import { alert, mockFeed } from './helpers/mockFeed'

const SCROLLER = '.overflow-y-auto'

const distanceFromBottom = (page: Page) =>
  page.locator(SCROLLER).evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight)

const atLiveEdge = async (page: Page) => {
  await expect.poll(() => distanceFromBottom(page)).toBeLessThanOrEqual(16)
}

/**
 * Scrolls to the top and waits until the app has registered it. Without the
 * confirmation the next assertion can run while the feed is still following,
 * which looks like a missing pill rather than a timing problem.
 */
const scrollAway = async (page: Page) => {
  await page.locator(SCROLLER).evaluate((el) => el.scrollTo({ top: 0 }))
  await expect.poll(() => page.locator(SCROLLER).evaluate((el) => el.scrollTop)).toBe(0)
  // `scrollTop` is 0 the instant we set it, but the app only detaches once its
  // scroll handler has run and re-rendered. Without this settle the next
  // alerts arrive while the feed is still following, and the missing pill
  // looks like a product bug rather than a race.
  await page.waitForTimeout(250)
}

const fill = (count: number) =>
  Array.from({ length: count }, (_, i) => alert('info', `filler ${i}`))

test('follows the newest message while at the live edge', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(...fill(30))
  await expect(page.getByRole('log').getByRole('listitem')).toHaveCount(30)

  await atLiveEdge(page)
  await expect(page.getByRole('button', { name: /new messages?/ })).toHaveCount(0)
})

test('stops following once the user scrolls away, and counts what arrives', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(...fill(30))
  await atLiveEdge(page)
  await scrollAway(page)

  await feed.push(alert('info', 'new one'), alert('info', 'new two'), alert('info', 'new three'))

  await expect(page.getByRole('button', { name: '3 new messages' })).toBeVisible()
  // The view must not be yanked back down.
  expect(await page.locator(SCROLLER).evaluate((el) => el.scrollTop)).toBe(0)
})

test('the unseen count ignores alerts the filters hide', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(...fill(30))
  await atLiveEdge(page)

  await page.getByRole('button', { name: /^error/ }).click()
  await atLiveEdge(page)
  await scrollAway(page)

  await feed.push(
    alert('info', 'counted one'),
    alert('error', 'hidden and must not count'),
    alert('info', 'counted two'),
    alert('error', 'also hidden'),
  )

  // Two visible arrivals, two hidden — counting all four would produce a pill
  // that jumps to the bottom and appears to change nothing.
  await expect(page.getByRole('button', { name: '2 new messages' })).toBeVisible()
})

test('singular wording for a single new message', async ({ page }) => {
  const feed = await mockFeed(page)
  await page.goto('/')

  await feed.push(...fill(30))
  await atLiveEdge(page)
  await scrollAway(page)

  await feed.push(alert('info', 'just one'))
  await expect(page.getByRole('button', { name: '1 new message' })).toBeVisible()
})
