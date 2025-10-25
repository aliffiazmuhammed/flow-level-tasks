-- Create subtasks table
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtask_comments table
CREATE TABLE public.subtask_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtask_id UUID NOT NULL REFERENCES public.subtasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subtasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for subtasks
CREATE POLICY "Users can view subtasks for tasks they have access to"
ON public.subtasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR tasks.delegated_to = auth.uid())
  )
);

CREATE POLICY "Users can insert subtasks for tasks they have access to"
ON public.subtasks FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR tasks.delegated_to = auth.uid())
  )
);

CREATE POLICY "Users can update subtasks for tasks they have access to"
ON public.subtasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR tasks.delegated_to = auth.uid())
  )
);

-- Enable RLS on subtask_comments
ALTER TABLE public.subtask_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subtask_comments
CREATE POLICY "Users can view subtask comments for tasks they have access to"
ON public.subtask_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subtasks
    JOIN tasks ON tasks.id = subtasks.task_id
    WHERE subtasks.id = subtask_comments.subtask_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR tasks.delegated_to = auth.uid())
  )
);

CREATE POLICY "Users can insert subtask comments for tasks they have access to"
ON public.subtask_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM subtasks
    JOIN tasks ON tasks.id = subtasks.task_id
    WHERE subtasks.id = subtask_comments.subtask_id
    AND (tasks.created_by = auth.uid() OR tasks.assigned_to = auth.uid() OR tasks.delegated_to = auth.uid())
  )
);

-- Create trigger for subtasks updated_at
CREATE TRIGGER update_subtasks_updated_at
BEFORE UPDATE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();