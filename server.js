import express from "express";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { watch } from "fs";

const app = express();
const PORT = 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.static("."));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// rss aanmaken op /rss.xml 
app.get("/rss.xml", async (req, res) => {
    const categorieFilter = req.query.categorie;

    let data;
    try {
        const raw = await readFile("./data/stappenplanV2.json", "utf-8");
        const tree = JSON.parse(raw);
        data = extractItems(tree);
    } catch (err) {
        console.error("Fout bij inlezen stappenplan.json:", err);
        return res.status(500).send("Feed tijdelijk niet beschikbaar");
    }

    const gefilterd = categorieFilter
        ? data.filter(item => item.categorie === categorieFilter)
        : data;

    const items = gefilterd
        .sort((a, b) => new Date(b.datum) - new Date(a.datum))
        .slice(0, 10)
        .map(item => `
        <item>
            <title>${item.name}</title>
            <link>${BASE_URL}/html${item.url}</link>
            <description><![CDATA[${item.beschrijving}]]></description>
            <category>${item.categorie}</category>
            <pubDate>${new Date(item.datum).toUTCString()}</pubDate>
            <guid isPermaLink="true">${BASE_URL}/html${item.url}</guid>
        </item>`)
        .join("");

    res.type("application/rss+xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>SnowCoach${categorieFilter ? ` – ${categorieFilter}` : ""}</title>
        <link>${BASE_URL}</link>
        <description>Nieuwe oefeningen en tips</description>
        <language>nl</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
    </channel>
</rss>`);
});




// rss info webpagina + webmention info pagina 
app.get("/rss", (req, res) => {
    res.sendFile(path.resolve("html/rss.html"));
});





// webmention versturen 
app.post("/webmention", async (req, res) => {
    const source = req.body.source;
    const target = req.body.target;

    if (!source || !target) {
        return res.status(400).send("source en target zijn verplicht");
    }

    if (!target.startsWith(BASE_URL)) {
        return res.status(400).send("Target is niet van deze site");
    }

    let mentions = [];
    try {
        const raw = await readFile("./data/webmentions.json", "utf-8");
        mentions = JSON.parse(raw);
    } catch {

    }

    mentions.push({
        id: Date.now(),
        source,
        target,
        site: new URL(source).hostname,
        timestamp: new Date().toISOString(),
        goedgekeurd: false
    });

    await writeFile("./data/webmentions.json", JSON.stringify(mentions, null, 2));
    res.status(202).send("Webmention ontvangen");
});




// webmention lezen 
app.get("/api/webmentions", async (req, res) => {
    try {
        const raw = await readFile("./data/webmentions.json", "utf-8");
        res.json(JSON.parse(raw));
    } catch {
        res.json([]);
    }
});




// webmention goedkeuren  
app.post("/admin/webmentions/:id/goedkeuren", async (req, res) => {
    const raw = await readFile("./data/webmentions.json", "utf-8");
    const mentions = JSON.parse(raw);
    const mention = mentions.find(m => m.id === parseInt(req.params.id));
    if (!mention) return res.status(404).send("Niet gevonden");
    mention.goedgekeurd = true;
    await writeFile("./data/webmentions.json", JSON.stringify(mentions, null, 2));
    res.json({ bericht: "Goedgekeurd" });
});




// webmention verwijderen  
app.delete("/admin/webmentions/:id", async (req, res) => {
    const raw = await readFile("./data/webmentions.json", "utf-8");
    let mentions = JSON.parse(raw);
    mentions = mentions.filter(m => m.id !== parseInt(req.params.id));
    await writeFile("./data/webmentions.json", JSON.stringify(mentions, null, 2));
    res.json({ bericht: "Verwijderd" });
});



//server starten voor rss en webmention 
app.listen(PORT, () => {
    console.log(`Server draait op ${BASE_URL}`);
    stuurWebmentionsAutomatisch();
});



//Dit is voor rss feed aan te maken als er een datum bij staat in de stappenplan voegd hij het toe 
function extractItems(node, categorie = null) {
    let result = [];

    if (node.type === "oefening" && node.datum) {
        result.push({
            name: node.name,
            beschrijving: node.beschrijving || "",
            url: node.url.startsWith("/") ? node.url : "/" + node.url,
            type: node.type,
            categorie: categorie,
            datum: node.datum
        });
    }

    if (node.children) {
        for (const child of node.children) {
            const cat = node.type === "categorie" ? node.id : categorie;
            result = result.concat(extractItems(child, cat));
        }
    }

    return result;
}




// webmentions automatisch versturen behalve als het al eens is verstuurd 
async function stuurWebmentionsAutomatisch() {
    console.log("Webmentions scannen...");

    let data;
    try {
        const raw = await readFile("./data/stappenplanV2.json", "utf-8");
        data = extractItems(JSON.parse(raw));
    } catch (err) {
        console.error("Fout bij inlezen JSON:", err);
        return;
    }

    // Laad al verstuurde URLs
    let alVerstuurd = [];
    try {
        const raw = await readFile("./data/webmentions-sent.json", "utf-8");
        alVerstuurd = JSON.parse(raw);
    } catch {
        // bestand bestaat nog niet
    }

    // Zoek externe URLs in beschrijvingen
    const urlRegex = /https?:\/\/[^\s"<>]+/g;


    for (const item of data) {
        const gevondenUrls = item.beschrijving?.match(urlRegex) || [];
        const externeUrls = gevondenUrls.filter(url => !url.startsWith(BASE_URL));

        for (const targetUrl of externeUrls) {
            const source = `${BASE_URL}/html/webmention-test.html`;
            const sleutel = `${source}::${targetUrl}`;

            if (alVerstuurd.includes(sleutel)) {
                console.log(`Al verstuurd: ${targetUrl}`);
                continue;
            }

            try {
                // Zoek webmention endpoint op externe pagina
                const pageRes = await fetch(targetUrl);
                const html = await pageRes.text();

                const match =
                    html.match(/<link[^>]+rel=["']webmention["'][^>]+href=["']([^"']+)["']/i) ||
                    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']webmention["']/i);
                // <link rel="webmention" href="https://snowcoach-production.up.railway.app/webmention" />

                if (!match) {
                    console.log(`Geen webmention endpoint op: ${targetUrl}`);
                    continue;
                }

                const endpoint = new URL(match[1], targetUrl).href;

                const wmRes = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `source=${encodeURIComponent(source)}&target=${encodeURIComponent(targetUrl)}`
                });

                console.log(`Webmention verstuurd naar ${endpoint} — status: ${wmRes.status}`);

                alVerstuurd.push(sleutel);
                await writeFile("./data/webmentions-sent.json", JSON.stringify(alVerstuurd, null, 2));

            } catch (err) {
                console.error(`Fout bij versturen naar ${targetUrl}:`, err.message);
            }
        }
    }

    console.log("Webmention scan klaar");
}
