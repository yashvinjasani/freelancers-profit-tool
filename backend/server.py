from flask import Flask, jsonify, request
import pandas as pd
import sqlite3
import numpy as np
from sklearn.linear_model import LinearRegression
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
DB_FILE = 'freelance.db'
SECRET_KEY = 'your_super_secret_key_change_this_in_production' 

def get_db_connection():
    # timeout=10 tells SQLite to wait 10 seconds for the lock to free up
    conn = sqlite3.connect(DB_FILE, timeout=10) 
    conn.row_factory = sqlite3.Row
    return conn

# --- SECURITY DECORATOR ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if token is in headers
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Decode the token to get the user_id
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        # Pass the user_id to the actual route function
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# --- AUTH ROUTES ---

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    hashed_password = generate_password_hash(data['password'], method='scrypt')
    
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                     (data['username'], hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User created successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username already exists'}), 409

@app.route('/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth['username'] or not auth['password']:
        return jsonify({'message': 'Could not verify'}), 401
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (auth['username'],)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], auth['password']):
        # Generate Token
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({'token': token})
    
    return jsonify({'message': 'Login failed'}), 401

# --- PROTECTED DATA ROUTES ---
# Notice we added `current_user_id` as an argument to these functions

@app.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user_id):
    conn = get_db_connection()
    try:
        # ⚠️ ONLY fetch data for THIS user
        df_time = pd.read_sql('SELECT * FROM time_logs WHERE user_id = ?', conn, params=(current_user_id,))
        df_income = pd.read_sql('SELECT * FROM income_logs WHERE user_id = ?', conn, params=(current_user_id,))
    except:
        return jsonify([])
    finally:
        conn.close()

    if df_time.empty:
        return jsonify([])

    # ... (Aggregation Logic is identical to before) ...
    total_hours = df_time.groupby('Client')['Hours'].sum().reset_index(name='Total_Hours')
    
    admin_df = df_time[df_time['Type'] == 'Admin']
    if not admin_df.empty:
        admin_hours = admin_df.groupby('Client')['Hours'].sum().reset_index(name='Admin_Hours')
    else:
        admin_hours = pd.DataFrame(columns=['Client', 'Admin_Hours'])

    if not df_income.empty:
        total_revenue = df_income.groupby('Client')['Amount'].sum().reset_index(name='Revenue')
    else:
        total_revenue = pd.DataFrame(columns=['Client', 'Revenue'])

    df = pd.merge(total_hours, admin_hours, on='Client', how='left').fillna(0)
    df = pd.merge(df, total_revenue, on='Client', how='left').fillna(0)
    
    df['Real_Hourly_Rate'] = df.apply(lambda x: x['Revenue'] / x['Total_Hours'] if x['Total_Hours'] > 0 else 0, axis=1)
    df['Friction_Score'] = df.apply(lambda x: (x['Admin_Hours'] / x['Total_Hours'] * 100) if x['Total_Hours'] > 0 else 0, axis=1)

    # ML Forecast
    forecasts = []
    for client in df['Client']:
        client_logs = df_time[df_time['Client'] == client]
        if len(client_logs) >= 2:
            X = np.array(range(len(client_logs))).reshape(-1, 1)
            y = client_logs['Hours'].values
            model = LinearRegression()
            model.fit(X, y)
            next_val = model.predict([[len(client_logs)]])
            forecasts.append(round(float(next_val[0]), 1))
        else:
            avg = client_logs['Hours'].mean() if not client_logs.empty else 0
            forecasts.append(round(avg, 1))
    df['Forecast_Next_Hour'] = forecasts

    return jsonify(df.to_dict(orient='records'))

@app.route('/add-time', methods=['POST'])
@token_required
def add_time(current_user_id):
    data = request.json
    conn = get_db_connection()
    # ⚠️ Insert with user_id
    conn.execute('INSERT INTO time_logs (Client, Hours, Type, user_id) VALUES (?, ?, ?, ?)',
                 (data['Client'], data['Hours'], data['Type'], current_user_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/add-income', methods=['POST'])
@token_required
def add_income(current_user_id):
    data = request.json
    conn = get_db_connection()
    # ⚠️ Insert with user_id
    conn.execute('INSERT INTO income_logs (Client, Amount, user_id) VALUES (?, ?, ?)',
                 (data['Client'], data['Amount'], current_user_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/client-history', methods=['GET'])
@token_required
def get_client_history(current_user_id):
    client = request.args.get('client')
    conn = get_db_connection()
    # ⚠️ Filter by user_id
    time_logs = conn.execute('SELECT * FROM time_logs WHERE Client = ? AND user_id = ? ORDER BY id DESC', (client, current_user_id)).fetchall()
    income_logs = conn.execute('SELECT * FROM income_logs WHERE Client = ? AND user_id = ? ORDER BY id DESC', (client, current_user_id)).fetchall()
    conn.close()
    return jsonify({"time": [dict(row) for row in time_logs], "income": [dict(row) for row in income_logs]})

@app.route('/update-log', methods=['POST'])
@token_required
def update_log(current_user_id):
    data = request.json
    table_map = {"time": "time_logs", "income": "income_logs"}
    table = table_map.get(data['type'])
    
    if not table: return jsonify({"error": "Invalid table"}), 400

    conn = get_db_connection()
    # ⚠️ Ensure user owns the record before updating
    query = f"UPDATE {table} SET {data['field']} = ? WHERE id = ? AND user_id = ?"
    cursor = conn.execute(query, (data['value'], data['id'], current_user_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    
    if rows_affected == 0:
        return jsonify({"error": "Update failed or unauthorized"}), 403

    return jsonify({"status": "updated"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)