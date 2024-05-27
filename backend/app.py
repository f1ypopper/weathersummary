from flask import Flask, request
from dbutil import write_point_to_db, get_all_points_from_db, reset_db

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<h1> Weather Summary Backend</h1>"

@app.route("/addpoint", methods=["POST"])
def addpoint():
    data = request.json
    print(data)
    user = data["username"]
    x = data["x"]
    y= data["y"]
    icon = data["icon"]
    write_point_to_db(user=user, x=x, y=y, icon=icon)
    return  data   

@app.route("/getpoints", methods=["GET"])
def getpoints():
    data = get_all_points_from_db()
    return data

@app.route("/reset", methods=["GET"])
def resetdb():
    reset_db()
    return 'db reset'