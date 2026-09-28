const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.get(
    "/api/dictionary",
    (req, res) => {

        try {

            const csv =
                fs.readFileSync(
                    path.join(
                        __dirname,
                        "countries.csv"
                    ),
                    "utf8"
                );

            const lines =
                csv
                .split(/\r?\n/)
                .filter(Boolean);

            const words = [];

            for (
                let i = 1;
                i < lines.length;
                i++
            ) {

                const cols =
                    lines[i]
                    .split(",");

                const country =
                    cols[0]?.trim();

                const capital =
                    cols[1]?.trim();

                if (country) {
                    words.push(country);
                }

                if (capital) {
                    words.push(capital);
                }
            }

            res.json(words);

        } catch (e) {

            console.error(e);

            res.status(500).json({
                error:
                "dictionary load error"
            });
        }
    }
);

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on ${PORT}`
        );
    }
);