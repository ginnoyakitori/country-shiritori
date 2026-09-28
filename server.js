const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/dictionary", (req, res) => {

    const countries = fs.readFileSync(
        path.join(__dirname, "countries.txt"),
        "utf8"
    );

    const capitals = fs.readFileSync(
        path.join(__dirname, "capitals.txt"),
        "utf8"
    );

    res.json({
        countries: countries
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(Boolean),

        capitals: capitals
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(Boolean)
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});