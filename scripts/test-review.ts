import assert from 'node:assert/strict';

import { REVIEW_COOLDOWN_DAYS } from '../src/config';
import { shiftDay } from '../src/lib/format';
import { daysBetween, reviewGateAllows } from '../src/services/reviewGate';
import { feedbackBody, feedbackMailto, feedbackSubject, feedbackValidation } from '../src/services/feedbackMail';
import { FEEDBACK_EMAIL } from '../src/config';

const today = '2026-04-01';

function allows(sessions: number, lastPromptOn: string | null, day = today) {
  return reviewGateAllows({ sessions, lastPromptOn, today: day });
}

assert.equal(allows(0, null), false);
assert.equal(allows(1, null), false, 'first session never prompts');
assert.equal(allows(2, null), true);
assert.equal(allows(8, null), true);

assert.equal(allows(3, today), false);
assert.equal(allows(3, shiftDay(today, -1)), false);
assert.equal(allows(3, shiftDay(today, -(REVIEW_COOLDOWN_DAYS - 1))), false);
assert.equal(allows(3, shiftDay(today, -REVIEW_COOLDOWN_DAYS)), true);
assert.equal(allows(3, shiftDay(today, -(REVIEW_COOLDOWN_DAYS + 40))), true);

assert.equal(allows(4, '2026-02-30'), false, 'invalid dates do not open the gate');
assert.equal(allows(4, '04/01/2026'), false);
assert.equal(allows(2, shiftDay(today, 1)), false, 'a future prompt date waits');

assert.equal(daysBetween('2026-01-01', '2026-04-01'), 90);
assert.equal(daysBetween('2024-01-01', '2024-03-31'), 90);
assert.equal(daysBetween('not-a-day', today), null);

const draft = {
  rating: 4,
  message: 'The reels feel good.',
  email: 'guest@example.com',
  bug: false,
  version: '1.0.0',
  model: 'iPhone',
  os: 'iOS 18.0',
};
assert.equal(feedbackSubject(draft), 'Velvet Vault feedback (4/5)');
assert.equal(feedbackSubject({ ...draft, bug: true }), 'Velvet Vault bug report');
assert.match(feedbackBody(draft), /App version: 1\.0\.0/);
assert.match(feedbackBody(draft), /Device: iPhone/);
assert.match(feedbackBody(draft), /OS: iOS 18\.0/);
assert.match(feedbackBody({ ...draft, email: '  ' }), /No reply email provided/);
const mailto = feedbackMailto(draft);
assert.ok(mailto.startsWith(`mailto:${FEEDBACK_EMAIL}?`));
assert.equal(decodeURIComponent(mailto.split('subject=')[1].split('&')[0]), feedbackSubject(draft));
assert.equal(feedbackValidation({ rating: 0, message: 'hi', email: '' }), 'Choose a star rating.');
assert.equal(feedbackValidation({ rating: 5, message: '   ', email: '' }), 'Write a few words so we know what to look at.');
assert.equal(feedbackValidation({ rating: 5, message: 'Stuck on a spin', email: 'not-an-email' }), 'That email does not look complete.');
assert.equal(feedbackValidation({ rating: 2, message: 'Stuck on a spin', email: '' }), null);

console.log('Review gate and feedback mail checks passed.');
