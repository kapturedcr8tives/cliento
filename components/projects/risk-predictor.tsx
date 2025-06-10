"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Target,
  Brain,
  Loader2,
} from "lucide-react"
import { advancedAIService, type ProjectRiskAnalysis } from "@/lib/advanced-ai-service"
import type { Project } from "@/lib/types"

interface RiskPredictorProps {
  project: Project
  onPredictionComplete?: (analysis: ProjectRiskAnalysis) => void
}

export function RiskPredictor({ project, onPredictionComplete }: RiskPredictorProps) {
  const [analysis, setAnalysis] = useState<ProjectRiskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Auto-run analysis when component mounts
    runAnalysis()
  }, [project.id])

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await advancedAIService.analyzeProjectRisks(project.id)
      setAnalysis(result)
      onPredictionComplete?.(result)

      // Track analytics event
      await advancedAIService.trackEvent({
        type: "project_risk_analysis",
        entity_type: "project",
        entity_id: project.id,
        properties: {
          risk_score: result.risk_score,
          completion_percentage: result.completion_percentage,
        },
      })
    } catch (err) {
      setError("Failed to analyze project risks. Please try again.")
      console.error("Project risk analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-100"
    if (score >= 40) return "text-yellow-600 bg-yellow-100"
    return "text-green-600 bg-green-100"
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return "High Risk"
    if (score >= 40) return "Medium Risk"
    return "Low Risk"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <TrendingDown className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Project Risk Analysis
          </CardTitle>
          <CardDescription>AI-powered risk assessment and predictions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing project risks...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Project Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={runAnalysis} className="mt-4">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Project Risk Analysis
              </CardTitle>
              <CardDescription>AI-powered risk assessment and predictions for {project.name}</CardDescription>
            </div>
            <Button variant="outline" onClick={runAnalysis}>
              Refresh Analysis
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risks">Risk Factors</TabsTrigger>
              <TabsTrigger value="budget">Budget Forecast</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                        <p className={`text-2xl font-bold ${getRiskColor(analysis.risk_score)}`}>
                          {analysis.risk_score}
                        </p>
                        <p className="text-sm text-muted-foreground">{getRiskLevel(analysis.risk_score)}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={analysis.risk_score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completion</p>
                        <p className="text-2xl font-bold">{Math.round(analysis.completion_percentage)}%</p>
                        <p className="text-sm text-muted-foreground">Project Progress</p>
                      </div>
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={analysis.completion_percentage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Predicted Completion</p>
                        <p className="text-lg font-bold">
                          {analysis.predicted_completion_date
                            ? new Date(analysis.predicted_completion_date).toLocaleDateString()
                            : "TBD"}
                        </p>
                        <p className="text-sm text-muted-foreground">Estimated Date</p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="space-y-4">
                {analysis.risk_factors.length > 0 ? (
                  analysis.risk_factors.map((factor, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(factor.severity)}
                            <div>
                              <h4 className="font-semibold">{factor.type.replace(/_/g, " ").toUpperCase()}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{factor.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getSeverityColor(factor.severity)}>{factor.severity}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">Impact: {factor.impact}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <TrendingUp className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Major Risk Factors</h3>
                      <p className="text-muted-foreground text-center">
                        Your project is on track with no significant risk factors detected.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Spend</p>
                        <p className="text-2xl font-bold">${analysis.budget_forecast.current_spend.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Projected Total</p>
                        <p className="text-2xl font-bold">
                          ${analysis.budget_forecast.projected_total.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Budget Variance</p>
                        <p
                          className={`text-2xl font-bold ${
                            analysis.budget_forecast.variance_percentage > 10
                              ? "text-red-600"
                              : analysis.budget_forecast.variance_percentage > 0
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {analysis.budget_forecast.variance_percentage > 0 ? "+" : ""}
                          {analysis.budget_forecast.variance_percentage.toFixed(1)}%
                        </p>
                      </div>
                      {analysis.budget_forecast.variance_percentage > 10 ? (
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      ) : (
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {Math.abs(analysis.budget_forecast.variance_percentage) > 10 && (
                <Alert variant={analysis.budget_forecast.variance_percentage > 0 ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {analysis.budget_forecast.variance_percentage > 0
                      ? `Project is projected to exceed budget by ${analysis.budget_forecast.variance_percentage.toFixed(1)}%. Consider scope adjustments or additional resources.`
                      : `Project is projected to come in under budget by ${Math.abs(analysis.budget_forecast.variance_percentage).toFixed(1)}%. Great job on cost management!`}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Bottlenecks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.resource_optimization.bottlenecks.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.resource_optimization.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0" />
                            <p className="text-sm">{bottleneck}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No bottlenecks detected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.resource_optimization.suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.resource_optimization.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No optimization suggestions at this time</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
