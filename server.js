const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.get("/api/dictionary", (req, res) => {
    try {
        const filePath = path.join(
            __dirname,
            "countries.csv"
        );

        const csv = fs.readFileSync(
            filePath,
            "utf8"
        );

        const lines = csv
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const words = [];

        for (let i = 1; i < lines.length; i++) {
            const columns = parseCsvLine(lines[i]);

            const country =
                columns[0]?.trim();

            const capital =
                columns[1]?.trim();

            if (country) {
                words.push(country);
            }

            if (capital) {
                words.push(capital);
            }
        }

        const uniqueWords = [
            ...new Set(words)
        ];

        res.json(uniqueWords);

    } catch (error) {
        console.error(
            "辞書の読み込みに失敗しました。",
            error
        );

        res.status(500).json({
            error: "dictionary_load_error"
        });
    }
});

function parseCsvLine(line) {
    const columns = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const character = line[i];

        if (character === '"') {
            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }

            continue;
        }

        if (
            character === "," &&
            !insideQuotes
        ) {
            columns.push(current);
            current = "";
            continue;
        }

        current += character;
    }

    columns.push(current);

    return columns;
}

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});