import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { THQ_FULL_CONTEXT } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Fetch current metrics
    const { data: metrics } = await supabase
      .from('metrics')
      .select('metric_name, section, last_month_value, this_month_value, trend, target')
      .order('sort_order')

    // Fetch context memory
    const { data: contextMemory } = await supabase
      .from('context_memory')
      .select('context_text, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    // Fetch completed/verified tasks for context
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('title, status, admin_context')
      .in('status', ['Verified', 'Done'])
      .order('created_at', { ascending: false })
      .limit(30)

    const metricsText = metrics?.map(m =>
      `${m.metric_name} (${m.section}): Last=${m.last_month_value || 'N/A'}, This Month=${m.this_month_value || 'N/A'}, Target=${m.target || 'N/A'}, Trend=${m.trend}`
    ).join('\n') || 'No metrics available'

    const contextText = contextMemory?.map(c => `- ${c.context_text}`).join('\n') || 'No context saved'

    const completedText = completedTasks?.map(t =>
      `- [${t.status}] ${t.title}${t.admin_context ? ` (Note: ${t.admin_context})` : ''}`
    ).join('\n') || 'No completed tasks'

    const prompt = `You are a specialist digital marketing strategist for THQ (Trading Headquarters), an Australian outdoor living products company.

${THQ_FULL_CONTEXT}

CURRENT METRICS (use these to determine task priority):
${metricsText}

SAVED CONTEXT (things already noted, completed, or irrelevant - DO NOT repeat these):
${contextText}

RECENTLY COMPLETED/VERIFIED TASKS (do not generate duplicates):
${completedText}

INSTRUCTIONS:
Generate exactly 8-10 specific, actionable digital marketing tasks for THQ based on the current metrics above.

Rules:
- Tasks must be specific to named products, specific suburbs, specific keywords — never generic
- If Keywords Page 1 VIC is below target, prioritise VIC SEO product page optimisation tasks
- If Keywords Page 1 QLD is below target, prioritise QLD SEO tasks
- If Google Ads ROAS is below 3x, generate paid campaign optimisation tasks
- If AI Mentions are below 50, generate content tasks targeting LLM visibility
- If GBP metrics are low, generate local SEO tasks
- Never suggest tasks that appear in the completed tasks list
- Never suggest tasks that appear in the saved context as done or irrelevant
- Mix categories: include SEO, Paid, Local, GEO/AI tasks proportionally based on what needs work

TASK FORMAT — keep tasks small and completable in under 2 hours:
- title: One clear action headline, max 10 words (e.g. "Update meta description for Teak Decking Melbourne page")
- description: Exactly 2-3 sentences. Sentence 1: what to do. Sentence 2: where/which specific page or product. Sentence 3: the specific outcome or rule to follow (e.g. include 1800 084 700, target keyword X, max 155 chars). No bullet points. No lengthy explanations.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "tasks": [
    {
      "title": "One clear action headline max 10 words",
      "description": "What to do. Which specific page or product. The specific rule or outcome to achieve.",
      "category": "SEO"
    }
  ]
}

Valid categories: SEO, Google Ads, Meta, GEO, Local`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Generate tasks error:', error)
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 })
  }
}
