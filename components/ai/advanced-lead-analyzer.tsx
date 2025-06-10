"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  BarChart3,
} from "lucide-react"
import { advancedAIService, type AdvancedLeadScoring } from "@/lib/advanced-ai-service"
import type { Lead } from "@/lib/types"

interface AdvancedLeadAnalyzerProps {
  lead: Lead
  onAnalysisComplete?: (analysis: AdvancedLeadScoring) => void
}

export function AdvancedLeadAnalyzer({ lead, onAnalysisComplete }: AdvancedLeadAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AdvancedLeadScoring | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await advancedAIService.analyzeLeadAdvanced(lead.id)
      setAnalysis(result)
      onAnalysisComplete?.(result)

      // Track analytics event
      await advancedAIService.trackEvent({
        type: "lead_analysis_completed",
        entity_type: "lead",
        entity_id: lead.id,
        properties: {
          score: result.final_score,
          confidence: result.confidence,
        },
      })
    } catch (err) {
      setError("Failed to analyze lead. Please try again.")
      console.error("Lead analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-blue-600 bg-blue-100"
    if (score >= 40) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "immediate":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Advanced Lead Analysis
              </CardTitle>
              <CardDescription>AI-powered lead scoring and qualification insights</CardDescription>
            </div>
            <Button onClick={runAnalysis} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {analysis && (
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="actions">Next Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Lead Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(analysis.final_score)}`}>
                            {analysis.final_score}
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Progress value={analysis.final_score} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                          <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Progress value={analysis.confidence * 100} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Priority</p>
                          <Badge className={getPriorityColor(analysis.next_actions.priority)}>
                            {analysis.next_actions.priority}
                          </Badge>
                        </div>
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{analysis.next_actions.timeline}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.factors.map((factor, index) => (
                        <Badge key={index} variant="outline">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Demographic Score</CardTitle>
                      <CardDescription>Contact information quality</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{analysis.demographic_score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <Progress value={analysis.demographic_score} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Firmographic Score</CardTitle>
                      <CardDescription>Company and business context</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{analysis.firmographic_score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <Progress value={analysis.firmographic_score} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Behavioral Score</CardTitle>
                      <CardDescription>Source and engagement patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{analysis.behavioral_score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <Progress value={analysis.behavioral_score} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Engagement Score</CardTitle>
                      <CardDescription>Interest and intent signals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">{analysis.engagement_score}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <Progress value={analysis.engagement_score} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Recommendations</CardTitle>
                    <CardDescription>Data-driven insights for lead qualification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Immediate Next Actions</CardTitle>
                    <CardDescription>
                      Priority:{" "}
                      <Badge className={getPriorityColor(analysis.next_actions.priority)}>
                        {analysis.next_actions.priority}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Timeline: {analysis.next_actions.timeline}
                      </div>

                      <div className="space-y-3">
                        {analysis.next_actions.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                            <p className="text-sm">{action}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Execute Action Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
