const STEPS = [
  {
    title: "Pick your route",
    body: "Give us a start and a finish. OddWay takes care of everything in between, including the two-lane roads you would never have chosen yourself.",
  },
  {
    title: "Find strange stops",
    body: "Filter by what you actually want to see, then check how far each stop pulls you off course before you commit to it.",
  },
  {
    title: "Take the OddWay",
    body: "Add the good ones to your trip, take the directions with you, and go stand in front of the thing.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="border-y border-contour/30 bg-paper-sunk"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 id="how-heading" className="max-w-[18ch] text-section">
          How OddWay works
        </h2>

        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* The road between the steps. Only drawn where the steps sit in a row. */}
          <div
            aria-hidden="true"
            className="absolute top-[27px] right-[12%] left-[12%] hidden border-t-2 border-dashed border-contour/55 md:block"
          />

          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-route bg-paper font-display text-[1.5rem] font-bold text-route"
              >
                {index + 1}
              </span>
              <h3 className="mt-5 text-title">{step.title}</h3>
              <p className="mt-2 max-w-[42ch] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
