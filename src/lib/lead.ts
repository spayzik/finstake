export type ServiceType = 'personal' | 'business' | 'secured' | 'refinancing';
export type CommunicationType = 'phone' | 'telegram' | 'whatsapp';
export type LeadDraft = {
  service: ServiceType | string;
  amount: string;
  term: string;
  comment: string;
  name: string;
  phone: string;
  communication: CommunicationType | string;
  consent: boolean;
};
export type DetailsErrors = Partial<Record<'service' | 'amount' | 'term' | 'comment', string>>;
export type ContactErrors = Partial<Record<'name' | 'phone' | 'communication' | 'consent', string>>;
export type LeadConfig = { mode: 'demo' } | { mode: 'unavailable'; reason: string } | {
  mode: 'live'; endpoint: string; privacyPolicyVersion: string; privacyPolicyUrl: string;
};
export type LeadResult = { status: 'demo' } | { status: 'accepted'; requestId: string };
export type LeadPayload = {
  schemaVersion: 1;
  source: 'finstake-web';
  service: ServiceType;
  amountRub: number;
  termMonths: number | null;
  comment: string;
  contact: { name: string; phone: string; preferredChannel: CommunicationType };
  consent: { accepted: true; policyVersion: string };
};
export type SubmissionErrorCode = 'invalid' | 'unavailable' | 'response' | 'http' | 'network' | 'timeout' | 'cancelled';
export class LeadSubmissionError extends Error {
  code: SubmissionErrorCode;
  constructor(code: SubmissionErrorCode, message: string) { super(message); this.name = 'LeadSubmissionError'; this.code = code; }
}
const services = new Set<string>(['personal', 'business', 'secured', 'refinancing']);
const channels = new Set<string>(['phone', 'telegram', 'whatsapp']);
const terms = new Set<string>(['12', '24', '36', '60', '84', '120']);

export function parseAmount(value: string): number | null {
  const digits = value.replace(/[ \u00a0\u202f]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 1_000_000_000 ? amount : null;
}

export function normalizePhone(value: string): string | null {
  const phone = value.trim();
  if (!/^\+?[\d ()-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return /^[1-9]\d{9,14}$/.test(digits) ? `+${digits}` : null;
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && /^[78]/.test(digits)) return `+7${digits.slice(1)}`;
  return null;
}

export function validateDetails(draft: LeadDraft): DetailsErrors {
  const errors: DetailsErrors = {};
  if (!services.has(draft.service)) errors.service = 'Выберите направление.';
  if (parseAmount(draft.amount) === null) errors.amount = 'Введите сумму от 1 до 1 000 000 000 ₽, только целое число.';
  if (draft.term && !terms.has(draft.term)) errors.term = 'Выберите срок из списка.';
  if (draft.comment.length > 1000) errors.comment = 'Сократите комментарий до 1 000 символов.';
  return errors;
}

export function validateContact(draft: LeadDraft): ContactErrors {
  const errors: ContactErrors = {};
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M} '\u2019-]+$/u.test(name) || (name.match(/\p{L}/gu)?.length ?? 0) < 2) {
    errors.name = 'Укажите имя: от 2 до 80 символов.';
  }
  if (!normalizePhone(draft.phone)) errors.phone = 'Введите номер с кодом страны, например +7 999 123-45-67.';
  if (!channels.has(draft.communication)) errors.communication = 'Выберите удобный способ связи.';
  if (draft.consent !== true) errors.consent = 'Для продолжения необходимо согласие.';
  return errors;
}

