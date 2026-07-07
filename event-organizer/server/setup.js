const pool = require('./db');

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50),
      date DATE,
      time VARCHAR(20),
      location VARCHAR(200),
      image_url TEXT,
      capacity INT DEFAULT 100,
      created_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      event_id INT REFERENCES events(id),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, event_id)
    );
  `);

  console.log('Tables created successfully!');
  process.exit();
}

setup();