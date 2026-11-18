import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Lock,
  Send,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons';
import { useI18n } from '../i18n';
import { validationKey } from '../i18n/translations';
import { usePageMeta } from '../hooks/usePageMeta';
import { useCopy } from '../hooks/useCopy';
import { useProxies } from '../contexts/ProxiesContext';
import { siteConfig } from '../config/site';
import {
  proxyKey,
  sanitizeLabel,
  validateCountry,
  validatePort,
  validateSecret,
  validateServer,
} from '../lib/validation';
import type { ProxySubmission } from '../types/submission';
import { PageHeader, Section, Container } from '../components/ui/LayoutPrimitives';
import { Button, buttonStyles } from '../components/ui/Button';
import { Checkbox, Input, Textarea } from '../components/ui/Field';
import { InlineNote } from '../components/ui/Feedback';

const RATE_LIMIT_MS = 10 * 60 * 1000;
const RATE_KEY = 'tph:submit:last';
const QUEUE_KEY = 'tph:submit:queue';

type FieldName = 'server' | 'port' | 'secret' | 'name' | 'country' | 'sourceUrl' | 'note';

const EMPTY_FORM: ProxySubmission = {
  server: '',
  port: '',
  secret: '',
  name: '',
  country: '',
  sourceUrl: '',
  note: '',
};

