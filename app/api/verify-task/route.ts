import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { THQ_FULL_CONTEXT, SEO_RULEBOOK } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { taskTitle, taskDescription, category, evidenceLink, agencyResponse } = await req.json()

    const prompt = `You are a digital marketing verification specialist for THQ (Trading Headquarters).

${THQ_FULL_CONTEXT}

${SEO_RULEBOOK}

TASK TO VERIFY:
Title: ${taskTitle}
Description: ${taskDescription}
Category: ${category}
Evidence URL: ${evidenceLink || 'None provided'}
Agency Response: ${agencyResponse || 'None provided'}

VERIFICATION INSTRUCTIONS:
Based on the task description, evidence URL, and agency response:

For SEO tasks:
- Check if the evidence URL is a real THQ product/page URL
- Verify the response mentions correct page title format (max 60 chars, includes geo keyword)
- Check for meta description mention (max 155 chars, includes 1800 084 700)
- Check for word count compliance (400-600 words for products)
- Check for internal blog links inclusion
- Check geo targeting is correct (VIC vs QLD not mixed)

For Google Ads / Meta tasks:
- Verify the response describes specific campaign changes
- Check for mention of cost metrics or ROAS improvements

For Local/GEO tasks:
- Check for specific GBP updates or review responses described
- Verify suburb/location specificity

For content/AI tasks:
- Check if URL shows published content
- Verify word count and keyword targeting mentioned

Return ONLY valid JSON in this format:
{
  "result": "Pass",
  "reason": "Specific explanation of why it passes or fails"
}

Valid results: "Pass", "Fail", "Needs Manual Review"

Use "Needs Manual Review" when:
- Evidence URL is not provided or is not a THQ URL
- Task is not SEO/content based and cannot be automatically verified
- Insufficient information to make a determination

Use "Pass" only when clear evidence of completion is present.
Use "Fail" when specific requirements from the rulebook are clearly not met.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json({ result: 'Needs Manual Review', reason: 'Could not parse verification response' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Verify task error:', error)
    return NextResponse.json(
      { result: 'Needs Manual Review', reason: 'Verification service error — please review manually' },
      { status: 200 }
    )
  }
}
