import type { PublicAccess } from "@/types/oddway";

/** "12 min off route" — always framed as cost to the driver, not raw minutes. */
export function formatDetour(minutes: number): string {
  if (minutes < 60) return `${minutes} min off route`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${hours} hr off route`
    : `${hours} hr ${rest} min off route`;
}

/** Plain-language access note. Says what the visitor can expect to do. */
export function formatAccess(access: PublicAccess): string {
  switch (access) {
    case "open":
      return "Open to visitors";
    case "limited":
      return "Seasonal or ticketed";
    case "roadside":
      return "Roadside, no entry";
    case "private":
      return "Private land, view only";
  }
}

/** Decimal degrees in the form a map sheet would print them. */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

/** Driving time, rounded the way you'd say it out loud. */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
