from model import db, Point

with db as database:
    database.create_tables([Point])