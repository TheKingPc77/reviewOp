import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, weight, date } = await request.json()

    if (!userId || !weight || !date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se já existe registro para esta data
    const { data: existing } = await supabaseAdmin
      .from('weight_records')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (existing) {
      // Atualizar registro existente
      const { data, error } = await supabaseAdmin
        .from('weight_records')
        .update({ weight: parseFloat(weight) })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar peso:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ data, updated: true }, { status: 200 })
    }

    // Inserir novo registro
    const { data, error } = await supabaseAdmin
      .from('weight_records')
      .insert({
        user_id: userId,
        weight: parseFloat(weight),
        date: date
      })
      .select()

    if (error) {
      console.error('Erro ao inserir peso:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data[0], updated: false }, { status: 200 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
