class Oefeningkaart extends HTMLElement {

    static get observedAttributes() {
        return ["difficulty"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        const id = new URLSearchParams(window.location.search).get("id");

        if (!id) {
            this.shadowRoot.innerHTML = `<p class="fout">Geen oefening opgegeven.</p>`;
            return;
        }

        fetch("../data/stappenplanV2.json")
            .then(r => r.json())
            .then(data => {
                const oefening = this.zoekOefening(data, id); // this. niet data.

                if (!oefening) {
                    this.shadowRoot.innerHTML = `<p class="fout">Oefening "${id}" niet gevonden.</p>`;
                    return;
                }

                this.setAttribute("difficulty", oefening.difficulty ?? "beginner");
                this.render(oefening);

                if (oefening.houding) {
                    this.laadAnimatie(oefening.houding);
                }
            });
    }

    laadAnimatie(houdingNaam) {
        window.houdingNaam = houdingNaam;
        // Three.js is al geladen via importmap in HTML
        // Alleen threeScene.js laden met de juiste houding
        const animScript = document.createElement("script");
        animScript.type = "module";
        animScript.src = `../javascript/threeScene.js?houding=${houdingNaam}&t=${Date.now()}`;
        document.head.appendChild(animScript);
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "difficulty" && oldValue !== null) {
            this.render();
        }
    }

    zoekOefening(node, id) {
        if (node.id === id) return node;
        for (const kind of node.children ?? []) {
            const gevonden = this.zoekOefening(kind, id);
            if (gevonden) return gevonden;
        }
        return null;
    }

    render(oefening) {
        const difficulty = this.getAttribute("difficulty") ?? "beginner";

        this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;

                        /* kleuren */
                        --blue-900: #042C53;
                        --blue-800: #0C447C;
                        --blue-600: #185FA5;
                        --blue-400: #378ADD;
                        --blue-200: #85B7EB;
                        --blue-100: #B5D4F4;
                        --blue-50: #E6F1FB;

                        --text-muted: #5F8AB0;
                        --text-faint: #9BB5CC;

                        /* spacing */
                        --space-xs: 0.5rem;
                        --space-sm: 0.75rem;
                        --space-md: 1rem;
                        --space-lg: 1.5rem;
                        --space-xl: 2rem;

                        /* radius */
                        --radius-md: 8px;
                        --radius-lg: 12px;

                        /* fonts */
                        --font-serif: 'DM Serif Display', Georgia, serif;
                        --font-sans: system-ui, -apple-system, sans-serif;
                    }

                    /* terug link */
                    a.terug {
                        display: inline-block;
                        font-size: 13px;
                        color: var(--blue-400);
                        text-decoration: none;
                        margin-bottom: var(--space-lg);
                    }

                    a.terug:hover {
                        color: var(--blue-600);
                    }

                    /* header */
                    .header {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-bottom: var(--space-lg);
                    }

                    h1 {
                        font-family: var(--font-serif);
                        font-size: 2rem;
                        font-weight: 400;
                        color: var(--blue-900);
                        margin: var(--space-sm) 0 0;
                        text-align: center;
                    }

                    /* badge */
                    .badge {
                        margin-top: var(--space-sm);
                        font-size: 11px;
                        font-weight: 500;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        padding: 4px 12px;
                        border-radius: 999px;
                    }

                    /* difficulty via host */
                    :host([difficulty="beginner"]) .badge {
                        background: var(--blue-50);
                        color: var(--blue-600);
                        border: 1px solid var(--blue-400);
                    }

                    :host([difficulty="gemiddeld"]) .badge {
                        background: var(--blue-200);
                        color: var(--blue-800);
                        border: 1px solid var(--blue-600);
                    }

                    :host([difficulty="gevorderd"]) .badge {
                        background: var(--blue-400);
                        color: var(--blue-900);
                        border: 1px solid var(--blue-800);
                    }

