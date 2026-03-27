import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { THQ_FULL_CONTEXT, SEO_RULEBOOK } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    const prompt = `You are an expert SEO analyst specialising in Australian e-commerce and outdoor living products. You are analysing the website for THQ (Trading Headquarters).

${THQ_FULL_CONTEXT}

${SEO_RULEBOOK}

WEBSITE TO ANALYSE: ${url}

Based on your knowledge of thq.com.au (a Shopify-based outdoor living e-commerce site selling composite decking, wall cladding, artificial grass, pergolas, electric fireplaces and treated pine in Victoria and Queensland), provide a detailed analysis.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "seoHealth": "2-3 paragraph summary of current SEO health including what's working well and main issues. Be specific about title tags, meta descriptions, page structure, keyword targeting, and content quality based on the THQ SEO rulebook.",
  "topPages": "List of estimated top-performing pages based on the site structure and product range. Include specific URLs or page types that likely rank well for their target keywords. Format as a readable list.",
  "contentGaps": "Specific content gaps based on the THQ keyword clusters and product range. List missing pages, thin content areas, and topics that competitors likely rank for. Be specific about which product categories and geo-targeted terms are underserved.",
  "quickWins": "5-7 specific, immediately actionable recommendations that will have the biggest SEO impact in the shortest time. Reference specific pages, products, or keywords. Prioritise by impact. Format as a numbered list."
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Analyse website error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
