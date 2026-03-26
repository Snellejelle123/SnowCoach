class OefeningLijst extends HTMLElement {

    static get observedAttributes() {
        return ["difficulty", "categorie", "zoek"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.oefeningen = [];
    }

    connectedCallback() {
        fetch("../data/stappenplanV2.json")
            .then(r => r.json())
            .then(data => {
                this.oefeningen = this.extractOefeningen(data);
                this.vulCategorieDropdown();
                this.render();
                this.bindFilters();
            });
    }

    attributeChangedCallback() {
        if (this.oefeningen.length) this.render();
    }

    // Platte lijst van alle oefeningen
    extractOefeningen(data) {
        const lijst = [];
        for (const categorie of data.children ?? []) {
            for (const oefening of categorie.children ?? []) {
                lijst.push({ ...oefening, categorie: categorie.name });
            }
        }
        return lijst;
    }

    // Vul de categorie dropdown in de HTML (niet in de Shadow DOM)
    vulCategorieDropdown() {
        const select = document.getElementById("categorie-select");
        const categorieen = [...new Set(this.oefeningen.map(o => o.categorie))];
        categorieen.forEach(c => {
            const option = document.createElement("option");
            option.value = c;
            option.textContent = c;
            select.appendChild(option);
        });
    }

    // Luister naar de filters in de HTML
    bindFilters() {
        document.getElementById("zoek").addEventListener("input", e => {
            this.setAttribute("zoek", e.target.value);
        });

        document.getElementById("categorie-select").addEventListener("change", e => {
            this.setAttribute("categorie", e.target.value);
        });

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.setAttribute("difficulty", btn.dataset.diff);
            });
        });
    }

    get gefilterd() {
        const diff = this.getAttribute("difficulty") ?? "alle";
        const cat = this.getAttribute("categorie") ?? "alle";
        const zoek = (this.getAttribute("zoek") ?? "").toLowerCase();

        return this.oefeningen.filter(o =>
            (diff === "alle" || o.difficulty === diff) &&
            (cat === "alle" || o.categorie === cat) &&
            o.name.toLowerCase().includes(zoek)
        );
    }

    render() {
        const gefilterd = this.gefilterd;

        // Update teller in de HTML
        const label = document.getElementById("resultaat-label");
        if (label) label.textContent = `${gefilterd.length} resultaten`;

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; 
                        --blue-900: #042C53;
                        --blue-800: #0C447C;
                        --blue-600: #185FA5;
                        --blue-400: #378ADD;
                        --blue-200: #85B7EB;
                        --blue-100: #B5D4F4;
                        --blue-50: #E6F1FB;
                        --surface: #F0F4F8;
                        --white: #ffffff;
                        --text-muted: #5F8AB0;
                        --text-faint: #9BB5CC;

                        --radius-md: 8px;
                        --radius-lg: 12px;
                        --radius-pill: 999px;

                        --font-sans: 'DM Sans', sans-serif;
                        --font-serif: 'DM Serif Display', serif;
                    }

                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 1rem;
                        padding: 2rem;
                    }

                    a.kaart {
                        background: var(--white);
                        border: 1px solid var(--blue-100);
                        border-radius: var(--radius-lg);
                        padding: 1.25rem;
                        text-decoration: none;
                        display: block;
                        transition: box-shadow 0.2s ease, transform 0.2s ease;
                    }

                    a.kaart:hover {
                        box-shadow: 0 4px 16px rgba(4, 44, 83, 0.1);
                        transform: translateY(-2px);
                    }

                    .kaart-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 0.75rem;
                    }

                    .badge {
                        font-size: 10px;
                        font-weight: 500;
                        letter-spacing: 1.2px;
                        text-transform: uppercase;
                        padding: 3px 10px;
                        border-radius: var(--radius-pill);
                    }

                    /* Difficulty kleuren */
                    .badge.beginner {
                        background: var(--blue-50);
                        color: var(--blue-600);
                        border: 1px solid var(--blue-400);
                    }

                    .badge.gemiddeld {
                        background: var(--blue-200);
                        color: var(--blue-800);
                        border: 1px solid var(--blue-600);
                    }

                    .badge.gevorderd {
                        background: var(--blue-400);
                        color: var(--blue-900);
                        border: 1px solid var(--blue-800);
                    }

                    .categorie-tag {
                        font-size: 11px;
                        color: var(--text-faint);
                    }

                    h2 {
                        font-family: var(--font-serif);
                        font-size: 1.1rem;
                        font-weight: 400;
                        color: var(--blue-900);
                        margin: 0 0 0.5rem;
                    }

                    p {
                        font-size: 13px;
                        color: var(--text-muted);
                        line-height: 1.55;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .leeg {
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 3rem;
                        color: var(--text-faint);
                        font-size: 14px;
                    }
            </style>

            <div class="grid">
                ${gefilterd.length === 0
                ? `<p class="leeg">Geen oefeningen gevonden.</p>`
                : gefilterd.map(o => `
                        <a class="kaart" href="oefening.html?id=${o.id}">
                            <div class="kaart-top">
                                <span class="badge ${o.difficulty}">${o.difficulty}</span>
                                <span class="categorie-tag">${o.categorie}</span>
                            </div>
                            <h2>${o.name}</h2>
                            <p>${o.beschrijving ?? ""}</p>
                        </a>
                    `).join("")}
            </div>
        `;
    }
}

customElements.define("oefening-lijst", OefeningLijst);