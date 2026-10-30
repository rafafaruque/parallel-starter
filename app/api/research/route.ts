// Next.js calls this function when a POST request reaches /api/research.
// This code runs on the server, separate from the page in the browser.
export async function POST(request: Request) {
  let body: unknown; // declares a variable named body
  // unknown is a TypeScript type that means "we don't know what this is yet." 
  // It is safer than any because it forces us to check the type before using it.

  try {
    // Wait for the incoming JSON body and parse it into a JavaScript value.
    body = await request.json();
  } catch { // if request.json() fails if the body is not valid JSON
    return Response.json({ error: "Please send a valid JSON body." }, { status: 400 }); // 400 means invalid/bad request
    // return immediately ends the function
  }

  // Check the input on the server too: callers can bypass the frontend form.
  if (
    typeof body !== "object" || // checks whether its an object
    body === null || // ensures its not null (bc JS considers null to be an object)
    !("query" in body) || // is there a query field in the body? (bc we expect a query field)
    typeof body.query !== "string" || // is the query field a string? (bc we expect a string)
    !body.query.trim() // is the query field empty or whitespace? (bc we expect a non-empty string)
  ) {
    return Response.json({ error: "Please enter a research query." }, { status: 400 });
    // 400 means invalid/bad request, throws this error if the input is invalid, and return immediately ends the function
  }

  // if checks pass, we can safely use body.query as a string and trim it
  const query = body.query.trim();
  // we trim it in the back and frontend because the backend can't assume every
  // request comes from the frontend, called defense in depth

  const apiKey = process.env.PARALLEL_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "Parallel API key is not configured. Add PARALLEL_API_KEY to .env.local and restart the server." },
      { status: 500 },
    );
  }

  let parallelData: unknown;

  try {
    // Our backend makes a second HTTP request, this time to Parallel Search.
    // notice how the frontends fetch calls our own backend, and our backend fetch calls Parallel's API. This is called a proxy.
    const parallelResponse = await fetch("https://api.parallel.ai/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The key stays on the server; it is never sent to our browser code.
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        search_queries: [query], // list of strings, in an array, because Parallel can handle multiple queries
        //  at once. each item is a sep stirng and theyre all sent together as 1 JSON request
        objective: body.query,
        // this is an optional field that tells Parallel what the user is trying to do, which helps it return better results. 
        // here we don't have that field, so we use the same value as the search query.
      }),
    });

    // fetch does not throw for HTTP errors, so check the status ourselves.
    // Return our own messages rather than forwarding Parallel's error body.
    if (!parallelResponse.ok) {
      if (parallelResponse.status === 401 || parallelResponse.status === 403) {
        return Response.json(
          { error: "Parallel authentication failed. Check PARALLEL_API_KEY on the server." },
          { status: 502 },
        );
      }

      if (parallelResponse.status === 429) {
        return Response.json(
          { error: "Parallel's rate limit was reached. Please try again later." },
          { status: 429 },
        );
      }

      return Response.json(
        { error: "Parallel Search returned an error. Please try again later." },
        { status: 502 },
      );
    }

    // Read Parallel's JSON text and parse it into a JavaScript value.
    parallelData = await parallelResponse.json();
  } catch {
    // Network failures and unreadable JSON both produce a safe error message.
    return Response.json(
      { error: "Unable to complete Parallel Search. Please try again." },
      { status: 502 },
    );
  }

  // Check external data before using it, just as we check the incoming query.
  if (
    typeof parallelData !== "object" ||
    parallelData === null ||
    !("results" in parallelData) ||
    !Array.isArray(parallelData.results)
  ) {
    return Response.json({ error: "Parallel returned an invalid search response." }, { status: 502 });
  }

  const results = [];

  for (const result of parallelData.results) {
    if (
      typeof result !== "object" ||
      result === null ||
      typeof result.url !== "string" ||
      !/^https?:\/\//i.test(result.url) ||
      (result.title != null && typeof result.title !== "string") ||
      !Array.isArray(result.excerpts) ||
      !result.excerpts.every((excerpt: unknown) => typeof excerpt === "string")
    ) {
      return Response.json({ error: "Parallel returned an invalid search result." }, { status: 502 });
    }

    // Keep only the fields our page expects. Join excerpts into one snippet.
    // Parallel may omit a title, so use that result's URL as its link text.
    results.push({
      title: result.title ?? result.url,
      url: result.url,
      snippet: result.excerpts.join(" "), // joins all the little excerpts
    });
  }

  // Response.json converts this object into a JSON response for the frontend.
  // The query comes from the request; research results come from Parallel Search.
  return Response.json({
    query,
    results,
  });
}
