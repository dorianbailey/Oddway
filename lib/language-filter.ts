import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

/**
 * Screening what people write.
 *
 * Applied to display names, bios, captions and alt text.
 *
 * What this is honestly worth: it stops casual crudeness and the obvious
 * slurs, including common obfuscations — sh1t and $hit are caught. It will not
 * stop somebody determined. Spacing letters out defeats it, as does any term
 * the list has not heard of, and no wordlist ever catches everything.
 *
 * So this is a first line and not the defence. The real protections are the
 * gate on a first-time poster's photograph and the ability to block an
 * account, which removes everything they have written at once. A filter that
 * was treated as sufficient would be worse than none, because it would invite
 * the review queue to be ignored.
 */

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Words the filter gets wrong.
 *
 * An index of places is unusually exposed to this. Penistone and Lightwater
 * are real towns; Scunthorpe is the famous case and the dataset already
 * handles it, but the general problem does not go away. Anything here is
 * checked before the matcher runs, so a legitimate place name is never
 * rejected for containing letters in an awkward order.
 */
const ALLOWED = [
  "penistone",
  "scunthorpe",
  "cockburn",
  "clitheroe",
  "lightwater",
  "assawoman",
  "shitterton",
  "fucking",       // The Austrian village, now Fugging, still written both ways.
  "dildo",         // Newfoundland.
  "middlesex",
  "essex",
  "sussex",
  "cockermouth",
  "bitchfield",
];

export interface FilterResult {
  clean: boolean;
  /** A message to show the person, when it is not clean. */
  reason?: string;
}

export function screenText(value: string | null | undefined): FilterResult {
  if (!value) return { clean: true };

  /*
    Allowed terms are removed before matching rather than compared against the
    whole string, because a caption is usually a sentence: "the sign outside
    Penistone" needs the town taken out and the rest still checked.
  */
  let probe = value.toLowerCase();
  for (const allowed of ALLOWED) {
    probe = probe.split(allowed).join(" ");
  }

  if (matcher.hasMatch(probe)) {
    return {
      clean: false,
      reason:
        "That contains language we do not publish. Rewrite it and try again.",
    };
  }

  return { clean: true };
}

/** Screens several fields and returns the first problem. */
export function screenAll(
  fields: Array<[label: string, value: string | null | undefined]>,
): FilterResult {
  for (const [label, value] of fields) {
    const result = screenText(value);
    if (!result.clean) {
      return {
        clean: false,
        reason: `${label}: ${result.reason}`,
      };
    }
  }
  return { clean: true };
}
