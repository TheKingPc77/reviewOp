import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { progressData, bodyMetrics, userId } = await request.json()

    // Gerar insights detalhados sobre o progresso
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um analista de dados fitness especializado em interpretação de métricas corporais.
          Analise os dados de progresso e gere insights acionáveis em formato JSON com:
          1. trends: tendências identificadas (array de strings)
          2. recommendations: recomendações específicas (array de strings)
          3. highlights: destaques positivos (array de strings)
          4. areas_to_improve: áreas que precisam atenção (array de strings)
          
          Seja específico, técnico e forneça ações práticas.`
        },
        {
          role: "user",
          content: `Analise estes dados de progresso:
          
          Evolução de peso: ${JSON.stringify(progressData || [])}
          
          Métricas corporais:
          - Peso perdido: ${bodyMetrics?.weight_lost || 0}kg
          - Gordura reduzida: ${bodyMetrics?.body_fat_reduced || 0}%
          - Massa muscular: ${bodyMetrics?.muscle_gained || 0}kg
          - Desenvolvimento por região:
            * Braços: ${bodyMetrics?.arms || 0}%
            * Peito: ${bodyMetrics?.chest || 0}%
            * Costas: ${bodyMetrics?.back || 0}%
            * Abdômen: ${bodyMetrics?.abdomen || 0}%
            * Pernas: ${bodyMetrics?.legs || 0}%
          
          Forneça insights detalhados em JSON.`
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    })

    const insights = JSON.parse(response.choices[0].message.content || "{}")

    return NextResponse.json({
      success: true,
      insights,
    })
  } catch (error: any) {
    console.error("Erro ao gerar insights:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar insights" },
      { status: 500 }
    )
  }
}
