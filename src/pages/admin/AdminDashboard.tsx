import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    adHoc: 0,
    strategic: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
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
        adHoc: tasks.filter(t => t.task_type === 'ad_hoc').length,
        strategic: tasks.filter(t => t.task_type === 'strategic').length,
      });
    }
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: AlertCircle, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-blue-500" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
    { label: "Ad Hoc Tasks", value: stats.adHoc, icon: AlertCircle, color: "text-orange-500" },
    { label: "Strategic Tasks", value: stats.strategic, icon: AlertCircle, color: "text-purple-500" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and monitor all project tasks
            </p>
          </div>
          <Button onClick={() => navigate('/admin/tasks')} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Task
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/admin/tasks')}
            >
              <Plus className="h-6 w-6" />
              <span>Create New Task</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/admin/tasks')}
            >
              <AlertCircle className="h-6 w-6" />
              <span>View All Tasks</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/admin/tasks')}
            >
              <CheckCircle2 className="h-6 w-6" />
              <span>Review Completed</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
