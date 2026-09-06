/**
 * JSON-LD for search engines.
 *
 * A stop is a TouristAttraction with coordinates and, where we know them,
 * opening hours — which is the difference between appearing as a place in a
 * map result and appearing as a blue link. An article is an Article.
 *
 * Rendered as a script tag rather than through next/script so it is present in
 * the server HTML, which is where crawlers read it.
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own database, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
