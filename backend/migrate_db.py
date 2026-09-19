"""
PulseConnect Database Migration Script
Upgrades SQLite databases (pulseconnect.db and blood_connect.db if found).
- Adds 'role' column (default 'donor_acceptor') to users table if missing.
- Ensures all existing users have role = 'donor_acceptor'.
- Provides option to promote a user to admin.
"""

import sys
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def migrate_db(db_path: Path):
    if not db_path.exists():
        print(f"[-] Database not found at {db_path}")
        return False

    print(f"[*] Migrating database: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check columns in users table
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]

    if "role" not in cols:
        print("[+] Adding 'role' column to 'users' table...")
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'donor_acceptor'")
        conn.commit()
    else:
        print("[=] 'role' column already exists in 'users'.")

    # Backfill any nulls
    cursor.execute("UPDATE users SET role = 'donor_acceptor' WHERE role IS NULL")
    conn.commit()

    # Ensure notifications table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        request_id INTEGER,
        message VARCHAR(500) NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(request_id) REFERENCES emergency_requests(id) ON DELETE CASCADE
    )
    """)
    conn.commit()

    # Count rows and roles
    cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
    role_counts = cursor.fetchall()
    print(f"[+] Current user roles in {db_path.name}: {role_counts}")

    conn.close()
    return True

def promote_to_admin(db_path: Path, identifier: str):
    if not db_path.exists():
        return
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    if identifier.isdigit():
        cursor.execute("UPDATE users SET role = 'admin' WHERE id = ?", (int(identifier),))
    else:
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (identifier.lower(),))

    if cursor.rowcount > 0:
        conn.commit()
        print(f"[+] Successfully promoted user '{identifier}' to admin in {db_path.name}!")
    else:
        print(f"[-] No user matching '{identifier}' found in {db_path.name}.")

    conn.close()

if __name__ == "__main__":
    db_candidates = [
        BASE_DIR / "pulseconnect.db",
        BASE_DIR / "blood_connect.db",
    ]

    for db_file in db_candidates:
        if db_file.exists():
            migrate_db(db_file)

    if len(sys.argv) >= 3 and sys.argv[1] == "--make-admin":
        user_identifier = sys.argv[2]
        for db_file in db_candidates:
            if db_file.exists():
                promote_to_admin(db_file, user_identifier)
