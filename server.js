import express from "express";
import { readFile } from "fs/promises";

const app = express();
const PORT = 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.static("."));

/* =========================
   RSS ROUTE
========================= */
app.get("/rss.xml", async (req, res) => {
    let data;

    try {
        const raw = await readFile("./data/stappenplanV2.json", "utf-8");
        const tree = JSON.parse(raw);

        data = extractItems(tree);
    } catch (err) {
        console.error("Fout bij inlezen stappenplan.json:", err);
        return res.status(500).send("Feed tijdelijk niet beschikbaar");
    }

    const items = data
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 10)
        .map(item => `
        <item>
            <title>${item.name}</title>
            <link>${BASE_URL}/html${item.url}</link>
            <description><![CDATA[${item.beschrijving}]]></description>
            <category>${item.type}</category>
            <pubDate>${new Date(item.datum).toUTCString()}</pubDate>
            <guid isPermaLink="true">${BASE_URL}/html${item.url}</guid>
        </item>`)
        .join("");

    res.type("application/rss+xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>SnowCoach</title>
        <link>${BASE_URL}</link>
        <description>Nieuwe oefeningen en tips</description>
        <language>nl</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
    </channel>
</rss>`);
});

/* =========================
   INFO PAGINA
========================= */
app.get("/rss", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>RSS – SnowCoach</title>
</head>
<body>
    <h1>RSS-feed van SnowCoach</h1>
    <p><a href="/rss.xml">${BASE_URL}/rss.xml</a></p>
</body>
</html>`);
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`Server draait op ${BASE_URL}`);
});


function extractItems(node) {
    let result = [];

    // alleen oefeningen MET datum in RSS
    if (node.type === "oefening" && node.datum) {
        result.push({
            name: node.name,
            beschrijving: node.beschrijving || "",
            url: node.url.startsWith("/") ? node.url : "/" + node.url,
            type: node.type,
            datum: node.datum
        });
    }

    // recursief door boom
    if (node.children) {
        for (const child of node.children) {
            result = result.concat(extractItems(child));
        }
    }

    return result;
}