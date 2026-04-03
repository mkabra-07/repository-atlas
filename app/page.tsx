import { AnalyzeForm } from "@/components/analyze-form";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Repository Atlas</p>
          <h1>Understand a public GitHub repository before you even clone it.</h1>
          <p className="hero-text">
            Paste a repository URL to generate a visual map of folders, files, entry points, and cross-module
            relationships. The analyzer combines deterministic structure extraction with AI summaries for quick
            onboarding.
          </p>
        </div>
        <AnalyzeForm />
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h2>Structure-first analysis</h2>
          <p>See the repository tree, key files, framework hints, tests, documentation, and CI presence.</p>
        </article>
        <article className="feature-card">
          <h2>Interactive dependency graph</h2>
          <p>Move between folders and modules, highlight hotspots, and switch between file-level and grouped views.</p>
        </article>
        <article className="feature-card">
          <h2>Shareable analysis pages</h2>
          <p>Revisit cached snapshots, share a link with teammates, and trigger a fresh scan when needed.</p>
        </article>
      </section>
    </main>
  );
}

