/* ===================================================================
   LOCKED — the coach Worker.

   Cloudflare Worker. One route, POST /coach. It takes the thread and
   whatever the person has allowed the coach to see, asks a model, and
   returns prose plus zero or more ACTIONS the app may offer to apply.

   THE CONTRACT WITH THE CLIENT

   The Worker never writes anything. It proposes. Everything it returns
   passes through 08-build/coach-actions.js on the device, which resolves
   every exercise id against the real catalogue, recomputes every total
   from its parts, bounds every number, and refuses anything that fails.
   A card is drawn from the CHECKED action, not from this response.

   That split is deliberate. This file can be wrong — a model will name
   an exercise that does not exist and state a calorie total that does
   not match its own ingredients — and none of it can reach somebody's
   training data. Do not move validation here and trust it; validate in
   both places, and let the device have the last word.

   WHAT THE PERSON ALLOWED

   The client sends `sources`, the nine switches from the Coach's Setup
   pane. Anything switched off is absent from the request, and the system
   prompt is told which are off so it can say it cannot see something
   rather than guessing. Never infer from data that is not there.

   DEPLOY
     wrangler deploy
     wrangler secret put ANTHROPIC_API_KEY
   =================================================================== */

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;

/* The actions the coach may propose. This is the whole vocabulary: a
   kind not in here is refused on the device, so adding one means adding
   it to coach-actions.js first. */
const ACTION_SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'What you say. Plain prose, no markdown, no headings. Two short paragraphs at most.'
    },
    actions: {
      type: 'array',
      maxItems: 6,
      description: 'Things to offer to write into the app. Empty unless the person asked for something that is a change to their data.',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['split', 'goal', 'recipe', 'shopping', 'food', 'cardio', 'instructions', 'fact'] },
          title: { type: 'string', description: 'The card heading. Five words or so.' },
          split: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              days: {
                type: 'array', maxItems: 7,
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    exercises: {
                      type: 'array', maxItems: 12,
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'The exercise name EXACTLY as it appears in the catalogue you were given. If it is not in that list, do not use it.' },
                          sets: { type: 'integer', minimum: 1, maximum: 10 }
                        },
                        required: ['name']
                      }
                    }
                  },
                  required: ['name', 'exercises']
                }
              }
            },
            required: ['name', 'days']
          },
          goal: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['weight', 'bodyfat', 'lift', 'custom'] },
              name: { type: 'string' },
              exName: { type: 'string', description: 'For a lift goal: the catalogue name of the lift.' },
              target: { type: 'number' },
              start: { type: 'number' },
              targetDate: { type: 'string', description: 'YYYY-MM-DD, or omit for no deadline.' },
              notes: { type: 'string' }
            },
            required: ['type', 'name']
          },
          recipe: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              servings: { type: 'integer', minimum: 1, maximum: 24 },
              items: {
                type: 'array', maxItems: 40,
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'A food from the table you were given, by its exact name. For anything else you MUST give kcal, pro, carb and fat per serving — a calorie count alone is refused.' },
                    qty: { type: 'number' },
                    kcal: { type: 'number' }, pro: { type: 'number' },
                    carb: { type: 'number' }, fat: { type: 'number' }
                  },
                  required: ['name']
                }
              },
              notes: { type: 'array', items: { type: 'string' }, description: 'Method, one step per entry.' }
            },
            required: ['name', 'items']
          },
          items: {
            type: 'array', maxItems: 40,
            description: 'For kind=shopping.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }, quantity: { type: 'number' },
                unit: { type: 'string' }, category: { type: 'string' }
              },
              required: ['name']
            }
          },
          meal: {
            type: 'object',
            description: 'For kind=food.',
            properties: {
              name: { type: 'string' }, qty: { type: 'number' },
              slot: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
              kcal: { type: 'number' }, pro: { type: 'number' },
              carb: { type: 'number' }, fat: { type: 'number' }
            },
            required: ['name']
          },
          session: {
            type: 'object',
            description: 'For kind=cardio.',
            properties: {
              name: { type: 'string' },
              minutes: { type: 'number', minimum: 1, maximum: 600 },
              km: { type: 'number' }
            },
            required: ['name', 'minutes']
          },
          text: { type: 'string', description: 'For kind=instructions or kind=fact.' }
        },
        required: ['kind', 'title']
      }
    }
  },
  required: ['reply']
};

