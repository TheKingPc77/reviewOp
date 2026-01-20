import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, metrics, userId } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Imagem é obrigatória" },
        { status: 400 }
      )
    }

    // Análise da imagem com OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer e nutricionista especializado em análise de composição corporal. 
          Analise a foto de progresso do usuário e forneça insights detalhados sobre:
          1. Composição corporal visível (massa muscular, definição, postura)
          2. Pontos fortes e áreas que precisam de mais atenção
          3. Sugestões específicas de treino para melhorar
          4. Feedback motivacional personalizado
          
          Seja específico, técnico mas acessível, e sempre motivador.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: metrics 
                ? `Analise esta foto de progresso. Dados atuais do usuário: Peso perdido: ${metrics.weight_lost}kg, Gordura reduzida: ${metrics.body_fat_reduced}%, Massa muscular ganha: ${metrics.muscle_gained}kg`
                : "Analise esta foto de progresso e forneça insights detalhados sobre a composição corporal."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    })

    const analysis = response.choices[0].message.content

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error("Erro na análise de progresso:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao analisar imagem" },
      { status: 500 }
    )
  }
}
