# AI Assistant — Design Document

> **Status:** Planned — not yet built. This document is the complete spec ready for implementation.

An AI chat assistant embedded in Electro that helps electricians look up product prices, research kit configurations, and navigate Belgian electrical regulations (AREI/RGIE) — all without leaving the quoting tool.

---

## What it does

A chat panel (accessible from any page via a floating button) where the electrician can ask:

- "What's the AREI regulation for socket circuits in a kitchen?"
- "How many 20A breakers do I need for a 200A panel?"
- "What's the current Cebeo price for 14/2 NMD wire?"
- "Show me a typical kit for a 3-way switch installation"
- "What VAT rate applies to this renovation job?"

The assistant can search the web, fetch product pages, and pull RGIE regulation text. It stays strictly within electrical and pricing topics — off-topic questions get a polite redirect.

---

## Chosen stack — all free

| Layer | Tool | Why |
|---|---|---|
| LLM | **Groq** (`llama-3.3-70b-versatile`) | Permanently free, no CC, 1,000 req/day, 300–1,000 tokens/sec |
| Web search | **Jina AI** (`s.jina.ai`) | Free (500 RPM), returns full page content not just snippets — ideal for AI |
| Page reader | **Jina Reader** (`r.jina.ai/URL`) | Converts any URL (product page, regulation page) to clean markdown |
| SDK | **Vercel AI SDK** (`ai` package) | Next.js-native, built-in streaming, typed tool calling, supports Groq out of box |
| Guardrails | **System prompt + Groq Prompt Guard 22M** | Free, 22M param model on Groq for classifying injection/off-topic attempts |
| Regulation source | **ejustice.just.fgov.be** (public law) | Full AREI/RGIE text in NL + FR, public domain, safe to use in RAG |
| Vector store (future) | **Supabase pgvector** | Already in stack, free tier |

> **Why Vercel AI SDK over LangChain?** LangChain.js is heavyweight, Python-first, and adds significant bundle size and debugging complexity. Vercel AI SDK is TypeScript-native, 5KB, integrates with Next.js streaming routes natively, and supports every provider we need with a one-line import swap.

> **Why Groq over other free providers?** Groq's free tier is permanent (not trial credits), doesn't require a credit card, and is the fastest public inference available. Llama 3.3-70B at 1,000 RPD is far more than one electrician will use. Gemini Flash (1,500 req/day, 10 RPM) is a solid fallback for large-context tasks.

---

## Architecture

```
User types message
       │
       ▼
[Groq Prompt Guard 22M]  ← fast injection/off-topic classifier
       │ safe
       ▼
[POST /api/assistant]    ← Next.js route handler, edge runtime
       │
       ▼
  Vercel AI SDK
  streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: SYSTEM_PROMPT,
    tools: { searchWeb, fetchPage, lookupCatalog },
    messages,
  })
       │
       ├── tool call: searchWeb(query)
       │     └── POST s.jina.ai → returns search results
       │
       ├── tool call: fetchPage(url)
       │     └── GET r.jina.ai/{url} → returns page as markdown
       │
       └── tool call: lookupCatalog(query)
             └── SELECT from catalog_products WHERE name ILIKE query
                 (user's own catalog, Supabase, no extra service)
       │
       ▼
  Streaming response → useChat() hook → chat UI
```

---

## System prompt (the rubric)

```
You are an AI assistant for Belgian electrical contractors.

You help with:
- Belgian electrical regulations (AREI/RGIE — Algemeen Reglement Elektrische Installaties)
- Electrical product information, kit configurations, and wiring practices
- Material pricing and supplier information (Cebeo, Rexel, Sonepar, etc.)
- VAT/BTW rates for electrical work in Belgium (6% renovation, 21% new-build)
- Takeoff and quoting calculations

You do NOT help with:
- Topics unrelated to electrical work, pricing, or Belgian regulations
- Legal advice beyond explaining what a regulation says
- Medical, financial, or other professional domains

If a question is outside your scope, respond with:
"I'm focused on electrical topics. For [topic], you'd need to consult [appropriate resource]."

When citing regulations, always reference the AREI/RGIE article number.
When quoting prices, note that supplier prices are customer-specific and may differ.
Always respond in the same language the user writes in (Dutch, French, or English).
```

---

## Guardrails in detail

### Layer 1 — System prompt
Covers 95% of off-topic cases. No latency cost, no extra API call. The LLM refuses and redirects.

### Layer 2 — Groq Prompt Guard 22M
Before passing any message to the main LLM, run it through `meta-llama/llama-prompt-guard-2-22m` (also on Groq free tier). This 22M-parameter model is specifically trained to detect:
- Prompt injection attacks ("ignore previous instructions…")
- Jailbreak attempts ("pretend you are DAN…")
- Off-topic manipulation

It returns a classification label in ~10ms. If flagged, reject before touching the main model. Costs near-zero tokens.

