-- Add task_type enum
CREATE TYPE task_type AS ENUM ('ad_hoc', 'strategic');

-- Add task_type column to tasks table
ALTER TABLE tasks ADD COLUMN task_type task_type NOT NULL DEFAULT 'ad_hoc';