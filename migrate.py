import sqlite3
db = sqlite3.connect('apps/desktop/resources/directories_v5.db')
try:
    db.execute('ALTER TABLE currency_master ADD COLUMN locale TEXT NOT NULL DEFAULT "en-IN"')
except Exception as e:
    print(e)
try:
    db.execute('ALTER TABLE currency_master ADD COLUMN symbol_position TEXT NOT NULL DEFAULT "PREFIX"')
except Exception as e:
    print(e)
try:
    db.execute('ALTER TABLE currency_master ADD COLUMN decimal_places INTEGER NOT NULL DEFAULT 2')
except Exception as e:
    print(e)
try:
    db.execute('ALTER TABLE currency_master ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0')
except Exception as e:
    print(e)
db.commit()
db.close()
print("Done")
