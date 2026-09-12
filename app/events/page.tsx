import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { StateFilter } from "@/components/StateFilter";
import { EventList } from "@/components/EventList";
import { DataUnavailable } from "@/components/DataUnavailable";
import { getEventStates, loadEvents } from "@/lib/events";
import { isKnownState, stateName } from "@/lib/us-states";

interface EventsPageProps {
  searchParams: Promise<{ state?: string }>;
}

export async function generateMetadata({
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const { state } = await searchParams;
  const code = normaliseState(state);

  if (!code) {
    return {
      title: "Events",
      description:
        "Ghost conventions, cryptid festivals and UFO gatherings across the United States, listed alphabetically with dates and locations.",
    };
  }

  return {
    title: `Paranormal, cryptid and UFO events in ${stateName(code)}`,
    description: `Festivals, conferences and gatherings in ${stateName(code)}, with dates and how far each one is from you.`,
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { state } = await searchParams;
  const selected = normaliseState(state);

  const [{ events: all, unavailable }, states] = await Promise.all([
    loadEvents(),
    getEventStates(),
  ]);
  const events = selected ? all.filter((e) => e.state === selected) : all;

  return (
    <>
      <PageHero>
          <h1 className="max-w-[20ch] text-hero">
            {selected ? `Events in ${stateName(selected)}` : "Events"}
          </h1>
          {/*
            This said "for people who drive a long way to hear about a monster",
            which was right when thirty of the thirty-four events were about
            Bigfoot. The calendar is now nearly a third ghost conventions and
            paranormal weekends, and a page that names only one of the three
            things it lists tells two thirds of visitors it is not for them.
          */}
          <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
            Ghost hunts and paranormal conventions, cryptid festivals, UFO
            gatherings — the weekends people drive a long way for. Listed
            alphabetically; sort by how close they are, or how soon.
          </p>
        </PageHero>

      <div className="border-b border-contour/30 bg-paper-sunk">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <StateFilter
            states={states}
            selected={selected}
            total={all.length}
            basePath="/events"
            label="Where are you looking?"
            allLabel={`Anywhere — all ${all.length} events`}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        {unavailable ? (
          <DataUnavailable what="the events list" />
        ) : events.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            {selected
              ? `Nothing listed in ${stateName(selected)} yet.`
              : "No events listed yet."}
          </p>
        ) : (
          <EventList events={events} />
        )}
      </div>
    </>
  );
}

function normaliseState(value: string | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return isKnownState(code) ? code : null;
}
