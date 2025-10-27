import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, CheckCircle2, Clock, AlertCircle, Users, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    adhoc: 0,
    strategic: 0,
  });
  const [overdueActiveTasks, setOverdueActiveTasks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [taskTrends, setTaskTrends] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchOverdueActiveTasks();
    fetchRecentActivity();
    fetchTaskTrends();
  }, []);

  const fetchStats = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, task_type');

    if (tasks) {
      setStats({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        adhoc: tasks.filter(t => t.task_type === 'ad_hoc').length,
        strategic: tasks.filter(t => t.task_type === 'strategic').length,
      });
    }
  };

  const fetchTaskTrends = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('created_at, task_type')
      .order('created_at', { ascending: true });

    if (tasks) {
      const monthlyData: any = {};
      tasks.forEach(task => {
        const month = format(new Date(task.created_at), 'MMM');
        if (!monthlyData[month]) {
          monthlyData[month] = { month, strategic: 0, adhoc: 0 };
        }
        if (task.task_type === 'strategic') {
          monthlyData[month].strategic++;
        } else {
          monthlyData[month].adhoc++;
        }
      });
      setTaskTrends(Object.values(monthlyData));
    }
  };

  const fetchOverdueActiveTasks = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles:assigned_to(name)
      `)
      .or('status.eq.pending,status.eq.in_progress')
      .lt('deadline', now)
      .order('deadline', { ascending: true })
      .limit(5);

    setOverdueActiveTasks(data || []);
  };

  const fetchRecentActivity = async () => {
    const { data: comments } = await supabase
      .from('task_comments')
      .select(`
        *,
        tasks:task_id(title),
        profiles:user_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentActivity(comments || []);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Monitor and manage your tickets, resources, and logistics
            </p>
          </div>
          <Button onClick={() => navigate('/admin/tasks')} className="gap-2 rounded-2xl shadow-medium">
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </motion.div>

        {/* Key Metrics Grid - Top Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Tickets Initiated (YTD) - Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-soft rounded-2xl border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Total Tickets Initiated (YTD)
                </CardTitle>
                <CardDescription className="text-xs">Strategic and Ad-hoc tickets over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={taskTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="strategic" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="adhoc" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--secondary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Tickets This Year</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ticket Completion Rate - Progress Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-soft rounded-2xl border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  Ticket Completion Rate
                </CardTitle>
                <CardDescription className="text-xs">Current status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-semibold text-accent">{stats.completed}</span>
                  </div>
                  <Progress value={(stats.completed / stats.total) * 100} className="h-3 bg-muted" />
                  <p className="text-xs text-muted-foreground text-right">
                    {((stats.completed / stats.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-semibold text-secondary">{stats.inProgress}</span>
                  </div>
                  <Progress value={(stats.inProgress / stats.total) * 100} className="h-3 bg-muted" />
                  <p className="text-xs text-muted-foreground text-right">
                    {((stats.inProgress / stats.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-primary">{stats.pending}</span>
                  </div>
                  <Progress value={(stats.pending / stats.total) * 100} className="h-3 bg-muted" />
                  <p className="text-xs text-muted-foreground text-right">
                    {((stats.pending / stats.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tickets by Type & Status - Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-soft rounded-2xl border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  Tickets by Type & Status
                </CardTitle>
                <CardDescription className="text-xs">Category distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Strategic', value: stats.strategic },
                        { name: 'Ad-hoc', value: stats.adhoc }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--secondary))" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                      <span className="text-muted-foreground">Strategic</span>
                    </div>
                    <span className="font-semibold">{stats.strategic}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-secondary"></div>
                      <span className="text-muted-foreground">Ad-hoc</span>
                    </div>
                    <span className="font-semibold">{stats.adhoc}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Row - Overdue Tasks & Activity */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Top 5 Overdue Strategic Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-2"
          >
            <Card className="shadow-soft rounded-2xl border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Top 5 Overdue Strategic Tickets
                </CardTitle>
                <CardDescription className="text-xs">Tickets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueActiveTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">No overdue or active tickets</p>
                  ) : (
                    overdueActiveTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-all">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {task.profiles?.name?.substring(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                            <Badge 
                              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.profiles?.name || 'Unassigned'}
                            </span>
                            {task.deadline && (
                              <span className="flex items-center gap-1 text-destructive">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.deadline), 'MMM dd, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Timeline / Live Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-soft rounded-2xl border-border h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-secondary" />
                  Activity Timeline
                </CardTitle>
                <CardDescription className="text-xs">Recent updates and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">No recent activity</p>
                  ) : (
                    recentActivity.map((activity: any, index: number) => (
                      <div key={activity.id} className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold">{activity.profiles?.name}</span>
                            <span className="text-muted-foreground">commented</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{activity.comment}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
