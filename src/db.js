export async function getPoints() {
    const response = await fetch("http://127.0.0.1:5000/getpoints", { method: "GET" });
    let points;
    await response.json().then((data) => {
        points = data;
    });
    return points;
}

export async function addPoint(x, y, icon, username) {
    const response = await fetch("http://127.0.0.1:5000/addpoint",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                {
                    username: username,
                    x: x,
                    y: y,
                    icon: icon
                }
            )
        });
    return response.json();
}