import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TaskCard } from "@/components/TaskCard";
import { SubtaskCard } from "@/components/SubtaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.string().optional(),
  assigned_to: z.string().uuid("Please select a department head"),
});

const AdminTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [departmentHeads, setDepartmentHeads] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  const [subtaskComments, setSubtaskComments] = useState<any[]>([]);
  const [subtaskComment, setSubtaskComment] = useState("");
  const [isSubtaskDialogOpen, setIsSubtaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
    assigned_to: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchDepartmentHeads();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_profile:assigned_to(id, name, email),
        delegated_to_profile:delegated_to(id, name, email)
      `)
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

  const fetchDepartmentHeads = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'department_head');

    setDepartmentHeads(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      taskSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('tasks')
      .insert([{
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority as any,
        deadline: formData.deadline || null,
        assigned_to: formData.assigned_to,
        created_by: user?.id,
        status: 'pending' as any,
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        deadline: "",
        assigned_to: "",
      });
      fetchTasks();
    }

    setIsLoading(false);
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
    }
  };

  const filterTasks = (status?: string) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="mt-1 text-muted-foreground">
              Create and manage project tasks
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign to Department Head</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department head" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentHeads.map((head) => (
                        <SelectItem key={head.id} value={head.id}>
                          {head.name} ({head.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filterTasks('pending').map((task) => (
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
            ))}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {filterTasks('in_progress').map((task) => (
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterTasks('completed').map((task) => (
              <TaskCard key={task.id} task={task} onViewDetails={handleViewDetails} showActions={false} />
            ))}
          </TabsContent>
        </Tabs>

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

export default AdminTasks;
