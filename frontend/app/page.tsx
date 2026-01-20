import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const homeCards = [
  {
    title: "Profiles",
    description: "Multi-step wizard with drafts, Clerk-secured.",
  },
  {
    title: "RAG Engine",
    description: "Hybrid semantic + keyword search via Pinecone.",
  },
  {
    title: "Insights",
    description: "Match scores and timelines ready for Chart.js.",
  }
]

export default function Home() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <section className="space-y-6">
        <Badge variant="secondary">SIRA • RAG-powered academic advisor</Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Guide every student to the right program with confidence.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Capture rich profiles, run hybrid retrieval over curated university data, and deliver
            transparent, cite-backed recommendations powered by Mistral + LlamaIndex.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Start a profile</Button>
          <Button size="lg" variant="outline">
            Explore recommendations
          </Button>
        </div>
        {/* <div className="grid gap-4 sm:grid-cols-3">
          {homeCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div> */}
      </section>
      <aside className="rounded-2xl border border-border/70 bg-muted/40 p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recommendation Flow
          </p>
          <h2 className="text-2xl font-semibold text-foreground">From profile to decision</h2>
          <p className="text-sm text-muted-foreground">
            Keep every step auditable with agentic retrieval, ranking, and reporting.
          </p>
        </div>
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Collect 360° student context</p>
            <p className="text-sm text-muted-foreground">
              Draft-friendly forms capture goals, scores, constraints, and interests in minutes.
            </p>
          </TabsContent>
          <TabsContent value="retrieval" className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Hybrid search with guardrails</p>
            <p className="text-sm text-muted-foreground">
              Agents validate keywords before Pinecone retrieval to avoid missed institutions.
            </p>
          </TabsContent>
          <TabsContent value="insights" className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Explainable matches</p>
            <p className="text-sm text-muted-foreground">
              Surface match scores, difficulty, and citations ready for counselor review.
            </p>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
