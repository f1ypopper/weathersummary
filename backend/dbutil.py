from model import Point, db

db.connect()

def write_point_to_db(user, x, y, icon):
    point = Point(user=user, x=x, y=y, icon=icon)
    if point.save() != 1:
        print("NOT SAVED")

def get_all_points_from_db():
    points = list(map(lambda p: p.__dict__['__data__'], Point.select()))
    return points

def reset_db():
    Point.delete().execute()