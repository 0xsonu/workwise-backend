-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    row_number INT NOT NULL,
    seat_number INT NOT NULL,
    booked_by INT,
    booked_at TIMESTAMP,
    CONSTRAINT unique_seat UNIQUE(row_number, seat_number)
);

-- Populate seats table
DO $$
DECLARE
  row INT;
  seat INT;
BEGIN
  -- Rows 1 to 11 with 7 seats each
  FOR row IN 1..11 LOOP
    FOR seat IN 1..7 LOOP
      INSERT INTO seats(row_number, seat_number) 
      VALUES (row, seat)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Row 12 with 3 seats
  row := 12;
  FOR seat IN 1..3 LOOP
    INSERT INTO seats(row_number, seat_number) 
    VALUES (row, seat)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
