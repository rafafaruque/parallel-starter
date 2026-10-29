"use client";

// This page needs browser interactivity: state, input changes, and form submission.
// "use client" lets this component use React hooks and event handlers.
import { useState } from "react";
import type { FormEvent } from "react";

type ResearchResponse = {
  query: string;
  summary: string;
  results: {
    title: string;
    url: string;
    snippet: string;
  }[];
};

type ErrorResponse = {
  error: string;
};

export default function Home() {
  // useState remembers values between renders. Each setter updates a value
  // and asks React to render the page again with that new value.
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ResearchResponse | null>(null);

  // async allows await, which waits for a promise without blocking the browser.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // A normal form reloads the page. We handle its submission ourselves instead.
    event.preventDefault();
    setError("");
    setResults(null);

    if (!query.trim()) {
      setError("Please enter a research query.");
      return;
    }

    setLoading(true);

    try {
      // fetch sends a POST request to our own backend. JSON.stringify turns
      // the JavaScript object into JSON text for the request body.
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      // response.json() parses the backend's JSON text into a JavaScript object.
      const data: ResearchResponse | ErrorResponse = await response.json();

      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "Something went wrong. Please try again.",
        );
      }

      // Updating state makes React render the summary and results below.
      setResults(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      // This runs after either success or failure.
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Research Playground</h1>
        <p>A simple playground for exploring Parallel&apos;s APIs.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <label htmlFor="query">Research query</label>
        <div className="search-row">
          <input
            id="query"
            name="query"
            type="text"
            placeholder="What would you like to research?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="results" aria-labelledby="results-heading" aria-busy={loading}>
        <h2 id="results-heading">Results</h2>
        <div aria-live="polite" aria-atomic="true">
          {loading && <p className="placeholder">Searching for your query…</p>}

          {!loading && !results && (
            <p className="placeholder">Your research results will appear here.</p>
          )}

          {results && (
            <>
              <div className="summary">
                <p className="query">Results for “{results.query}”</p>
                <h3>Summary</h3>
                <p>{results.summary}</p>
              </div>
              <ul className="result-list">
                {results.results.map((result) => (
                  <li key={result.url}>
                    <h3><a href={result.url}>{result.title}</a></h3>
                    <p className="result-url">{result.url}</p>
                    <p>{result.snippet}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
