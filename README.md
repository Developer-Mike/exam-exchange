# Exam Exchange
An exam exchange website made for self-hosting and Built with NextJS and Supabase. Upload exams and benefit from other exams. No more advantages for those with older siblings. A solid system that ensures that you also have to upload your own exams. Customizable for any school.

## Install dependencies
Run the command `npm install`

## Fill out the config
Fill out the `config.ts` in the `src` folder

## Setup Supabase Project
1. Go to supabase.com and login/register
2. Create a new Project
3. Rename the `template.env.local` file to `.env.local`
4. Fill out the `.env.local` file

## Setup Auth
Go to the **Authentication** tab and enable auth by email

## Setup Database and Storage
1. Go to the **SQL Editor** tab on the Supabase project overview
2. Click on the **New query** button
3. Paste the code below into the editor
4. Run the code

```sql
-- Create Tables
CREATE TABLE public.students (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    credits NUMERIC(4, 0) NOT NULL DEFAULT 2
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for own account"
ON public.students
FOR SELECT
USING (
    auth.uid() = id
);

CREATE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE PLPGSQL
    SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
    INSERT INTO public.students (id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE public.teachers (
    id SERIAL PRIMARY KEY,
    validated BOOLEAN DEFAULT false NOT NULL,
    abbreviation VARCHAR(3) UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for everyone"
ON public.teachers
FOR SELECT USING (
  true
);

CREATE POLICY "Write access"
ON public.teachers
FOR INSERT 
WITH CHECK (
    validated = false 
);

CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    validated BOOLEAN DEFAULT false NOT NULL,
    subject_name TEXT NOT NULL,
    color VARCHAR(6)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access for everyone"
ON public.subjects
FOR SELECT USING (
  true
);

CREATE POLICY "Write access"
ON public.subjects
FOR INSERT 
WITH CHECK (
    validated = false 
);

CREATE TABLE public.upcoming_exams (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    register_date TIMESTAMPTZ NOT NULL default now(),
    subject_id SERIAL REFERENCES subjects(id),
    teacher_id SERIAL REFERENCES teachers(id),
    class VARCHAR(3) NOT NULL,
    topic TEXT
);
ALTER TABLE public.upcoming_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow delete for themselves"
ON public.upcoming_exams
FOR DELETE 
USING (
    auth.uid() = student_id
);
CREATE POLICY "Allow insert for themselves"
ON public.upcoming_exams
FOR INSERT 
WITH CHECK (
    auth.uid() = student_id
);

-- Create trigger for subtracting credits when registering an upcoming exam
CREATE FUNCTION public.handle_upcoming_exam_register()
    RETURNS trigger
    LANGUAGE PLPGSQL
    SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
    -- Subtract one credit
    UPDATE public.students
    SET credits = credits - 1
    WHERE id = NEW.student_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_upcoming_exam_inserted
    AFTER INSERT
    ON public.upcoming_exams
    FOR EACH ROW EXECUTE PROCEDURE public.handle_upcoming_exam_register();

CREATE TABLE public.uploaded_exams (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    validated BOOLEAN NOT NULL default false,
    upload_date TIMESTAMPTZ NOT NULL default now(),
    topic TEXT NOT NULL,
    class VARCHAR(3) NOT NULL,
    issue_year NUMERIC(4, 0),
    subject_id SERIAL REFERENCES subjects(id),
    teacher_id SERIAL REFERENCES teachers(id)
);
ALTER TABLE public.uploaded_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for everyone"
ON public.uploaded_exams
FOR INSERT
WITH CHECK (
    true
);

CREATE POLICY "Allow read for self" 
ON public.uploaded_exams
FOR READ
USING (
    auth.uid() = student_id
);

-- Create trigger for validating uploaded exams
CREATE FUNCTION public.handle_uploaded_exam()
    RETURNS trigger
    LANGUAGE PLPGSQL
AS $$
BEGIN
    IF NEW.student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Student ID must match authenticated user ID';        
    END IF;

    NEW.validated = false;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_uploaded_exams_inserted
  BEFORE INSERT
  ON public.uploaded_exams
  FOR EACH ROW EXECUTE PROCEDURE handle_uploaded_exam();

-- Create listener for verifying uploaded exams for adding credits 
CREATE FUNCTION public.handle_uploaded_exam_validated()
    RETURNS trigger
    LANGUAGE PLPGSQL
    SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
    IF NOT (
        SELECT validated FROM public.uploaded_exams WHERE id = NEW.id
    ) AND NEW.validated THEN 
        -- Add one credit
        UPDATE public.students
        SET credits = credits + 1
        WHERE id = NEW.student_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_uploaded_exams_updated
    BEFORE UPDATE
    ON public.uploaded_exams
    FOR EACH ROW EXECUTE PROCEDURE public.handle_uploaded_exam_validated();

-- Create bucket for exam images
INSERT INTO storage.buckets 
    (id, name)
VALUES
    ('exam-images', 'exam-images');

CREATE POLICY "Allow uploading exam images in own folder"
ON storage.objects
FOR INSERT 
TO public
WITH CHECK (
    bucket_id = 'exam-images'
    and auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow reading exam images in own folder"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
```