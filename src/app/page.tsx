import { TakeoffForm } from "@/components/takeoff/TakeoffForm";

export default function QuotePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <header
        className="mb-10 pl-4"
        style={{ borderLeft: "2px solid var(--accent)" }}
      >
        <h1
          className="font-semibold text-[var(--ink)]"
          style={{ fontSize: "36px", lineHeight: 1.1, letterSpacing: "-0.8px" }}
        >
          Residential Apartment — Unit 4B
        </h1>
      </header>

      <TakeoffForm />
    </main>
  );
}
