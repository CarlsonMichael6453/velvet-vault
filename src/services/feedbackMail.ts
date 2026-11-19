import { FEEDBACK_EMAIL } from '@/src/config';

export type FeedbackDraft = {
  rating: number;
  message: string;
  email: string;
  bug: boolean;
  version: string;
  model: string;
  os: string;
};

export function feedbackSubject(draft: Pick<FeedbackDraft, 'bug' | 'rating'>): string {
  return draft.bug ? 'Velvet Vault bug report' : `Velvet Vault feedback (${draft.rating}/5)`;
}

export function feedbackBody(draft: FeedbackDraft): string {
  const reply = draft.email.trim();
  return [
    draft.message.trim(),
    '',
    reply ? `Reply to: ${reply}` : 'No reply email provided.',
    `Rating: ${draft.rating} / 5`,
    `Bug report: ${draft.bug ? 'yes' : 'no'}`,
    `App version: ${draft.version}`,
    `Device: ${draft.model}`,
    `OS: ${draft.os}`,
  ].join('\n');
}

export function feedbackMailto(draft: FeedbackDraft): string {
  const subject = encodeURIComponent(feedbackSubject(draft));
  const body = encodeURIComponent(feedbackBody(draft));
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function feedbackValidation(draft: Pick<FeedbackDraft, 'rating' | 'message' | 'email'>): string | null {
  if (draft.rating < 1 || draft.rating > 5) return 'Choose a star rating.';
  if (draft.message.trim().length < 1) return 'Write a few words so we know what to look at.';
  if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim())) return 'That email does not look complete.';
  return null;
}
