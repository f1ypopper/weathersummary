from peewee import *

db = SqliteDatabase("map.db")
#db = PostgresqlDatabase("map", user="map", host="localhost")
class Point(Model):
    user = CharField()
    x = DoubleField()
    y = DoubleField()
    icon = CharField()

    class Meta:
        database = db