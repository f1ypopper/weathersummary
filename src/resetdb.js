const {initDb, dropDb} = require("./db")

async function resetDatabase(){
    await initDb();
    await dropDb();
}

resetDatabase().then(()=>{
    console.log("Dropped GeoPoints");
})