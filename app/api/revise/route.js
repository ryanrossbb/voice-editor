export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { draft, transcript, reviewerName, contentFormat } = await request.json();

    if (!draft || !transcript) {
      return Response.json(
        { error: 'Missing draft or transcript' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'Server misconfigured: ANTHROPIC_API_KEY not set' },
        { status: 500 }
      );
    }

    const name = (reviewerName || 'the reviewer').trim();
    const isMarkdown = contentFormat === 'markdown';

    const formatNote = isMarkdown
      ? `IMPORTANT: The draft is in Markdown format. Preserve ALL markdown structure exactly: headings (#, ##, ###), bold (**), italics (_), bulleted/numbered lists, links ([text](url)), and blockquotes. Only change content, not formatting, unless ${name} specifically asks you to.`
      : `The draft is plain text. Preserve paragraph breaks.`;

    const prompt = `You are revising a draft blog post based on spoken feedback from ${name}, a subject matter expert. Their feedback was transcribed from voice and may contain casual phrasing, filler words, or minor transcription errors — interpret it intelligently.

Your job:
- Incorporate ${name}'s substantive feedback into the draft
- Preserve the overall structure, voice, and tone unless they explicitly want those changed
- If they give a general direction ("punchier intro"), execute it well
- If they give specific edits ("change the second paragraph to say X"), apply them precisely
- Ignore filler words and asides that aren't actually instructions

${formatNote}

DRAFT:
${draft}

${name.toUpperCase()}'S FEEDBACK (transcribed from voice):
${transcript}

Return ONLY the revised draft. No preamble, no commentary, no markdown code fences around the whole response. Just the updated text, in the same format as the input.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return Response.json(
        { error: `Anthropic API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const revised = data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return Response.json({ revised });
  } catch (e) {
    console.error('Revise route error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
