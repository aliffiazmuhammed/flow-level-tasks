import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ExecutiveDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    subtasks: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('delegated_to', user?.id);

    // Fetch subtasks for all tasks
    const taskIds = tasks?.map(t => t.id) || [];
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('status')
      .in('task_id', taskIds);

    if (tasks) {
      setStats({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        subtasks: {
          total: subtasks?.length || 0,
          pending: subtasks?.filter(s => s.status === 'pending').length || 0,
          inProgress: subtasks?.filter(s => s.status === 'in_progress').length || 0,
          completed: subtasks?.filter(s => s.status === 'completed').length || 0,
        }
      });
    }
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: AlertCircle, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-blue-500" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
  ];

  return (
    <DashboardLayout role="executive">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Executive Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Track and complete your assigned tasks
            </p>
          </div>
          <Button onClick={() => navigate('/executive/tasks')} size="lg">
            View Tasks
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Subtasks Overview</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Subtasks</p>
              <p className="text-2xl font-bold mt-1">{stats.subtasks.total}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1 text-yellow-500">{stats.subtasks.pending}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold mt-1 text-blue-500">{stats.subtasks.inProgress}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-500">{stats.subtasks.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/executive/tasks')}
            >
              <Clock className="h-6 w-6" />
              <span>View Pending Tasks</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/executive/tasks')}
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>View Completed</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;
