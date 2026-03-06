-- Migration: Add Face Recognition System
-- Description: Add face_descriptors table for storing face embeddings

-- Create face_descriptors table
CREATE TABLE face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  descriptor FLOAT[] NOT NULL, -- 128 dimensions vector
  image_url TEXT, -- Optional reference image URL
  quality FLOAT NOT NULL, -- Detection confidence (0-1)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for fast employee lookup
CREATE INDEX idx_face_descriptors_employee_id ON face_descriptors(employee_id);

-- Create index for quality filtering
CREATE INDEX idx_face_descriptors_quality ON face_descriptors(quality);

-- Function to check maximum descriptors per employee
CREATE OR REPLACE FUNCTION check_max_face_descriptors()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM face_descriptors WHERE employee_id = NEW.employee_id) >= 5 THEN
    RAISE EXCEPTION 'Employee can have maximum 5 face descriptors';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce max descriptors
CREATE TRIGGER enforce_max_face_descriptors
BEFORE INSERT ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION check_max_face_descriptors();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_face_descriptors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_face_descriptors_timestamp
BEFORE UPDATE ON face_descriptors
FOR EACH ROW
EXECUTE FUNCTION update_face_descriptors_updated_at();

-- Add comment
COMMENT ON TABLE face_descriptors IS 'Stores face recognition descriptors (128-dim vectors) for employee attendance';
COMMENT ON COLUMN face_descriptors.descriptor IS '128-dimensional face embedding vector from face-api.js';
COMMENT ON COLUMN face_descriptors.quality IS 'Face detection confidence score (0-1), higher is better';
