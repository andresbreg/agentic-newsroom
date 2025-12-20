import sqlite3

conn = sqlite3.connect('news.db')
cursor = conn.cursor()

print("Adding entities_extracted column to news_items table...")

# Add entities_extracted column
try:
    cursor.execute("ALTER TABLE news_items ADD COLUMN entities_extracted BOOLEAN DEFAULT 0")
    print("✓ Added entities_extracted column")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("✓ entities_extracted column already exists")
    else:
        raise

conn.commit()
conn.close()
print("\n✅ Database migration completed!")
