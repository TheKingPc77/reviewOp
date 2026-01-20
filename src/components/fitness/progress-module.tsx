"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, Sparkles, Scale } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"

interface ProgressModuleProps {
  userId: string
}

interface WeightRecord {
  date: string
  weight: number
}

export default function ProgressModule({ userId }: ProgressModuleProps) {
  const [weightData, setWeightData] = useState<WeightRecord[]>([])
  const [newWeight, setNewWeight] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [generatingFeedback, setGeneratingFeedback] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchWeightData()
    }
  }, [userId])

  const fetchWeightData = async () => {
    try {
      setLoading(true)

      // Buscar registros de peso dos últimos 6 meses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: weightRecords } = await supabase
        .from("weight_records")
        .select("weight, date")
        .eq("user_id", userId)
        .gte("date", sixMonthsAgo.toISOString().split('T')[0])
        .order("date", { ascending: true })

      if (weightRecords && weightRecords.length > 0) {
        const formattedData = weightRecords.map((record) => ({
          date: new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          weight: parseFloat(record.weight)
        }))
        setWeightData(formattedData)
        
        // Gerar feedback inicial
        await generateFeedback(formattedData)
      }

    } catch (error) {
      console.error("Erro ao buscar dados de peso:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateFeedback = async (data: WeightRecord[]) => {
    if (data.length === 0) {
      setFeedback("Comece a registrar seu peso para receber feedback personalizado!")
      return
    }

    try {
      setGeneratingFeedback(true)

      const firstWeight = data[0].weight
      const lastWeight = data[data.length - 1].weight
      const weightLost = firstWeight - lastWeight
      const daysTracking = data.length

      const response = await fetch("/api/progress/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightData: data,
          weightLost,
          daysTracking,
          userId
        })
      })

      const result = await response.json()
      
      if (result.success && result.feedback) {
        setFeedback(result.feedback)
      } else {
        // Feedback padrão caso a API falhe
        if (weightLost > 0) {
          setFeedback(`Parabéns! Você já perdeu ${weightLost.toFixed(1)}kg. Continue assim, você está no caminho certo! 💪`)
        } else if (weightLost < 0) {
          setFeedback(`Você ganhou ${Math.abs(weightLost).toFixed(1)}kg. Não desanime, ajuste sua rotina e continue focado! 🎯`)
        } else {
          setFeedback(`Seu peso está estável. Mantenha a consistência e os resultados virão! 🌟`)
        }
      }
    } catch (error) {
      console.error("Erro ao gerar feedback:", error)
      setFeedback("Continue registrando seu peso para receber feedback personalizado!")
    } finally {
      setGeneratingFeedback(false)
    }
  }

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) {
      alert("Por favor, insira um peso válido")
      return
    }

    try {
      setSaving(true)
      const today = new Date().toISOString().split('T')[0]

      // Usar API route que bypassa RLS
      const response = await fetch('/api/dashboard/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weight,
          date: today
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar peso')
      }

      // Limpar input
      setNewWeight("")
      
      // Recarregar dados
      await fetchWeightData()
      
      alert("Peso registrado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar peso:", error)
      alert(`Erro ao salvar peso: ${error instanceof Error ? error.message : 'Tente novamente'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl h-64"></div>
        <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-96"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Progresso de Peso</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe sua evolução e receba feedback personalizado</p>
      </div>

      {/* Adicionar Peso */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Registre seu Peso</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Adicione seu peso atual para acompanhar sua evolução</p>
          
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <Input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Ex: 75.5"
              className="text-lg"
              disabled={saving}
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">kg</span>
            <Button 
              onClick={handleAddWeight}
              disabled={saving || !newWeight}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8"
            >
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Personalizado */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Feedback Personalizado</h3>
            {generatingFeedback ? (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Gerando feedback personalizado...</span>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {feedback || "Adicione seu primeiro peso para receber feedback!"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Gráfico de Evolução */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Evolução de Peso (Últimos 6 Meses)
        </h3>
        {weightData.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="url(#colorWeight)" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
            
            {/* Estatísticas Resumidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Peso Inicial</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {weightData[0].weight.toFixed(1)} kg
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Peso Atual</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {weightData[weightData.length - 1].weight.toFixed(1)} kg
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Diferença</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {(weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-slate-400">
            <Scale className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Nenhum registro de peso ainda</p>
            <p className="text-sm mt-2">Adicione seu primeiro peso para começar a acompanhar sua evolução</p>
          </div>
        )}
      </Card>
    </div>
  )
}
