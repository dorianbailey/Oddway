import { parseOpeningHours } from "@/lib/opening-hours";

interface OpeningHoursProps {
  /** Raw OSM opening_hours tag. */
  value: string | null;
  website: string | null;
  phone: string | null;
}

/**
 * Practical visiting details.
 *
 * Hours are sparse in OpenStreetMap — most small attractions have no tag at
 * all — so "we don't know" is the normal case here, not an error. When we have
 * nothing, the component points at whatever contact detail exists rather than
 * implying the place has no hours.
 */
export function OpeningHours({ value, website, phone }: OpeningHoursProps) {
  const parsed = value ? parseOpeningHours(value) : null;
  const hasSchedule =
    parsed !== null &&
    (parsed.alwaysOpen || parsed.rules.length > 0 || parsed.raw !== null);

  return (
    <div className="border-t border-contour/35 pt-5">
      <h2 className="text-[0.95rem] font-semibold text-ink-soft">
        Opening hours
      </h2>

      {hasSchedule ? (
        <>
          {parsed.alwaysOpen ? (
            <p className="mt-2 font-semibold">Open at any time</p>
          ) : parsed.raw !== null ? (
            <p className="mt-2 font-display italic">{parsed.raw}</p>
          ) : (
            <dl className="mt-2 space-y-1 text-[0.95rem]">
              {parsed.rules.map((rule) => (
                <div key={rule.days} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{rule.days}</dt>
                  <dd className="font-semibold">{rule.times}</dd>
                </div>
              ))}
            </dl>
          )}

          {parsed.notes.length > 0 ? (
            <ul className="mt-3 space-y-0.5 text-[0.85rem] text-ink-soft">
              {parsed.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          <p className="mt-3 text-[0.8rem] text-ink-soft">
            Hours from OpenStreetMap contributors. Confirm before a long drive.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[0.95rem] text-ink-soft">
          We don&rsquo;t have hours for this one.{" "}
          {website ? (
            <>Check their site before setting off.</>
          ) : phone ? (
            <>Worth a call before setting off.</>
          ) : (
            <>Worth checking locally before setting off.</>
          )}
        </p>
      )}

      {website || phone ? (
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem]">
          {website ? (
            <a
              href={
                /^https?:\/\//i.test(website) ? website : `https://${website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-route underline underline-offset-4"
            >
              Visit website
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="font-semibold text-route underline underline-offset-4"
            >
              {phone}
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