function systemPrompt(ctx) {
  const off = (ctx.sourcesOff || []);
  return [
    'You are the coach inside LOCKED, a training and nutrition app. You are talking to somebody who lifts.',
    '',
    'HOW YOU WRITE',
    'Plain, short, direct. No markdown, no headings, no bullet lists, no emoji. Two short paragraphs at most.',
    'Say the number and what to do with it. Never pad, never hedge, never repeat their question back to them.',
    '',
    'WHAT YOU CAN SEE',
    off.length
      ? 'These sources are switched OFF and you have none of them: ' + off.join(', ') +
        '. If a question needs one, say plainly that it is off in Setup and that you cannot answer without it. Never guess at what is behind a switch somebody closed.'
      : 'Every source is switched on.',
    '',
    'ACTIONS',
    'When they ask for something that is a change to their data — a split, a goal, a recipe, a shopping list, a meal logged, a session logged, a change to how you coach them — return it in `actions`. Otherwise return none.',
    'An action is a PROPOSAL. They will see a card showing exactly what it would write, and decide. So propose the thing they asked for, whole, and do not describe it again at length in `reply`.',
    '',
    'THE RULES YOUR ACTIONS MUST OBEY',
    '1. Exercises: use ONLY the exact names from the catalogue below. An exercise not in that list is refused by the app and your card will not save. If what you want is not there, pick the nearest that is and say so in `reply`.',
    '2. Foods: use the exact names from the food table below. For anything else you must give kcal, protein, carbs and fat — a calorie count on its own is refused.',
    '3. Do not state totals. The app recomputes every total from the parts; a recipe total you write is discarded. Give the parts right.',
    '4. Stay inside the bounds: at most 7 days in a split, 12 exercises a day, 1 to 10 sets, 1 to 24 servings, 1 to 600 minutes.',
    '',
    ctx.catalogue ? 'EXERCISE CATALOGUE (use these names exactly)\n' + ctx.catalogue : '',
    ctx.foods ? '\nFOOD TABLE (use these names exactly)\n' + ctx.foods : '',
    ctx.profile ? '\nABOUT THEM\n' + ctx.profile : '',
    ctx.training ? '\nTRAINING\n' + ctx.training : '',
    ctx.nutrition ? '\nNUTRITION\n' + ctx.nutrition : '',
    ctx.checkins ? '\nCHECK-INS\n' + ctx.checkins : '',
    ctx.instructions ? '\nHOW THEY ASKED TO BE COACHED\n' + ctx.instructions : ''
  ].filter(Boolean).join('\n');
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization'
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', ...CORS }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    const url = new URL(request.url);
    if (url.pathname !== '/coach') return json({ error: 'not found' }, 404);

    /* No key, no pretending. A Worker that answers from a canned string
       when its key is missing is worse than one that says it is missing:
       the app cannot tell the difference and neither can the reader. */
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'no_key',
        message: 'The coach is not configured on the server yet.' }, 503);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'bad_json' }, 400); }

    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    if (!messages.length) return json({ error: 'no_messages' }, 400);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: env.COACH_MODEL || MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(body.context || {}),
        messages: messages.map((m) => ({
          role: m.role === 'coach' ? 'assistant' : 'user',
          content: String(m.text || m.content || '').slice(0, 4000)
        })),
        /* Structured output, so the client never parses prose for markers.
           v6 scraped action markers out of the reply text and that is how a
           sentence about a split became a split. */
        tools: [{
          name: 'reply_with_actions',
          description: 'Reply to the lifter, and propose any changes to their data.',
          input_schema: ACTION_SCHEMA
        }],
        tool_choice: { type: 'tool', name: 'reply_with_actions' }
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      /* Rate limits and overload are the model's, and the app should say so
         rather than blaming the person's connection. */
      return json({ error: 'upstream', status: upstream.status,
        message: upstream.status === 429 ? 'The coach is rate limited right now.'
               : 'The coach could not be reached.',
        detail: detail.slice(0, 400) }, 502);
    }

    const data = await upstream.json();
    const block = (data.content || []).find((c) => c.type === 'tool_use');
    if (!block || !block.input) {
      return json({ error: 'no_structured_reply',
        message: 'The coach answered in a shape this app cannot read.' }, 502);
    }

    return json({
      reply: String(block.input.reply || ''),
      actions: Array.isArray(block.input.actions) ? block.input.actions.slice(0, 6) : [],
      usage: data.usage || null
    });
  }
};
