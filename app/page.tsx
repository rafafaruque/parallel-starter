"use client";

// This page needs browser interactivity: state, input changes, and form submission.
// "use client" lets this component use React hooks and event handlers.
import { useState } from "react";
import type { FormEvent } from "react";

type ResearchResponse = {
  query: string;
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
  // query: stores the current value, such as 'what is Parallel AI?'
  // setQuery: a function to update the value, such as setQuery('what is Parallel AI?')
        // basically, i type anything, onChange fires, setQuery updates the state, and 
        // React re-renders the component, and then the input displays what i typed.
  // useState("") initializes the value to an empty string. The type is inferred as string.
  const [loading, setLoading] = useState(false);
  // whether a research request is in progress. This disables the input and button while waiting for a response.
  const [error, setError] = useState("");
  // an error message to display if the research request fails. This is empty when there is no error.
  const [results, setResults] = useState<ResearchResponse | null>(null);
  // the research results returned from the backend. This is null when there are no results.

  // async allows await, which waits for a promise without blocking the browser.
  // this function runs when we submit a search
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // A normal form reloads the page. We handle its submission ourselves instead.
    event.preventDefault(); // stops browser default form reload, bc we want to update the page
    // without resetting the current state
    setError(""); // clears previous error messages
    setResults(null); // removes the previous search results

    if (!query.trim()) {
      // query.trim() removes whitespace from the beginning and end of the query. If the query is empty, we show an error message and return early.
      // !query.trim() checks whether the query input is empty after trimming
      setError("Please enter a research query.");
      return; // stops the function if the input is valid
    }

    setLoading(true); // tells React the search is in progress, which disables the input and button
    // remember the useState variable? 

    try {
      // fetch sends a POST request to our own backend. JSON.stringify turns
      // the JavaScript object into JSON text for the request body.
      const response = await fetch("/api/research", {
        // await means we wait for the fetch to finsih getting the response before continuing
        // fetch makes an http request to the given url (endpoint), which here is /api/research,
        // this endpoint is defined in app/api/research/route.ts, and it handles the request and returns a response.
        // we do this handling in the backend instead of the frontend here for security
            // page.tsx is the browser or frontend, route.ts is the backend which reads the key and calls Parallel
        method: "POST", // means we are sending information to the server
        headers: { "Content-Type": "application/json" },
        // the headers tell the server that we are sending JSON data in the request body
        body: JSON.stringify({ query: query.trim() }),
        // converts the javascript object into a json string, which is sent to the server as the request body. The server will parse this json string back into a javascript object.
      });

      // response.json() parses the backend's JSON text into a JavaScript object.
      // await waits until the response body has been read and parsed
      // the type of data is either ResearchResponse or ErrorResponse, depending on whether the request was successful or not
      const data: ResearchResponse | ErrorResponse = await response.json();

      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "Something went wrong. Please try again.",
        );
      } // if backend reports a failure, code throws an error
      // response.ok is true for HTTP status codes from 200 to 299

      // otherwise, setResults(date) updates the results state with the research results 
      // returned from the backend, which triggers a re-render of the page to display the results.
      // Updating state makes React render the results below.
      setResults(data);
    } catch (error) { // handles errors such as network failures or backend errors. The error is caught and displayed to the user.
      setError( // makes an error message to display to the user. If the error is an instance of Error, we use its message property. Otherwise, we use a generic error message.
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      // the finally block runs regardless of either success or failure.
      setLoading(false); // returns the button to its normal state
    }
  }

  return (
    <main>
      <header>
        <h1>Research Playground</h1>
        <p>A simple playground for exploring Parallel&apos;s APIs.</p>
      </header>

      <form onSubmit={handleSubmit}> {/* // this line connects the form to the function */}
        {/* // when we click the Search button, the form submits and React runs handleSubmit() */}
        <label htmlFor="query">Research query</label>
        <div className="search-row">
          <input
            id="query"
            name="query"
            type="text"
            placeholder="What would you like to research?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // when we type a character, the input's value changes, which calls setQuery 
            // to update the query state, which re-renders the input with the new query value.
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
            {/* // basically means if loading is true, show "Searching…", else show "Search" */}
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
              </div>
              {results.results.length === 0 && (
                <p className="placeholder">No results found. Try a different research query.</p>
              )}
              <ul className="result-list">
                {results.results.map((result) => ( // .map creates a new item for each item in results array
                // so if parallel returned 3 results, map would create 3 <li> items, one for each result
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
