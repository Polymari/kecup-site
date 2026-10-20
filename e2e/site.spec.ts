import { expect, test } from '@playwright/test'

test('language toggle switches the site to Indonesian', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('preloader')).toBeHidden({ timeout: 10_000 })
  await page.getByRole('button', { name: 'id', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Rakit Cup' }).first()).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})

test('menu tabs show snacks and drinks with prices', async ({ page }) => {
  await page.goto('/menu')
  await page.getByRole('tab', { name: 'Snacks' }).click()
  await expect(page.getByText('Meaty Bolognese Nachos')).toBeVisible()
  await expect(page.getByText('25k').first()).toBeVisible()
})

test('builder walks to a WhatsApp order link', async ({ page }) => {
  await page.goto('/build')
  await page.getByRole('button', { name: /Meaty Bolognese Nachos/ }).click()
  await page.getByRole('button', { name: 'Cloudy Tea', exact: true }).click()
  await page.getByRole('button', { name: 'Add to cup' }).click()
  await expect(page.getByText('You saved Rp 7.000')).toBeVisible()

  await page.getByLabel('Your name').fill('E2E Tester')
  await page.getByRole('button', { name: 'Checkout' }).click()

  const link = page.getByRole('link', { name: /Send via WhatsApp/ })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toMatch(/^https:\/\/wa\.me\/6281200000001\?text=/)
  expect(decodeURIComponent(href!.split('?text=')[1])).toContain('Bolognese Craving Cup')
})

test('unknown routes render the branded 404', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await expect(page.getByText("This cup's empty — let's get you a refill.")).toBeVisible()
})

test('portal demo login reaches the dashboard', async ({ page }) => {
  await page.goto('/portal/login')
  await page.getByRole('button', { name: 'Use demo account' }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Welcome back')).toBeVisible()
  await expect(page.getByText('Today at a glance')).toBeVisible()
})

test('outlets page lists all six stations', async ({ page }) => {
  await page.goto('/outlets')
  await expect(page.getByRole('img', { name: 'Craving Line' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(6)
})

test('3D cup canvases mount without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/lab/cup')
  await expect(page.locator('canvas')).toHaveCount(2)
  await page.getByRole('button', { name: 'tea-fizzy' }).click()
  await page.getByRole('button', { name: 'cheese' }).click()
  await page.getByRole('button', { name: 'Replay assembly' }).click()

  await page.goto('/build')
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: /Creamy Mushroom Nachos/ }).click()
  await page.getByRole('button', { name: 'Fizzy Tea', exact: true }).click()
  await page.waitForTimeout(800)

  expect(errors).toEqual([])
})
