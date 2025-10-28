import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, CheckCircle2, Clock, AlertCircle, ListChecks, Loader2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchOverdueActiveTasks();
    fetchRecentActivity();
    fetchTaskTrends();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setUserProfile(data);
  };

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
      <div className="space-y-8 p-8">
        {/* Modern Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/admin/tasks')} 
              className="gap-2 rounded-xl shadow-soft bg-primary hover:bg-primary/90 transition-all"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {userProfile?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-none shadow-soft hover:shadow-medium transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <ListChecks className="h-6 w-6 text-primary" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full"></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-none shadow-soft hover:shadow-medium transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-accent">
                    {((stats.completed / stats.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-500" 
                    style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-none shadow-soft hover:shadow-medium transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Loader2 className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-xs font-medium text-secondary">
                    {((stats.inProgress / stats.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold">{stats.inProgress}</p>
                </div>
                <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all duration-500" 
                    style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-none shadow-soft hover:shadow-medium transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-muted group-hover:bg-muted/80 transition-colors">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {((stats.pending / stats.total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-muted-foreground transition-all duration-500" 
                    style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Ticket Insights Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Total Tickets Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-none shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tickets Trend (YTD)
                </CardTitle>
                <CardDescription>Strategic vs Ad-hoc tickets over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={taskTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="strategic" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="adhoc" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tickets by Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-none shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  Completion Breakdown
                </CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: stats.completed, color: 'hsl(var(--accent))' },
                        { name: 'In Progress', value: stats.inProgress, color: 'hsl(var(--secondary))' },
                        { name: 'Pending', value: stats.pending, color: 'hsl(var(--muted-foreground))' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--accent))" />
                      <Cell fill="hsl(var(--secondary))" />
                      <Cell fill="hsl(var(--muted-foreground))" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-accent"></div>
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="text-sm font-bold">{stats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-secondary"></div>
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <span className="text-sm font-bold">{stats.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Overdue Tickets & Activity Timeline */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Top 5 Overdue Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="col-span-2"
          >
            <Card className="border-none shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Overdue & Active Tickets
                </CardTitle>
                <CardDescription>Tickets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueActiveTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">All caught up! No overdue tickets.</p>
                    </div>
                  ) : (
                    overdueActiveTasks.map((task: any) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-destructive/5 to-transparent border border-destructive/10 hover:border-destructive/30 transition-all cursor-pointer group"
                      >
                        <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                            {task.profiles?.name?.substring(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {task.title}
                            </h4>
                            <Badge 
                              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs px-2 py-0.5"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                              {task.profiles?.name || 'Unassigned'}
                            </span>
                            {task.deadline && (
                              <span className="flex items-center gap-1.5 text-destructive font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                Due {format(new Date(task.deadline), 'MMM dd')}
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

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-none shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-secondary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Live updates feed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity: any) => (
                      <div key={activity.id} className="relative pl-7 pb-5 border-l-2 border-border last:border-l-0 last:pb-0 group">
                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background group-hover:scale-125 transition-transform"></div>
                        <div className="space-y-1.5 bg-muted/30 p-3 rounded-lg group-hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-foreground">{activity.profiles?.name}</span>
                            <span className="text-muted-foreground">added a comment</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {activity.comment}
                          </p>
                          <p className="text-xs text-muted-foreground/70 font-medium">
                            {format(new Date(activity.created_at), 'MMM dd, h:mm a')}
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