function readLastSubmission(): number {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function readQueue(): string[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeQueue(keys: string[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(keys.slice(-20)));
  } catch {
    /* queue is a convenience only */
  }
}

export default function Submit() {
  const { t, isRTL } = useI18n();
  const { dataset } = useProxies();
  const copy = useCopy();
  const [form, setForm] = useState<ProxySubmission>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [issueUrl, setIssueUrl] = useState('');
  const [queued, setQueued] = useState(false);
  const [formError, setFormError] = useState('');
  const Forward = isRTL ? ArrowLeft : ArrowRight;

  usePageMeta({
    title: t('meta.submit.title'),
    description: t('meta.submit.description'),
    path: '/submit',
    noindex: true,
  });

  const setField = (field: FieldName, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const buildRequestBody = (server: string, port: number, secret: string): string => {
    const lines = [
      '### Proxy submission',
      '',
      `- **Server:** \`${server}\``,
      `- **Port:** \`${port}\``,
      `- **Secret:** \`${secret}\``,
      `- **Name:** ${form.name.trim() || server}`,
      `- **Country:** ${form.country.trim().toUpperCase() || 'not specified'}`,
      `- **Source URL:** ${form.sourceUrl.trim() || 'none provided'}`,
      '',
      '### Notes for reviewers',
      form.note.trim() || '_No notes provided._',
      '',
      '### Checklist',
      '- [x] I have the right to share these connection details.',
      '- [x] I understand this submission is public and will be reviewed before publication.',
      '- [x] This is an MTProto proxy, not a SOCKS5 or HTTP proxy.',
    ];
    return lines.join('\n');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setFormError('');

    const nextErrors: Partial<Record<FieldName, string>> = {};
    const server = validateServer(form.server);
    if (!server.ok) nextErrors.server = t(validationKey(server.code));
    const port = validatePort(form.port);
    if (!port.ok) nextErrors.port = t(validationKey(port.code));
    const secret = validateSecret(form.secret);
    if (!secret.ok) nextErrors.secret = t(validationKey(secret.code));
    const country = validateCountry(form.country);
    if (!country.ok) nextErrors.country = t(validationKey(country.code));

    if (form.name.trim().length > 60) nextErrors.name = t('submit.nameTooLong');
    if (form.note.trim().length > 280) nextErrors.note = t('submit.noteTooLong');

    if (form.sourceUrl.trim()) {
      try {
        const parsed = new URL(form.sourceUrl.trim());
        if (parsed.protocol !== 'https:') nextErrors.sourceUrl = t('validation.url.protocol');
      } catch {
        nextErrors.sourceUrl = t('validation.url.invalid');
      }
    }

    if (server.ok && port.ok && secret.ok) {
      const key = proxyKey({ server: server.value, port: port.value, secret: secret.value });
      const existing = dataset?.proxies.some(
        (proxy) => proxyKey(proxy) === key,
      );
      if (existing || readQueue().includes(key)) {
        nextErrors.secret = t('validation.duplicate');
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!consent) {
      setConsentError(t('submit.checkConsent'));
      return;
    }
    setConsentError('');

    if (!siteConfig.repoUrl) {
      setFormError(t('submit.noRepo.blocked'));
      return;
    }

    const last = readLastSubmission();
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      const minutes = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 60_000);
      setFormError(t('submit.rateLimited', { minutes }));
      return;
    }

    if (!server.ok || !port.ok || !secret.ok) return;

    setSubmitting(true);
    try {
      const key = proxyKey({ server: server.value, port: port.value, secret: secret.value });
      try {
        localStorage.setItem(RATE_KEY, String(Date.now()));
      } catch {
        /* rate limiting is best effort locally; CI still reviews every request */
      }

      if (honeypot.trim()) {
        setQueued(true);
        return;
      }

      const body = buildRequestBody(server.value, port.value, secret.value);
      const title = `[proxy] ${sanitizeLabel(form.name.trim() || server.value, 60)} (${server.value}:${port.value})`;

      if (siteConfig.repoUrl) {
        const url = `${siteConfig.repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(
          body,
        )}&labels=proxy-submission`;
        writeQueue([...readQueue(), key]);
        setIssueUrl(url);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setQueued(true);
    } finally {
      setSubmitting(false);
    }
  };

  const copyRequest = async () => {
    const server = validateServer(form.server);
    const port = validatePort(form.port);
    const secret = validateSecret(form.secret);
    if (!server.ok || !port.ok || !secret.ok) return;
    await copy(buildRequestBody(server.value, port.value, secret.value), t('submit.copied'));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setConsent(false);
    setConsentError('');
    setQueued(false);
    setIssueUrl('');
    setFormError('');
  };

  return (
    <>
      <PageHeader
        eyebrow={t('submit.eyebrow')}
        title={t('submit.title')}
        description={t('submit.subtitle')}
      />

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
              {queued ? (
                <div className="text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold">{t('submit.successTitle')}</h2>
                  <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-muted">{t('submit.successBody')}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    {issueUrl ? (
                      <a
                        href={issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonStyles('primary', 'md')}
                      >
                        <GithubIcon className="size-4" />
                        {t('submit.issues')}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                    <Button variant="secondary" onClick={() => void copyRequest()} iconLeft={<ClipboardCopy className="size-4" />}>
                      {t('submit.copyButton')}
                    </Button>
                    <Button variant="ghost" onClick={resetForm}>
                      {t('submit.again')}
                    </Button>
                  </div>
                  <div className="mt-5">
                    <Link to="/proxies" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-ink hover:underline">
                      {t('submit.back')}
                      <Forward className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={(event) => void handleSubmit(event)} noValidate>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Send className="size-[18px]" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-[16px] font-semibold">{t('submit.title')}</h2>
                      <p className="mt-1 text-[12.5px] leading-6 text-muted">{t('submit.reviewNote')}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Input
                      label={t('submit.server')}
                      hint={t('submit.serverHint')}
                      value={form.server}
                      onChange={(event) => setField('server', event.target.value)}
                      error={errors.server}
                      placeholder="hostname.tld"
                      autoComplete="off"
                      spellCheck={false}
                      dir="ltr"
                      required
                      containerClassName="sm:col-span-2"
                    />
                    <Input
                      label={t('submit.port')}
                      hint={t('submit.portHint')}
                      value={form.port}
                      onChange={(event) => setField('port', event.target.value.replace(/[^\d]/g, ''))}
                      error={errors.port}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="443"
                      dir="ltr"
                      required
                    />
                    <Input
                      label={t('submit.name')}
                      hint={t('submit.nameHint')}
                      optionalLabel={t('common.optional')}
                      value={form.name}
                      onChange={(event) => setField('name', event.target.value)}
                      error={errors.name}
                      maxLength={60}
                      autoComplete="off"
                    />
                    <Input
                      label={t('submit.secret')}
                      hint={t('submit.secretHint')}
                      value={form.secret}
                      onChange={(event) => setField('secret', event.target.value)}
                      error={errors.secret}
                      autoComplete="off"
                      spellCheck={false}
                      dir="ltr"
                      required
                      containerClassName="sm:col-span-2"
                    />
                    <Input
                      label={t('submit.country')}
                      hint={t('submit.countryHint')}
                      optionalLabel={t('common.optional')}
                      value={form.country}
                      onChange={(event) => setField('country', event.target.value.toUpperCase().slice(0, 2))}
                      error={errors.country}
                      maxLength={2}
                      autoComplete="off"
                      dir="ltr"
                    />
                    <Input
                      label={t('submit.sourceUrl')}
                      hint={t('submit.sourceUrlHint')}
                      optionalLabel={t('common.optional')}
                      value={form.sourceUrl}
                      onChange={(event) => setField('sourceUrl', event.target.value)}
                      error={errors.sourceUrl}
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      autoComplete="off"
                      dir="ltr"
                    />
                    <Textarea
                      label={t('submit.note')}
                      hint={t('submit.noteHint')}
                      optionalLabel={t('common.optional')}
                      value={form.note}
                      onChange={(event) => setField('note', event.target.value)}
                      error={errors.note}
                      maxLength={280}
                      rows={3}
                      containerClassName="sm:col-span-2"
                    />
                  </div>

                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="company-website">{t('submit.honeypot')}</label>
                    <input
                      id="company-website"
                      name="company-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </div>

                  <div className="mt-5">
                    <Checkbox checked={consent} onChange={setConsent} error={consentError || undefined}>
                      {t('submit.consent')}
                    </Checkbox>
                  </div>

                  {Object.keys(errors).length > 0 ? (
                    <InlineNote tone="danger" className="mt-4">
                      <span className="inline-flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {t('submit.invalid')}
                      </span>
                    </InlineNote>
                  ) : null}

                  {formError ? (
                    <InlineNote tone="danger" className="mt-4">
                      <span className="inline-flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {formError}
                      </span>
                    </InlineNote>
                  ) : null}

                  {!siteConfig.repoUrl ? (
                    <InlineNote tone="warning" className="mt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          <strong className="block text-[12.5px] font-semibold">{t('submit.noRepo.title')}</strong>
                          <span className="mt-1 block text-[12px] leading-5">{t('submit.noRepo.body')}</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void copyRequest()}
                          iconLeft={<ClipboardCopy className="size-3.5" />}
                          className="shrink-0"
                        >
                          {t('submit.noRepo.copy')}
                        </Button>
                      </div>
                    </InlineNote>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      loading={submitting}
                      iconLeft={<Send className="size-4" />}
                    >
                      {t('submit.submitButton')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => void copyRequest()}
                      iconLeft={<ClipboardCopy className="size-4" />}
                    >
                      {t('submit.copyButton')}
                    </Button>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-muted">
                    <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {t('submit.privacy')}
                  </p>
                </form>
              )}
            </div>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-line bg-surface p-5 shadow-card">
                <h2 className="text-[14px] font-semibold">{t('submit.process.title')}</h2>
                <ol className="mt-4 space-y-3">
                  {[t('submit.process.step1'), t('submit.process.step2'), t('submit.process.step3')].map(
                    (step, index) => (
                      <li key={step} className="flex gap-3">
                        <span
                          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-ink"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span className="text-[12.5px] leading-6 text-muted">{step}</span>
                      </li>
                    ),
                  )}
                </ol>
              </section>

              <InlineNote tone="neutral">
                <div className="space-y-2.5 text-[12px] leading-6">
                  <p className="inline-flex items-start gap-2">
                    <Timer className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                    {t('submit.rateLimited', { minutes: 10 })}
                  </p>
                  <p className="inline-flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                    {t('submit.reviewNote')}
                  </p>
                </div>
              </InlineNote>

              {siteConfig.repoUrl ? (
                <a
                  href={siteConfig.issuesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles('secondary', 'md', 'w-full')}
                >
                  <GithubIcon className="size-4" />
                  {t('submit.issues')}
                </a>
              ) : null}

              <Link
                to="/guidelines"
                className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface-2/50 px-4 py-3 text-[12.5px] font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
              >
                {t('footer.guidelines')}
                <Forward className="size-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
