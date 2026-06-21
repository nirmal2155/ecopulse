"""
SQLite Database Layer — zero-dependency, zero-configuration persistence.

Uses Python's built-in sqlite3 module so there are NO extra packages to
install.  For a hackathon this is perfect: the DB file (ecopulse.db) is
created automatically on first run and lives next to the server process.
"""

import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "ecopulse.db"


@contextmanager
def get_db():
    """Context manager that yields a SQLite connection and auto-commits."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row   # rows behave like dicts
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create tables if they don't already exist (idempotent)."""
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id      TEXT PRIMARY KEY,
                display_name TEXT NOT NULL DEFAULT 'EcoPulse User',
                eco_coins    INTEGER NOT NULL DEFAULT 0,
                streak_days  INTEGER NOT NULL DEFAULT 0,
                last_log_date TEXT,
                logs_count   INTEGER NOT NULL DEFAULT 0,
                total_footprint_kg REAL NOT NULL DEFAULT 0.0
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     TEXT NOT NULL,
                logged_at   TEXT NOT NULL DEFAULT (date('now')),
                footprint_kg REAL NOT NULL,
                breakdown   TEXT NOT NULL,     -- JSON blob
                hot_spot    TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS challenges (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                title       TEXT NOT NULL,
                description TEXT NOT NULL,
                difficulty  TEXT NOT NULL,
                coins_reward INTEGER NOT NULL,
                category    TEXT NOT NULL,
                completed   INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
    print("[OK] Database initialised at", DB_PATH)


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def get_or_create_user(user_id: str) -> dict:
    """Return user row, creating it with defaults if it doesn't exist."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ).fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO users (user_id) VALUES (?)", (user_id,)
            )
            row = conn.execute(
                "SELECT * FROM users WHERE user_id = ?", (user_id,)
            ).fetchone()
        return dict(row)


def update_user_coins(user_id: str, delta: int) -> int:
    """Add (or subtract) delta coins; return new balance."""
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET eco_coins = eco_coins + ? WHERE user_id = ?",
            (delta, user_id),
        )
        row = conn.execute(
            "SELECT eco_coins FROM users WHERE user_id = ?", (user_id,)
        ).fetchone()
        return row["eco_coins"]


def update_streak_and_logs(user_id: str, footprint_kg: float) -> int:
    """
    Update streak counter:
    - If last log was yesterday → increment streak
    - If last log was today → keep streak (already logged today)
    - Otherwise → reset to 1
    Returns the current streak value.
    """
    from datetime import date
    today = date.today().isoformat()

    with get_db() as conn:
        row = conn.execute(
            "SELECT streak_days, last_log_date FROM users WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        last = row["last_log_date"]
        streak = row["streak_days"]

        if last is None or last < today:
            # Check if last log was yesterday
            from datetime import timedelta
            yesterday = (date.today() - timedelta(days=1)).isoformat()
            if last == yesterday:
                streak += 1
            elif last == today:
                pass  # no change
            else:
                streak = 1  # reset

            conn.execute(
                """UPDATE users
                   SET streak_days = ?,
                       last_log_date = ?,
                       logs_count = logs_count + 1,
                       total_footprint_kg = total_footprint_kg + ?
                   WHERE user_id = ?""",
                (streak, today, footprint_kg, user_id),
            )

        return streak


# ---------------------------------------------------------------------------
# Activity log helpers
# ---------------------------------------------------------------------------

def save_activity_log(user_id: str, footprint_kg: float, breakdown: dict, hot_spot: str) -> None:
    with get_db() as conn:
        conn.execute(
            """INSERT INTO activity_logs (user_id, footprint_kg, breakdown, hot_spot)
               VALUES (?, ?, ?, ?)""",
            (user_id, footprint_kg, json.dumps(breakdown), hot_spot),
        )


def get_recent_logs(user_id: str, days: int = 7) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """SELECT logged_at, footprint_kg, breakdown, hot_spot
               FROM activity_logs
               WHERE user_id = ?
               ORDER BY logged_at DESC
               LIMIT ?""",
            (user_id, days),
        ).fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Challenge helpers
# ---------------------------------------------------------------------------

def save_challenges(user_id: str, challenges: list[dict]) -> None:
    with get_db() as conn:
        # Remove old uncompleted challenges for this user
        conn.execute(
            "DELETE FROM challenges WHERE user_id = ? AND completed = 0",
            (user_id,),
        )
        for ch in challenges:
            conn.execute(
                """INSERT OR REPLACE INTO challenges
                   (id, user_id, title, description, difficulty, coins_reward, category)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (ch["id"], user_id, ch["title"], ch["description"],
                 ch["difficulty"], ch["coins_reward"], ch["category"]),
            )


def get_user_challenges(user_id: str) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM challenges WHERE user_id = ? ORDER BY completed ASC, created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def complete_challenge(challenge_id: str, user_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM challenges WHERE id = ? AND user_id = ?",
            (challenge_id, user_id),
        ).fetchone()
        if row is None or row["completed"]:
            return None
        conn.execute(
            "UPDATE challenges SET completed = 1 WHERE id = ?", (challenge_id,)
        )
        return dict(row)
