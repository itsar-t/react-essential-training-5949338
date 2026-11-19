import { Suspense } from "react";
import { cacheLife } from "next/cache";

const TABLE_URL = "https://statistikdatabasen.scb.se/api/v2/tables/TAB5932";
const SOURCE_URL =
  "https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__AM__AM0110__AM0110A/LoneSpridSektYrk4AN/";

const MEASURES = [
  {
    code: "000007CE",
    label: "Medianlön",
    description: "50 procent har denna lön eller lägre.",
  },
  {
    code: "000007CD",
    label: "Medellön",
    description: "Den genomsnittliga månadslönen.",
  },
  {
    code: "000007CG",
    label: "25:e percentilen",
    description: "25 procent har denna lön eller lägre.",
  },
  {
    code: "000007CH",
    label: "75:e percentilen",
    description: "75 procent har denna lön eller lägre.",
  },
];

async function getScbData(path) {
  "use cache";
  cacheLife("days");

  const response = await fetch(`${TABLE_URL}/${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`SCB svarade med HTTP ${response.status}`);
  }

  return response.json();
}

function getSelection(value, labels, fallback) {
  if (typeof value === "string" && Object.hasOwn(labels, value)) {
    return value;
  }

  return fallback;
}

function formatSalary(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Uppgift saknas";
  }

  return `${new Intl.NumberFormat("sv-SE").format(value)} kr`;
}

async function SalaryContent({ searchParams }) {
  const params = await searchParams;
  let metadata;

  try {
    metadata = await getScbData("metadata?lang=sv");
  } catch (error) {
    console.error("Kunde inte hämta SCB:s yrkeslista", error);

    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
        <p>Det gick inte att hämta lönestatistiken från SCB just nu.</p>
        <a href="/loner" className="mt-3 inline-block font-semibold underline">
          Försök igen
        </a>
      </div>
    );
  }

  const occupations = metadata.dimension.Yrke2012.category.label;
  const sectors = metadata.dimension.Sektor.category.label;
  const years = metadata.dimension.Tid.category.label;
  const yearCodes = Object.keys(years).sort((a, b) => Number(b) - Number(a));

  const occupation = getSelection(params.yrke, occupations, "0000");
  const sector = getSelection(params.sektor, sectors, "0");
  const year = getSelection(params.ar, years, yearCodes[0]);

  const query = new URLSearchParams({
    lang: "sv",
    outputFormat: "json-stat2",
    "valueCodes[Yrke2012]": occupation,
    "valueCodes[Sektor]": sector,
    "valueCodes[Kon]": "1+2",
    "valueCodes[Tid]": year,
    "valueCodes[ContentsCode]": MEASURES.map((measure) => measure.code).join(","),
  });

  let dataset = null;
  let errorMessage = "";

  try {
    dataset = await getScbData(`data?${query.toString()}`);
  } catch (error) {
    console.error("Kunde inte hämta SCB:s löneuppgifter", error);
    errorMessage = "SCB kunde inte lämna ett svar just nu. Försök igen om en stund.";
  }

  const sortedOccupations = Object.entries(occupations).sort((a, b) =>
    a[1].localeCompare(b[1], "sv"),
  );

  return (
    <>
      <form
        action="/loner"
        method="GET"
        className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6"
      >
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="yrke" className="mb-2 block text-sm font-semibold text-slate-800">
            Yrkesgrupp
          </label>
          <select
            id="yrke"
            name="yrke"
            defaultValue={occupation}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
          >
            {sortedOccupations.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="sektor" className="mb-2 block text-sm font-semibold text-slate-800">
            Sektor
          </label>
          <select
            id="sektor"
            name="sektor"
            defaultValue={sector}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
          >
            {Object.entries(sectors).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ar" className="mb-2 block text-sm font-semibold text-slate-800">
            Statistikår
          </label>
          <select
            id="ar"
            name="ar"
            defaultValue={year}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
          >
            {yearCodes.map((code) => (
              <option key={code} value={code}>
                {years[code]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white sm:w-auto transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-span-2 sm:justify-self-start"
        >
          Visa lönestatistik
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          {errorMessage}
        </p>
      )}

      {dataset && (
        <section aria-labelledby="salary-results" className="mt-10">
          <h2 id="salary-results" className="text-2xl font-bold tracking-tight text-slate-900">
            {occupations[occupation]}
          </h2>
          <p className="mt-2 text-slate-600">
            {sectors[sector]} · Hela Sverige · Kvinnor och män totalt · {year}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Månadslön före skatt, uppräknad till heltid.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {MEASURES.map((measure) => {
              // Övriga dimensioner har ett enda valt värde i denna fråga.
              const index = dataset.dimension.ContentsCode.category.index[measure.code];
              const value = dataset.value[index];

              return (
                <div key={measure.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <dt className="font-medium text-slate-600">{measure.label}</dt>
                  <dd className="mt-3 text-2xl font-bold sm:text-3xl tracking-tight text-indigo-700 tabular-nums">
                    {formatSalary(value)}
                  </dd>
                  <dd className="mt-2 text-sm text-slate-600">{measure.description}</dd>
                </div>
              );
            })}
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-slate-600">
            Lönen påverkas bland annat av erfarenhet, ansvar och arbetsuppgifter.
            Uppgift saknas när statistiken är otillgänglig, för osäker eller skyddad av sekretess.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Källa SCB / Medlingsinstitutet. Tabell TAB5932. Statistikår {year}.
          </p>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-indigo-700 underline underline-offset-4"
          >
            Läs tabellen och metodinformationen hos SCB (ny flik)
          </a>
        </section>
      )}
    </>
  );
}

export default function SalaryPage({ searchParams }) {
  return (
    <main className="mx-auto w-full max-w-4xl rounded-2xl bg-slate-50 px-4 py-8 font-sans sm:px-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Lönekollen</h1>
      <p className="mb-8 mt-3 max-w-2xl leading-relaxed text-slate-600">
        Utforska löner för olika yrkesgrupper som underlag för yrkesval och samtal med din coach.
      </p>

      <Suspense fallback={<p role="status" className="text-slate-600">Hämtar lönestatistik från SCB…</p>}>
        <SalaryContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
