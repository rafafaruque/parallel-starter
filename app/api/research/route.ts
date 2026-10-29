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