### Layer 3 — Simple keyword pre-filter (optional)
A TypeScript function that checks if the message has ANY electrical/pricing keyword. If not — reject immediately without any API call. Example denied inputs: "write me a poem", "what's the weather". Zero cost.

---

## Tools (function calling)

### `searchWeb`
```typescript
{
  description: "Search the web for electrical product info, prices, or regulations",
  parameters: z.object({
    query: z.string().describe("Search query — be specific, e.g. 'Cebeo price 14/2 NMD wire Belgium'"),
  }),
  execute: async ({ query }) => {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
    });
    return res.text(); // returns top results as markdown
  }
}
```

### `fetchPage`
```typescript
{
  description: "Fetch the full content of a specific URL (product page, regulation article, datasheet)",
  parameters: z.object({
    url: z.string().url().describe("URL to fetch"),
  }),
  execute: async ({ url }) => {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
    });
    return res.text(); // returns page as clean markdown
  }
}
```

### `lookupCatalog`
```typescript
{
  description: "Search the electrician's own product catalog for prices and SKUs",
  parameters: z.object({
    query: z.string().describe("Product name or partial SKU"),
  }),
  execute: async ({ query }, { userId }) => {
    const { data } = await supabase
      .from('catalog_products')
      .select('sku, name, supplier, price, category')
      .eq('owner', userId)
      .ilike('name', `%${query}%`)
      .limit(10);
    return JSON.stringify(data);
  }
}
```

---

## UI

A floating chat button (bottom-right corner, purple circle with a lightning bolt icon). On click, opens a slide-in panel over the right side of the screen.

- Does not replace the quote builder — both are usable at once
- Chat history persists in memory for the session, cleared on page reload (no persistent history needed for v1)
- Streaming responses — text appears word-by-word like ChatGPT
- Tool calls shown as subtle "Searching web…" / "Fetching page…" status lines
- Language: auto-detects Dutch/French/English from first message

---

## Environment variables to add

```env
GROQ_API_KEY=         # From console.groq.com — free, no CC
JINA_API_KEY=         # From jina.ai — free, 10M tokens on signup
```

Gemini fallback (optional):
```env
GOOGLE_GENERATIVE_AI_API_KEY=   # From aistudio.google.com — free
```

---

## AREI/RGIE regulation source

The full AREI regulation is Belgian public law and freely usable:
- **Dutch**: https://www.ejustice.just.fgov.be/eli/arrete/2019/09/08/2019014633/justel
- **French**: same URL, FR version available via language toggle

**v1 approach (simplest):** At query time, if the question mentions AREI/RGIE, use `fetchPage` with the Justel URL to pull the relevant section. No pre-indexing needed — Jina Reader handles the conversion to markdown, the LLM navigates it.

**v2 approach (better for frequent regulation lookups):** Chunk the RGIE into articles, embed with a free model (HuggingFace `all-MiniLM-L6-v2`), store in Supabase pgvector. At query time, retrieve the top 5 relevant articles and inject them into context. Keeps the call count low and reduces hallucination on specific article numbers.

Gemini Flash's 1M token context window means you could potentially stuff the entire RGIE in one call without any chunking — worth testing before building the vector pipeline.

---

## What NOT to build in v1

- Persistent chat history (localStorage is fine for session)
- User feedback / thumbs up-down rating
- Fine-tuned model (expensive, unnecessary)
- Multi-turn conversation summarisation (Groq's context is large enough)
- Voice input
- Image recognition (wiring diagram analysis) — interesting, add later

---

## Implementation order

1. Add `GROQ_API_KEY` and `JINA_API_KEY` to `.env.local` + Vercel
2. Install: `bun add ai @ai-sdk/groq`
3. Create `src/app/api/assistant/route.ts` — streaming route with system prompt + 3 tools
4. Create `src/hooks/useAssistant.ts` — wraps `useChat` from `ai/react`
5. Create `src/components/AssistantPanel.tsx` — floating button + slide-in chat UI
6. Add Prompt Guard pre-check to the API route
7. Wire `lookupCatalog` tool to authenticated user's Supabase catalog
8. Test with real AREI questions in Dutch + French

Total: ~300 lines of new code, 2 new dependencies (`ai`, `@ai-sdk/groq`).

---

## Cost estimate

| Provider | Free tier | Estimated daily usage (1 electrician) | Headroom |
|---|---|---|---|
| Groq (LLM) | 1,000 req/day, 14,400 req/day (8B) | ~30–50 queries | 20–30× headroom |
| Jina AI (search) | 500 RPM, 10M tokens/month | ~30–50 searches | Large |
| Jina Reader (pages) | Same pool | ~20–30 page fetches | Large |
| Groq Prompt Guard | Same Groq free tier | Same as LLM calls | Negligible tokens |

**Total cost: €0/month for one electrician, likely €0/month for 10–20 electricians.**

---

*Research completed: 2026-07-02. Sources: Groq docs, Vercel AI SDK docs, Jina AI docs, ejustice.just.fgov.be, bativolt.com.*
