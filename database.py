import sqlite3
import hashlib

# Connect to database
def get_db():
    conn = sqlite3.connect("synapseai.db")
    conn.row_factory = sqlite3.Row
    return conn

# Create tables
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Chat history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            query TEXT NOT NULL,
            response TEXT NOT NULL,
            decision TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Hash password
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Save new user
def create_user(name, email, password):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hash_password(password))
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

# Verify user login
def verify_user(email, password):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    return user

# Save chat
def save_chat(user_email, query, response, decision):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chats (user_email, query, response, decision) VALUES (?, ?, ?, ?)",
        (user_email, query, response, decision)
    )
    conn.commit()
    conn.close()

# Get chat history
def get_chat_history(user_email):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM chats WHERE user_email=? ORDER BY timestamp DESC LIMIT 20",
        (user_email,)
    )
    chats = cursor.fetchall()
    conn.close()
    return chats