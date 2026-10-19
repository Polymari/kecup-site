import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { SITE } from '@/config/site'
import { FRANCHISE_PACKAGES } from '@/data/packages'
import { buildFranchiseMessage, buildMailto, buildWhatsAppLink } from '@/lib/whatsapp'
import { Card } from '@/components/brand/Card'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  city: z.string().min(2),
  budget: z.string().min(2),
  packageId: z.enum(['regular', 'large', 'jumbo']),
  message: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEP_FIELDS: Array<Array<keyof FormValues>> = [
  ['name', 'email'],
  ['city', 'budget', 'packageId'],
  ['message'],
]

type ApplyFormProps = {
  defaultPackage?: FormValues['packageId']
}

export function ApplyForm({ defaultPackage = 'regular' }: ApplyFormProps) {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { packageId: defaultPackage, message: '' },
    mode: 'onTouched',
  })

  const locale = i18n.language.startsWith('id') ? 'id' : 'en'

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((value) => Math.min(value + 1, STEP_FIELDS.length - 1))
  }

  const onSubmit = handleSubmit(() => setReady(true))

  const values = getValues()
  const packageLabel = t(
    FRANCHISE_PACKAGES.find((entry) => entry.id === (values.packageId ?? defaultPackage))!.nameKey,
  )
  const message = buildFranchiseMessage({
    name: values.name ?? '',
    city: values.city ?? '',
    budget: values.budget ?? '',
    packageLabel,
    message: values.message ?? '',
    locale,
  })

  return (
    <Card className="p-6">
      <h3 className="font-display text-2xl font-semibold text-ink">{t('franchise.form.title')}</h3>
      <p className="mt-1 font-mono text-xs text-brick">
        {step + 1} / {STEP_FIELDS.length}
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        {step === 0 ? (
          <>
            <div className="grid gap-1">
              <label htmlFor="apply-name" className="text-sm font-semibold text-ink">
                {t('franchise.form.name')}
              </label>
              <input
                id="apply-name"
                {...register('name')}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
              />
              {errors.name ? (
                <span role="alert" className="text-xs text-ketchup">
                  {t('common.required')}
                </span>
              ) : null}
            </div>
            <div className="grid gap-1">
              <label htmlFor="apply-email" className="text-sm font-semibold text-ink">
                {t('franchise.form.email')}
              </label>
              <input
                id="apply-email"
                type="email"
                {...register('email')}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
              />
              {errors.email ? (
                <span role="alert" className="text-xs text-ketchup">
                  {t('common.required')}
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="grid gap-1">
              <label htmlFor="apply-city" className="text-sm font-semibold text-ink">
                {t('franchise.form.city')}
              </label>
              <input
                id="apply-city"
                {...register('city')}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
              />
              {errors.city ? (
                <span role="alert" className="text-xs text-ketchup">
                  {t('common.required')}
                </span>
              ) : null}
            </div>
            <div className="grid gap-1">
              <label htmlFor="apply-budget" className="text-sm font-semibold text-ink">
                {t('franchise.form.budget')}
              </label>
              <input
                id="apply-budget"
                {...register('budget')}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
              />
              {errors.budget ? (
                <span role="alert" className="text-xs text-ketchup">
                  {t('common.required')}
                </span>
              ) : null}
            </div>
            <div className="grid gap-1">
              <label htmlFor="apply-package" className="text-sm font-semibold text-ink">
                {t('franchise.form.package')}
              </label>
              <select
                id="apply-package"
                {...register('packageId')}
                className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 text-sm"
              >
                {FRANCHISE_PACKAGES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {t(entry.nameKey)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-1">
            <label htmlFor="apply-message" className="text-sm font-semibold text-ink">
              {t('franchise.form.message')}
            </label>
            <textarea
              id="apply-message"
              rows={4}
              {...register('message')}
              className="rounded-xl border-[3px] border-ink bg-cream px-4 py-2 text-sm"
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              className="rounded-full border-[3px] border-ink bg-cream px-5 py-2 font-display font-semibold text-ink"
            >
              {t('common.back')}
            </button>
          ) : null}

          {step < STEP_FIELDS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full border-[3px] border-ink bg-butter px-5 py-2 font-display font-semibold text-ink shadow-sticker"
            >
              {t('common.next')}
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-full border-[3px] border-ink bg-ketchup px-5 py-2 font-display font-semibold text-cream shadow-sticker"
            >
              {t('common.submit')}
            </button>
          )}
        </div>
      </form>

      {ready ? (
        <div className="mt-4 rounded-xl border-2 border-dashed border-brick bg-cream-deep p-4">
          <p className="font-display font-semibold text-ink">{t('franchise.form.success')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={buildWhatsAppLink(SITE.brandWhatsapp, message)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border-[3px] border-ink bg-ketchup px-5 py-2 font-display font-semibold text-cream shadow-sticker"
            >
              {t('franchise.form.sendWhatsapp')}
            </a>
            <a
              href={buildMailto(
                SITE.contactEmail,
                `Franchise: ${packageLabel}`,
                message,
              )}
              className="rounded-full border-[3px] border-ink bg-cream px-5 py-2 font-display font-semibold text-ink shadow-sticker"
            >
              {t('franchise.form.sendEmail')}
            </a>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
