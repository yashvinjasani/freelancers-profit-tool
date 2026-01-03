import sqlite3

DB_FILE = 'freelance.db'

def migrate_auth():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # 2. Add user_id to existing tables
    # SQLite doesn't support "ADD COLUMN" with constraints easily, 
    # so we will check if the column exists first.
    try:
        cursor.execute('ALTER TABLE time_logs ADD COLUMN user_id INTEGER')
        print("✅ Added user_id to time_logs")
    except sqlite3.OperationalError:
        print("ℹ️ user_id already exists in time_logs")

    try:
        cursor.execute('ALTER TABLE income_logs ADD COLUMN user_id INTEGER')
        print("✅ Added user_id to income_logs")
    except sqlite3.OperationalError:
        print("ℹ️ user_id already exists in income_logs")

    conn.commit()
    conn.close()
    print("🎉 Database security upgrade complete.")

if __name__ == '__main__':
    migrate_auth()