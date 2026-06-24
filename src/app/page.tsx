import { TakeoffForm } from "@/components/takeoff/TakeoffForm";

export default function QuotePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mb-1">
          Electro
        </p>
        <h1 className="text-xl font-semibold">Residential Apartment — Unit 4B</h1>
      </header>

      <TakeoffForm />
    </main>
  );
}
