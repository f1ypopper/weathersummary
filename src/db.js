const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:newpass1@localhost:5432/mappy')
let GeoPoint;
sequelize.authenticate().then(() => {
    GeoPoint = sequelize.define(
        'GeoPoint',
        {
            userName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            x: {
                type: DataTypes.DOUBLE,
                allowNull: false
            },
            y: {
                type: DataTypes.DOUBLE,
                allowNull: false
            },
            icon: {
                type: DataTypes.STRING,
                allowNull: false
            },
            audio: {
                type: DataTypes.BLOB,
            }
        }
    )
    GeoPoint.sync().then(() => {
    });
});
async function getPoints() {
    const points = await GeoPoint.findAll();
    return JSON.parse(JSON.stringify(points));
}

async function addPoint(username, x, y, icon, audioblob) {
    let blob = new Blob(audioblob, { type: "audio/ogg; codecs=opus" });
    await GeoPoint.create({ userName: username, x: x, y: y, icon: icon, audio: blob });
    return { username: username, x: x, y: y, icon: icon };
}

module.exports = { getPoints, addPoint }