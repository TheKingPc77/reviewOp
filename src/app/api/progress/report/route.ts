import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { metrics, progressData, photoCount, userId, userName } = await request.json()

    // Gerar relatório completo de progresso
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um personal trainer e nutricionista gerando um relatório profissional de progresso.
          Crie um relatório detalhado em formato markdown com:
          
          # Relatório de Progresso Fitness
          
          ## Resumo Executivo
          - Visão geral do período analisado
          - Principais conquistas
          
          ## Análise de Métricas
          - Composição corporal
          - Evolução de peso
          - Desenvolvimento muscular por região
          
          ## Tendências Identificadas
          - Padrões observados
          - Pontos de atenção
          
          ## Recomendações Personalizadas
          - Ajustes no treino
          - Sugestões nutricionais
          - Metas para próximo período
          
          ## Conclusão
          - Feedback motivacional
          - Próximos passos
          
          Use dados específicos, seja técnico mas acessível, e sempre motivador.`
        },
        {
          role: "user",
          content: `Gere um relatório completo de progresso para ${userName || 'o usuário'}:
          
          Período analisado: Últimos ${photoCount} meses
          
          Métricas atuais:
          - Peso perdido: ${metrics?.weight_lost || 0}kg
          - Gordura reduzida: ${metrics?.body_fat_reduced || 0}%
          - Massa muscular ganha: ${metrics?.muscle_gained || 0}kg
          
          Desenvolvimento por região:
          - Braços: ${metrics?.arms || 0}%
          - Peito: ${metrics?.chest || 0}%
          - Costas: ${metrics?.back || 0}%
          - Abdômen: ${metrics?.abdomen || 0}%
          - Pernas: ${metrics?.legs || 0}%
          
          Evolução de peso: ${JSON.stringify(progressData || [])}
          
          Gere um relatório profissional e motivador em markdown.`
        },
      ],
      max_tokens: 2000,
    })

    const report = response.choices[0].message.content

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error: any) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao gerar relatório" },
      { status: 500 }
    )
  }
}
