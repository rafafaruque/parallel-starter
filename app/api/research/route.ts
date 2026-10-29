// Next.js calls this function when a POST request reaches /api/research.
// This code runs on the server, separate from the page in the browser.
export async function POST(request: Request) {
  let body: unknown;

  try {
    // Wait for the incoming JSON body and parse it into a JavaScript value.
    body = await request.json();
  } catch {
    return Response.json({ error: "Please send a valid JSON body." }, { status: 400 });
  }

  // Check the input on the server too: callers can bypass the frontend form.
  if (
    typeof body !== "object" ||
    body === null ||
    !("query" in body) ||
    typeof body.query !== "string" ||
    !body.query.trim()
  ) {
    return Response.json({ error: "Please enter a research query." }, { status: 400 });
  }

  const query = body.query.trim();

  // Response.json converts this object into a JSON response for the frontend.
  // Only the query comes from the request; all research content is mock data.
  return Response.json({
    query,
    summary: "This is a mock summary to demonstrate the research flow. The results below are sample data, and no external API has been called.",
    results: [
      {
        title: "Mock result: Topic overview",
        url: "https://example.com/overview",
        snippet: "A sample result that would introduce the topic and explain its main ideas.",
      },
      {
        title: "Mock result: Key considerations",
        url: "https://example.com/considerations",
        snippet: "A sample result that would explore useful details and questions for further research.",
      },
    ],
  });
}
