# Exam Exchange
An exam exchange website made for self-hosting. Upload exams and benefit from other exams. No more advantages for those with older siblings. A solid system that ensures that you also have to upload your own exams. Customizable for any school.

## Technical Details
Built with NextJS and Supabase

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

## Setup Database
1. Go to the **SQL Editor** tab on the Supabase project overview
2. Click on the **New query** button
3. Paste the code below into the editor
4. Run the code

```sql
DROP TABLE IF EXISTS public.upcoming_exams;
DROP TABLE IF EXISTS public.uploaded_exams;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.teachers;
DROP TABLE IF EXISTS public.students;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

DROP TRIGGER IF EXISTS on_new_upcoming_exam ON public.upcoming_exams;
DROP FUNCTION IF EXISTS public.handle_upcoming_exam_register;

DROP TRIGGER IF EXISTS on_uploaded_exams_updated ON public.uploaded_exams;
DROP FUNCTION IF EXISTS public.handle_uploaded_exam_validated;

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
    validated BOOLEAN DEFAULT false,
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
    validated BOOLEAN DEFAULT false,
    subject_name TEXT NOT NULL,
    color VARCHAR(6) NOT NULL
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

CREATE TRIGGER on_new_upcoming_exam
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
    image_paths TEXT[],
    subject_id SERIAL REFERENCES subjects(id),
    teacher_id SERIAL REFERENCES teachers(id)
);
ALTER TABLE public.uploaded_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for themselves"
ON public.uploaded_exams
FOR INSERT 
WITH CHECK (
    auth.uid() = student_id AND validated = false 
);

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
```

## Enable Storage
Go to the **Storage** tab and create a new bucket named `exam-images`