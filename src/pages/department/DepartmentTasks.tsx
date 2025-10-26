import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskCard } from "@/components/TaskCard";
import { SubtaskCard } from "@/components/SubtaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DepartmentTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [executives, setExecutives] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedExecutive, setSelectedExecutive] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  const [subtaskComments, setSubtaskComments] = useState<any[]>([]);
  const [subtaskComment, setSubtaskComment] = useState("");
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
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

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase
      .from('task_comments')
      .select(`
        *,
        user:user_id(name, email)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    setComments(data || []);
  };

  const fetchSubtasks = async (taskId: string) => {
    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (subtasksData) {
      // Fetch comment counts for each subtask
      const subtasksWithCounts = await Promise.all(
        subtasksData.map(async (subtask) => {
          const { count } = await supabase
            .from('subtask_comments')
            .select('*', { count: 'exact', head: true })
            .eq('subtask_id', subtask.id);
          
          return { ...subtask, commentCount: count || 0 };
        })
      );
      setSubtasks(subtasksWithCounts);
    } else {
      setSubtasks([]);
    }
  };

  const fetchSubtaskComments = async (subtaskId: string) => {
    const { data } = await supabase
      .from('subtask_comments')
      .select(`
        *,
        user:user_id(name, email)
      `)
      .eq('subtask_id', subtaskId)
      .order('created_at', { ascending: false });

    setSubtaskComments(data || []);
  };

  const handleDelegate = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDelegateSubmit = async () => {
    if (!selectedTask || !selectedExecutive) return;

    const { error } = await supabase
      .from('tasks')
      .update({ delegated_to: selectedExecutive })
      .eq('id', selectedTask.id);

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

  const handleViewDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
    fetchComments(taskId);
    fetchSubtasks(taskId);
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedTask) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: selectedTask.id,
        user_id: user?.id,
        comment: comment.trim(),
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment added",
      });
      setComment("");
      fetchComments(selectedTask.id);
    }
  };

  const handleViewSubtaskComments = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    setSelectedSubtask(subtask);
    setIsSubtaskDialogOpen(true);
    fetchSubtaskComments(subtaskId);
  };

  const handleAddSubtaskComment = async () => {
    if (!subtaskComment.trim() || !selectedSubtask) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('subtask_comments')
      .insert([{
        subtask_id: selectedSubtask.id,
        user_id: user?.id,
        comment: subtaskComment.trim(),
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment added",
      });
      setSubtaskComment("");
      fetchSubtaskComments(selectedSubtask.id);
      // Refresh subtasks to update comment count
      if (selectedTask) {
        fetchSubtasks(selectedTask.id);
      }
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
                onViewDetails={handleViewDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterTasks('pending', false).map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onDelegate={handleDelegate}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="delegated" className="space-y-4">
            {filterTasks(undefined, true).map((task) => (
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterTasks('completed').map((task) => (
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
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

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">{selectedTask.title}</h3>
                  <p className="mt-2 text-muted-foreground">{selectedTask.description}</p>
                </div>

                <div className="flex gap-2">
                  <Badge>{selectedTask.priority}</Badge>
                  <Badge>{selectedTask.status}</Badge>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Subtasks</Label>
                  <div className="space-y-3">
                    {subtasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No subtasks yet</p>
                    ) : (
                      subtasks.map((subtask) => (
                        <SubtaskCard
                          key={subtask.id}
                          subtask={subtask}
                          onViewComments={handleViewSubtaskComments}
                          commentCount={subtask.commentCount}
                        />
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Task Comments</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {comments.map((c: any) => (
                      <div key={c.id} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">{c.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{c.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment}>Add Comment</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isSubtaskDialogOpen} onOpenChange={setIsSubtaskDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subtask Comments</DialogTitle>
            </DialogHeader>
            {selectedSubtask && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{selectedSubtask.description}</p>
                  <Badge className="mt-2">{selectedSubtask.status}</Badge>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {subtaskComments.map((c: any) => (
                    <div key={c.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{c.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{c.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={subtaskComment}
                    onChange={(e) => setSubtaskComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddSubtaskComment}>Add Comment</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentTasks;