export function resolveLeadConfig(input: { endpoint?: string; privacyPolicyVersion?: string; privacyPolicyUrl?: string }): LeadConfig {
  const endpoint = input.endpoint?.trim();
  if (!endpoint) return { mode: 'demo' };
  if (!/^\/api\/[A-Za-z0-9/_-]+$/.test(endpoint)) {
    return { mode: 'unavailable', reason: 'Не настроен допустимый адрес приёма заявок.' };
  }
  const privacyPolicyVersion = input.privacyPolicyVersion?.trim();
  const privacyPolicyUrl = input.privacyPolicyUrl?.trim();
  if (!privacyPolicyVersion || privacyPolicyVersion.length > 100 || !privacyPolicyUrl || privacyPolicyUrl.length > 2048) {
    return { mode: 'unavailable', reason: 'Не настроена опубликованная политика обработки данных.' };
  }
  try {
    const policy = new URL(privacyPolicyUrl, 'https://finstake.invalid');
    const safeRelative = privacyPolicyUrl.startsWith('/') && !privacyPolicyUrl.startsWith('//') && !privacyPolicyUrl.includes('\\');
    const safeAbsolute = privacyPolicyUrl.startsWith('https://') && policy.protocol === 'https:';
    if ((!safeRelative && !safeAbsolute) || policy.username || policy.password) {
      return { mode: 'unavailable', reason: 'Не настроена допустимая ссылка на политику обработки данных.' };
    }
  } catch {
    return { mode: 'unavailable', reason: 'Не настроена допустимая ссылка на политику обработки данных.' };
  }
  return { mode: 'live', endpoint, privacyPolicyVersion, privacyPolicyUrl };
}

export async function submitLead(
  draft: LeadDraft,
  config: LeadConfig,
  options: { signal?: AbortSignal; fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<LeadResult> {
  if (options.signal?.aborted) throw new LeadSubmissionError('cancelled', 'Отправка отменена.');
  if (Object.keys(validateDetails(draft)).length || Object.keys(validateContact(draft)).length) {
    throw new LeadSubmissionError('invalid', 'Проверьте заполнение полей.');
  }
  if (config.mode === 'unavailable') throw new LeadSubmissionError('unavailable', config.reason);
  if (config.mode === 'demo') return { status: 'demo' };

  const verifiedConfig = resolveLeadConfig(config);
  if (verifiedConfig.mode !== 'live') {
    throw new LeadSubmissionError('unavailable', 'Отправка пока не настроена.');
  }
  const payload: LeadPayload = {
    schemaVersion: 1,
    source: 'finstake-web',
    service: draft.service as ServiceType,
    amountRub: parseAmount(draft.amount)!,
    termMonths: draft.term ? Number(draft.term) : null,
    comment: draft.comment.trim(),
    contact: {
      name: draft.name.trim(),
      phone: normalizePhone(draft.phone)!,
      preferredChannel: draft.communication as CommunicationType,
    },
    consent: { accepted: true, policyVersion: verifiedConfig.privacyPolicyVersion },
  };

  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 12_000);
  try {
    const response = await (options.fetcher ?? globalThis.fetch)(verifiedConfig.endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new LeadSubmissionError('http', response.status === 429
        ? 'Слишком много попыток. Подождите немного и повторите отправку.'
        : 'Сервер не принял заявку. Повторите попытку позже.');
    }
    if (response.status !== 201) {
      throw new LeadSubmissionError('response', 'Сервер не подтвердил приём заявки. Проверьте связь и повторите попытку.');
    }
    let body: unknown;
    try { body = await response.json(); }
    catch { throw new LeadSubmissionError('response', 'Ответ сервера не удалось проверить. Приём заявки не подтверждён.'); }
    if (!body || typeof body !== 'object' || !('status' in body) || body.status !== 'accepted'
      || !('requestId' in body) || typeof body.requestId !== 'string' || !body.requestId.trim()) {
      throw new LeadSubmissionError('response', 'В ответе нет подтверждения приёма заявки. Повторите попытку позже.');
    }
    return { status: 'accepted', requestId: body.requestId };
  } catch (error) {
    if (timedOut) throw new LeadSubmissionError('timeout', 'Сервер не ответил вовремя. Приём заявки не подтверждён. Попробуйте ещё раз.');
    if (controller.signal.aborted) throw new LeadSubmissionError('cancelled', 'Отправка отменена.');
    if (error instanceof LeadSubmissionError) throw error;
    throw new LeadSubmissionError('network', 'Не удалось связаться с сервером. Проверьте интернет и повторите попытку.');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
}
