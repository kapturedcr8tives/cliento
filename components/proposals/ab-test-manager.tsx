"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FlaskConical, Plus, Play, Pause, BarChart3, TrendingUp, Target, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

interface ABTest {
  id: string
  name: string
  template_a_id: string
  template_b_id: string
  traffic_split: number
  status: "active" | "paused" | "completed"
  start_date: string
  end_date?: string
  results?: {
    template_a: {
      views: number
      conversions: number
      conversion_rate: number
    }
    template_b: {
      views: number
      conversions: number
      conversion_rate: number
    }
    statistical_significance: number
    winner?: "a" | "b" | "inconclusive"
  }
  created_at: string
}

interface ProposalTemplate {
  id: string
  name: string
  category: string
  usage_count: number
  conversion_rate: number
}

export function ABTestManager() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTest, setNewTest] = useState({
    name: "",
    template_a_id: "",
    template_b_id: "",
    traffic_split: 50,
  })
  const { userData } = useAuth()

  useEffect(() => {
    if (userData?.workspace_id) {
      fetchTests()
      fetchTemplates()
    }
  }, [userData])

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_ab_tests")
        .select("*")
        .eq("workspace_id", userData?.workspace_id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTests(data || [])
    } catch (error) {
      console.error("Error fetching A/B tests:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("workspace_id", userData?.workspace_id)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTest = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_ab_tests")
        .insert({
          ...newTest,
          workspace_id: userData?.workspace_id,
          created_by: userData?.id,
          traffic_split: newTest.traffic_split / 100,
        })
        .select()
        .single()

      if (error) throw error

      setTests((prev) => [data, ...prev])
      setCreateDialogOpen(false)
      setNewTest({
        name: "",
        template_a_id: "",
        template_b_id: "",
        traffic_split: 50,
      })
    } catch (error) {
      console.error("Error creating A/B test:", error)
    }
  }

  const toggleTestStatus = async (testId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"

    try {
      const { error } = await supabase.from("proposal_ab_tests").update({ status: newStatus }).eq("id", testId)

      if (error) throw error

      setTests((prev) => prev.map((test) => (test.id === testId ? { ...test, status: newStatus } : test)))
    } catch (error) {
      console.error("Error updating test status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getWinnerBadge = (results?: ABTest["results"]) => {
    if (!results?.winner) return null

    const winnerText = results.winner === "a" ? "Template A Wins" : "Template B Wins"
    const confidence = Math.round(results.statistical_significance * 100)

    return (
      <Badge className="bg-green-100 text-green-800">
        {winnerText} ({confidence}% confidence)
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Test Manager</h2>
          <p className="text-muted-foreground">Optimize your proposal templates with data-driven testing</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>Set up a new proposal template test to optimize conversion rates</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={newTest.name}
                  onChange={(e) => setNewTest((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pricing Strategy Test"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template A</Label>
                  <Select
                    value={newTest.template_a_id}
                    onValueChange={(value) => setNewTest((prev) => ({ ...prev, template_a_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Template B</Label>
                  <Select
                    value={newTest.template_b_id}
                    onValueChange={(value) => setNewTest((prev) => ({ ...prev, template_b_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Traffic Split (%)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    min="10"
                    max="90"
                    value={newTest.traffic_split}
                    onChange={(e) => setNewTest((prev) => ({ ...prev, traffic_split: Number(e.target.value) }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    Template A: {newTest.traffic_split}% | Template B: {100 - newTest.traffic_split}%
                  </span>
                </div>
              </div>

              <Button onClick={createTest} className="w-full">
                <FlaskConical className="mr-2 h-4 w-4" />
                Create A/B Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start optimizing your proposals by creating your first A/B test
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      {test.name}
                    </CardTitle>
                    <CardDescription>
                      Started {new Date(test.start_date).toLocaleDateString()} • Traffic Split:{" "}
                      {Math.round(test.traffic_split * 100)}%/{Math.round((1 - test.traffic_split) * 100)}%
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                    {getWinnerBadge(test.results)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTestStatus(test.id, test.status)}
                      disabled={test.status === "completed"}
                    >
                      {test.status === "active" ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Template A</CardTitle>
                          <CardDescription>
                            {templates.find((t) => t.id === test.template_a_id)?.name || "Unknown Template"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Traffic Share</span>
                              <span>{Math.round(test.traffic_split * 100)}%</span>
                            </div>
                            <Progress value={test.traffic_split * 100} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Template B</CardTitle>
                          <CardDescription>
                            {templates.find((t) => t.id === test.template_b_id)?.name || "Unknown Template"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Traffic Share</span>
                              <span>{Math.round((1 - test.traffic_split) * 100)}%</span>
                            </div>
                            <Progress value={(1 - test.traffic_split) * 100} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="space-y-4">
                    {test.results ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Template A Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold">{test.results.template_a.views}</p>
                                <p className="text-sm text-muted-foreground">Views</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{test.results.template_a.conversions}</p>
                                <p className="text-sm text-muted-foreground">Conversions</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">
                                  {(test.results.template_a.conversion_rate * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">Rate</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Template B Results
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold">{test.results.template_b.views}</p>
                                <p className="text-sm text-muted-foreground">Views</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">{test.results.template_b.conversions}</p>
                                <p className="text-sm text-muted-foreground">Conversions</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold">
                                  {(test.results.template_b.conversion_rate * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">Rate</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Alert>
                        <BarChart3 className="h-4 w-4" />
                        <AlertDescription>
                          No results available yet. Results will appear once the test has collected sufficient data.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-4">
                    {test.results ? (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Statistical Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Statistical Significance</p>
                                <p className="text-2xl font-bold">
                                  {Math.round(test.results.statistical_significance * 100)}%
                                </p>
                                <Progress value={test.results.statistical_significance * 100} className="mt-2" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Test Status</p>
                                <p className="text-lg font-semibold">
                                  {test.results.statistical_significance > 0.95
                                    ? "Statistically Significant"
                                    : "Needs More Data"}
                                </p>
                              </div>
                            </div>

                            {test.results.winner && (
                              <Alert>
                                <TrendingUp className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Template {test.results.winner.toUpperCase()} is the winner!</strong> The
                                  results show a statistically significant difference with{" "}
                                  {Math.round(test.results.statistical_significance * 100)}% confidence.
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Recommendations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {test.results.statistical_significance > 0.95 ? (
                                <>
                                  <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm">
                                      The test has reached statistical significance. You can confidently implement the
                                      winning template.
                                    </p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm">
                                      Consider analyzing what elements made the winning template more effective.
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm">
                                      Continue running the test to gather more data for statistical significance.
                                    </p>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm">
                                      Consider increasing traffic or extending the test duration.
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          Analysis will be available once the test has collected sufficient data from proposal views and
                          conversions.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
