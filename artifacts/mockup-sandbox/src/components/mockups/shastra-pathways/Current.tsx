import "./_group.css";
import { ArrowRight } from "lucide-react";

const pathways = [
  { id: "intermediate", title: "Intermediate" },
  { id: "jee", title: "IIT-JEE Main" },
  { id: "neet", title: "NEET" },
];

function PathwayImage({ index }: { index: number }) {
  return (
    <div
      className={`relative h-52 overflow-hidden sm:h-60 ${
        index % 2 === 0 ? "bg-[#dce7f4]" : "bg-[#f1d8d0]"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute -right-10 -top-14 h-44 w-44 rounded-full border-[24px] ${
          index % 2 === 0 ? "border-[#0b3472]/15" : "border-[#e3212b]/20"
        }`}
      />
      <span
        className={`absolute bottom-0 left-0 h-24 w-32 rounded-tr-[3rem] ${
          index % 2 === 0 ? "bg-[#0b3472]/10" : "bg-[#e3212b]/10"
        }`}
      />
    </div>
  );
}

export function Current() {
  return (
    <section className="bg-[#fbfaf6] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#0b3472]/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow text-[#e3212b]">Explore pathways</span>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-[-0.045em] text-[#0b3472] sm:text-6xl">
              Explore Pathways
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-600 sm:text-right">
            Explore the areas named in the Shastra logo. Descriptions are demo
            copy.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {pathways.map((item, index) => (
            <article
              key={item.id}
              className={`group overflow-hidden rounded-[1.75rem] border border-[#0b3472]/10 bg-white ${
                index === 0 ? "md:row-span-2" : ""
              }`}
            >
              <PathwayImage index={index} />
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#e3212b]">
                    Pathway
                  </span>
                  <span className="font-mono text-xs text-[#0b3472]/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-[#0b3472]">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                  Demo copy: replace with approved information for this option.
                </p>
                <a
                  href="#"
                  className="focus-ring mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0b3472]"
                >
                  View pathway <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}