                    /* kaart */
                    .kaart {
                        background: white;
                        border: 1px solid var(--blue-100);
                        border-radius: var(--radius-lg);
                        padding: var(--space-md) var(--space-lg);
                        margin-bottom: var(--space-md);
                        font-size: 15px;
                        line-height: 1.7;
                        color: var(--blue-900);
                        transition: box-shadow 0.2s ease, transform 0.2s ease;
                    }

                    

                    /* titels */
                    .kaart h2 {
                        font-family: var(--font-serif);
                        font-size: 1.2rem;
                        font-weight: 400;
                        color: var(--blue-900);
                        margin: 0 0 var(--space-sm);
                    }

                    /* foto's */
                    .fotos {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: var(--space-sm);
                        padding: var(--space-xs);
                    }

                    .fotos img {
                        width: 100%;
                        display: block;
                        border-radius: var(--radius-md);
                        aspect-ratio: 4 / 3;
                    }

                    /* lijsten */
                    ul {
                        padding-left: 1.25rem;
                        display: flex;
                        flex-direction: column;
                        gap: 0.4rem;
                        margin: 0;
                    }

                    li {
                        font-size: 14px;
                        color: var(--text-muted);
                        line-height: 1.6;
                    }

                    /* fout */
                    .fout {
                        text-align: center;
                        padding: var(--space-xl);
                        color: var(--text-faint);
                        font-size: 14px;
                    }

                    /* animatie */
                    #animatie-container {
                        width: 100%;
                        height: 400px;
                        overflow: hidden;
                        position: relative;
                    }

                    #animatie-container canvas {
                        width: 100% !important;
                        height: 100% !important;
                        display: block;
                    }
                </style>
    
                <div class="header">
                    <span class="badge">${difficulty}</span>
                    <h1>${oefening.name}</h1>
                </div>

                ${oefening.fotos ? `
                    <div class="kaart fotos">
                        ${oefening.fotos.map(foto => `
                            <img src="${foto}" alt="${oefening.name}" />
                        `).join("")}
                    </div>
                ` : ""}


                ${oefening.houding ? `
                    <div class="kaart">
                        <h2>3D houding</h2>
                        <div id="animatie-container" style="width:100%; height:400px;"></div>
                    </div>
                ` : ""}

                ${oefening.beschrijving ? `
                    <div class="kaart">
                        <h2>Beschrijving</h2>
                        <p>${oefening.beschrijving}</p>
                    </div>
                ` : ""}
                ${oefening.benodigdheden ? `
                    <div class="kaart">
                        <h2>Benodigdheden</h2>
                        <p>${oefening.benodigdheden_intro ?? ""}</p>
                        <ul>
                            ${(oefening.benodigdheden ?? ["Geen benodigdheden opgegeven."]).map(item => `<li>${item}</li>`).join("")}
                        </ul>
                    </div>
                ` : ""}
                ${oefening.uitleg ? `
                    <div class="kaart">
                        <h2>Uitleg</h2>
                        ${oefening.uitleg.map(blok => {
            if (blok.type === "tekst") {
                return `<p>${blok.inhoud}</p>`;
            }
            if (blok.type === "lijst") {
                return `
                <p><strong>${blok.titel ?? ""}</strong></p>
                <ul>
                    ${blok.items.map(item => `<li>${item}</li>`).join("")}
                </ul>
                    `;
            }
            return "";
        }).join("")}
                    </div>
                ` : ""}
                ${oefening.tips?.length ? `
                <div class="kaart">
                    <h2>Tips</h2>
                    <ul>
                        ${oefening.tips.map(tip => `<li>${tip}</li>`).join("")}
                    </ul>
                </div>
            ` : ""}
                ${oefening.oefenvormen ? `
                <div class="kaart">
                    <h2>Oefenvormen voor lesgevers</h2>
                    ${oefening.oefenvormen.map(o => `
                        <div style="margin-bottom:1rem;">
                            <strong>${o.titel}</strong>
                            <p>${o.beschrijving}</p>
                            <em>Doel: ${o.doel}</em>
                        </div>
                    `).join("")}
                </div>
            ` : ""}
            `;
    }
}

customElements.define("oefening-kaart", Oefeningkaart);
