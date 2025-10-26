import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, AlertTriangle, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    adHoc: 0,
    strategic: 0,
  });
  const [overdueActiveTasks, setOverdueActiveTasks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [taskTrends, setTaskTrends] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchOverdueActiveTasks();
    fetchRecentActivity();
    fetchTaskTrends();
  }, []);

  const fetchStats = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, task_type, created_at');

    if (tasks) {
      const total = tasks.length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'completed').length;

      setStats({
        total,
        pending,
        inProgress,
        completed,
        adHoc: tasks.filter(t => t.task_type === 'ad_hoc').length,
        strategic: tasks.filter(t => t.task_type === 'strategic').length,
      });

      // Prepare completion data for bar chart
      setCompletionData([
        { name: 'Completed', value: completed, fill: '#10b981' },
        { name: 'In Progress', value: inProgress, fill: '#3b82f6' },
        { name: 'Pending', value: pending, fill: '#f59e0b' },
      ]);
    }
  };

  const fetchTaskTrends = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('created_at, task_type')
      .order('created_at', { ascending: true });

    if (tasks) {
      // Group by month
      const monthlyData: any = {};
      tasks.forEach(task => {
        const month = format(new Date(task.created_at), 'MMM');
        if (!monthlyData[month]) {
          monthlyData[month] = { month, strategic: 0, adHoc: 0 };
        }
        if (task.task_type === 'strategic') {
          monthlyData[month].strategic++;
        } else {
          monthlyData[month].adHoc++;
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
        assigned_to_profile:assigned_to(name),
        delegated_to_profile:delegated_to(name)
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
        task:task_id(title),
        user:user_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentActivity(comments || []);
  };

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const pieData = [
    { name: 'Strategic', value: stats.strategic, fill: '#8b5cf6' },
    { name: 'Ad Hoc', value: stats.adHoc, fill: '#f97316' },
  ];

  const priorityColors: any = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    high: "bg-orange-500/10 text-orange-500",
    urgent: "bg-red-500/10 text-red-500",
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage all project tasks
            </p>
          </div>
          <Button onClick={() => navigate('/admin/tasks')} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Task
          </Button>
        </div>

        {/* Top Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Tasks with Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks Initiated (YTD)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Strategic + Ad-hoc</p>
                </div>
              </div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={taskTrends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="strategic" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorTotal)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="adHoc" 
                      stroke="#f97316" 
                      fill="url(#colorTotal)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Completion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Task Completion Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{completionRate}%</p>
                  <span className="flex items-center text-sm text-green-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stats.completed > 0 ? '↑' : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Task Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-4">Tasks by Type</p>
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold text-purple-500">{stats.strategic}</p>
                    <p className="text-sm text-muted-foreground">Strategic</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-500">{stats.adHoc}</p>
                    <p className="text-sm text-muted-foreground">Ad Hoc</p>
                  </div>
                </div>
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Middle Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Overdue/Urgent Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Top 5 Overdue/Active Tasks</h2>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="space-y-3">
              {overdueActiveTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No overdue tasks</p>
              ) : (
                overdueActiveTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {task.assigned_to_profile?.name || task.delegated_to_profile?.name}
                          </span>
                        </div>
                      </div>
                      {task.deadline && (
                        <span className="text-xs text-red-500 flex items-center whitespace-nowrap">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(task.deadline), 'MMM dd')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Status Breakdown */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Task Status Overview</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats.pending}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all" 
                    style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-medium">{stats.inProgress}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{stats.completed}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/admin/tasks')}
              >
                View All Tasks
              </Button>
            </div>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user?.name}</span>
                      {' '}commented on{' '}
                      <span className="font-medium">{activity.task?.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {activity.comment}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.created_at), 'MMM dd, hh:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
