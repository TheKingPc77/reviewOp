import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { metrics, photoCount, progressData, userId } = await request.json()

    // Gerar feedback motivacional personalizado com IA
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer motivacional especializado em acompanhamento de progresso fitness.
          Gere um feedback curto (máximo 2-3 frases), motivacional e personalizado baseado nos dados do usuário.
          Seja específico com os números, celebre conquistas e incentive a continuar.
          Use emojis relevantes para tornar a mensagem mais engajadora.`
        },
        {
          role: "user",
          content: `Gere um feedback motivacional baseado nestes dados:
          - Fotos enviadas: ${photoCount}
          - Peso perdido: ${metrics?.weight_lost || 0}kg
          - Gordura reduzida: ${metrics?.body_fat_reduced || 0}%
          - Massa muscular ganha: ${metrics?.muscle_gained || 0}kg
          - Dados de progresso: ${JSON.stringify(progressData || [])}
          
          Foque no progresso e na consistência do usuário.`
        },
      ],
      max_tokens: 150,
    })

    const feedback = response.choices[0].message.content

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (error: any) {
    console.error("Erro ao gerar feedback:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar feedback" },
      { status: 500 }
    )
  }
}
