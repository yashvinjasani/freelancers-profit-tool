import pandas as pd
import sqlite3
import os

DB_FILE = 'freelance.db'

def migrate():
    # 1. Connect to (or create) the database
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 2. Create the Tables (SQL Schema)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Client TEXT NOT NULL,
            Hours REAL,
            Type TEXT,
            Date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS income_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Client TEXT NOT NULL,
            Amount REAL,
            Date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 3. Import CSV data if it exists
    if os.path.exists('time_logs.csv'):
        df_time = pd.read_csv('time_logs.csv')
        df_time.to_sql('time_logs', conn, if_exists='append', index=False)
        print(f"✅ Migrated {len(df_time)} time logs.")

    if os.path.exists('income_logs.csv'):
        df_income = pd.read_csv('income_logs.csv')
        df_income.to_sql('income_logs', conn, if_exists='append', index=False)
        print(f"✅ Migrated {len(df_income)} income logs.")

    conn.commit()
    conn.close()
    print("🎉 Database setup complete: freelance.db")

if __name__ == '__main__':
    migrate()