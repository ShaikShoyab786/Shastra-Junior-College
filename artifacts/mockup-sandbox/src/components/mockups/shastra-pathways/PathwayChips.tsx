import "./_group.css";
import { ArrowRight } from "lucide-react";

const pathways = [
  "Intermediate",
  "IIT-JEE Main",
  "NEET",
  "Degree",
  "CA Foundation",
];

export function PathwayChips() {
  return (
    <section className="border-y border-[#0b3472]/10 bg-[#fbfaf6] px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="eyebrow mb-3 text-[#0b3472]/75">
          Explore Program Pathways:
        </h2>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {pathways.map((pathway) => (
            <a
              key={pathway}
              href="/"
              aria-label={`Return to Home to explore ${pathway}`}
              className="focus-ring group inline-flex min-h-10 items-center gap-2.5 rounded-full border border-[#0b3472]/20 bg-white px-4 py-2 text-sm font-bold text-[#0b3472] shadow-[0_2px_8px_rgba(11,52,114,.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0b3472] hover:bg-[#0b3472] hover:text-white hover:shadow-[0_8px_18px_rgba(11,52,114,.14)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e3212b] transition-shadow group-hover:shadow-[0_0_0_3px_rgba(227,33,43,.16)]" />
              <span>{pathway}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}