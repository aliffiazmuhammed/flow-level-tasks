import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskCard } from "@/components/TaskCard";
import { SubtaskCard } from "@/components/SubtaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

const ExecutiveTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtask, setNewSubtask] = useState({ description: "", due_date: "" });
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  const [subtaskComments, setSubtaskComments] = useState<any[]>([]);
  const [subtaskComment, setSubtaskComment] = useState("");
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id);
      fetchSubtasks(selectedTask.id);
    }
  }, [selectedTask]);

  useEffect(() => {
    if (selectedSubtask) {
      fetchSubtaskComments(selectedSubtask.id);
    }
  }, [selectedSubtask]);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:assigned_to(id, name, email)
      `)
      .eq('delegated_to', user?.id)
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
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    setSubtasks(data || []);
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Check if trying to complete the task
    if (newStatus === 'completed') {
      const { data: taskSubtasks } = await supabase
        .from('subtasks')
        .select('status')
        .eq('task_id', taskId);

      const hasIncompletSubtasks = taskSubtasks?.some(
        (subtask) => subtask.status !== 'completed'
      );

      if (hasIncompletSubtasks) {
        toast({
          title: "Cannot Complete Task",
          description: "Please complete all subtasks before marking the task as complete",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus as any })
      .eq('id', taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task status updated",
      });
      fetchTasks();
    }
  };

  const handleViewDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task);
    setIsDialogOpen(true);
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

  const handleAddSubtask = async () => {
    if (!newSubtask.description.trim() || !selectedTask) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('subtasks')
      .insert([{
        task_id: selectedTask.id,
        description: newSubtask.description.trim(),
        due_date: newSubtask.due_date || null,
        created_by: user?.id,
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add subtask",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Subtask added",
      });
      setNewSubtask({ description: "", due_date: "" });
      setShowAddSubtask(false);
      fetchSubtasks(selectedTask.id);
    }
  };

  const handleSubtaskStatusChange = async (subtaskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ status: newStatus as any })
      .eq('id', subtaskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Subtask status updated",
      });
      fetchSubtasks(selectedTask.id);
    }
  };

  const handleViewSubtaskComments = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    setSelectedSubtask(subtask);
    setIsSubtaskDialogOpen(true);
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
    }
  };

  const filterTasks = (status?: string) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  return (
    <DashboardLayout role="executive">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and update your assigned tasks
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filterTasks().map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterTasks('pending').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {filterTasks('in_progress').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterTasks('completed').map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onViewDetails={handleViewDetails}
                showActions={false}
              />
            ))}
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
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
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Subtasks</Label>
                    <Button 
                      size="sm" 
                      onClick={() => setShowAddSubtask(!showAddSubtask)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subtask
                    </Button>
                  </div>

                  {showAddSubtask && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="subtask-desc">Description</Label>
                        <Textarea
                          id="subtask-desc"
                          placeholder="Enter subtask description..."
                          value={newSubtask.description}
                          onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtask-date">Due Date</Label>
                        <Input
                          id="subtask-date"
                          type="date"
                          value={newSubtask.due_date}
                          onChange={(e) => setNewSubtask({ ...newSubtask, due_date: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddSubtask}>Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddSubtask(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {subtasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No subtasks yet</p>
                    ) : (
                      subtasks.map((subtask) => (
                        <SubtaskCard
                          key={subtask.id}
                          subtask={subtask}
                          onStatusChange={handleSubtaskStatusChange}
                          onViewComments={handleViewSubtaskComments}
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
          <DialogContent>
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

export default ExecutiveTasks;
