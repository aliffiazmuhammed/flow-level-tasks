import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskCard } from "@/components/TaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DepartmentTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [executives, setExecutives] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedExecutive, setSelectedExecutive] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchExecutives();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:assigned_to(id, name, email),
        delegated_to_profile:delegated_to(id, name, email)
      `)
      .eq('assigned_to', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } else {
      setTasks(data || []);
    }
  };

  const fetchExecutives = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'executive');

    setExecutives(data || []);
  };

  const handleDelegate = (taskId: string) => {
    setSelectedTask(taskId);
    setIsDialogOpen(true);
  };

  const handleDelegateSubmit = async () => {
    if (!selectedTask || !selectedExecutive) return;

    const { error } = await supabase
      .from('tasks')
      .update({ delegated_to: selectedExecutive })
      .eq('id', selectedTask);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delegate task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task delegated successfully",
      });
      setIsDialogOpen(false);
      setSelectedTask(null);
      setSelectedExecutive("");
      fetchTasks();
    }
  };

  const filterTasks = (status?: string, delegated?: boolean) => {
    let filtered = tasks;
    if (status) {
      filtered = filtered.filter(task => task.status === status);
    }
    if (delegated !== undefined) {
      filtered = filtered.filter(task => delegated ? task.delegated_to : !task.delegated_to);
    }
    return filtered;
  };

  return (
    <DashboardLayout role="department_head">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            View and delegate tasks assigned to you
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="delegated">Delegated</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filterTasks().map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onDelegate={handleDelegate}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterTasks('pending', false).map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onDelegate={handleDelegate}
              />
            ))}
          </TabsContent>

          <TabsContent value="delegated" className="space-y-4">
            {filterTasks(undefined, true).map((task) => (
              <TaskCard key={task.id} task={task} showActions={false} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterTasks('completed').map((task) => (
              <TaskCard key={task.id} task={task} showActions={false} />
            ))}
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delegate Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Executive</Label>
                <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an executive" />
                  </SelectTrigger>
                  <SelectContent>
                    {executives.map((exec) => (
                      <SelectItem key={exec.id} value={exec.id}>
                        {exec.name} ({exec.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDelegateSubmit}>
                  Delegate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentTasks;
