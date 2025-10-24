import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DepartmentDashboard = () => {
  const [stats, setStats] = useState({
    assigned: 0,
    delegated: 0,
    pending: 0,
    completed: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: assignedTasks } = await supabase
      .from('tasks')
      .select('status')
      .eq('assigned_to', user?.id);

    const { data: delegatedTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('assigned_to', user?.id)
      .not('delegated_to', 'is', null);

    if (assignedTasks) {
      setStats({
        assigned: assignedTasks.length,
        delegated: delegatedTasks?.length || 0,
        pending: assignedTasks.filter(t => t.status === 'pending').length,
        completed: assignedTasks.filter(t => t.status === 'completed').length,
      });
    }
  };

  const statCards = [
    { label: "Assigned to Me", value: stats.assigned, icon: AlertCircle, color: "text-primary" },
    { label: "Delegated", value: stats.delegated, icon: Users, color: "text-blue-500" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-500" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500" },
  ];

  return (
    <DashboardLayout role="department_head">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Department Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and delegate tasks to your team
            </p>
          </div>
          <Button onClick={() => navigate('/department/tasks')} size="lg">
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
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/department/tasks')}
            >
              <AlertCircle className="h-6 w-6" />
              <span>View Assigned Tasks</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2"
              onClick={() => navigate('/department/tasks')}
            >
              <Users className="h-6 w-6" />
              <span>Manage Delegations</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentDashboard;
