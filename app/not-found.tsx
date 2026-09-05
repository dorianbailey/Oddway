import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <h1 className="text-hero">Off the map</h1>
      <p className="mt-6 max-w-[54ch] text-lede text-ink-soft">
        There is nothing at this address. That happens out here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[#992f10]"
      >
        Back to the start
      </Link>
    </div>
  );
}
