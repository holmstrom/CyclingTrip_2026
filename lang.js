const translations = {
    nav: {
        gallery: "Galleri",
        program: "Program",
        routes: "Ruter",
        forecast: "Prognose",
        budget: "Budget",
        logistics: "Logistik",
        planBtn: "Planlæg Tur",
        shareBtn: "Del"
    },
    hero: {
        pill: "3. Juni - 6. Juni, 2026",
        title: "Bestig Bjerge<br><span class='text-accent'>Sammen.</span>",
        subtitle: "Vive la France, Vive la Vélo, Vive la Champagne!",
        ctaRoute: "Se Ruter",
        ctaBudget: "Tur Budget"
    },
    gallery: {
        title: "Tidligere Ture",
        subtitle: "Øjeblikke fra vores seneste eventyr."
    },
    program: {
        title: "Program",
        subtitle: "Dag for dag oversigt.",
        days: [
            {
                date: "3. Juni - Ankomst",
                title: "Base Camp Etablering",
                desc: "Ankomst til Bourg d'Oisans. Check-in, samling af cykler og let aftenrul. Middag på La Romanche."
            },
            {
                date: "4. Juni - Dag 1",
                title: "Alpe d'Huez",
                desc: "Morgenmad kl 08:00. Afgang kl 09:30. Vi starter med legenden. Frokost på toppen."
            },
            {
                date: "5. Juni - Dag 2",
                title: "Croix de Fer",
                desc: "Dronningetapen. Lang dag i sadlen med fantastisk natur. Middag på Le P'tit Polyte."
            },
            {
                date: "6. Juni - Dag 3",
                title: "Galibier & Hjemrejse",
                desc: "Tidlig start. Vi kører op til taget af touren. Pakning og afrejse sen eftermiddag."
            }
        ]
    },
    travel: {
        title: "Rejse & Leje",
        subtitle: "Fly, Bil og Cykler.",
        flight: {
            title: "Fly",
            desc: "København (CPH) -> Lyon (LYS)",
            details: ["Afgang: 08:00 - 10:30", "Hjemkomst: 20:00 - 22:30", "Selskab: SAS / Air France"]
        },
        car: {
            title: "Billeje",
            desc: "2x Stationcars fra Lyon Lufthavn",
            details: ["Køretid: 1t 30m", "Parkering: Inkluderet v/ hotel", "Pris: ~€50 pp"]
        },
        bike: {
            title: "Cykelleje",
            desc: "Cycle Huez (Pinarello/Specialized)",
            details: ["Pris: €60-€80 / dag", "Husk pedaler og hjelm", "Booking: 3 mdr før"]
        }
    },
    routes: {
        title: "Trilogien",
        subtitle: "Præstations Prognose",
        ftpPlaceholder: "FTP (Watt)",
        weightPlaceholder: "Vægt (kg)",
        day1: "Dag 1",
        day2: "Dag 2",
        day3: "Dag 3",
        distLabel: "Distance",
        gradLabel: "Gns. Stigning",
        estTime: "Est. Tid",
        kom: "KOM",
        downloadGpx: "Download GPX",
        sharingTitle: "Rute Deling",
        sharingSubtitle: "Upload GPX eller del Strava links.",
        dragDrop: "Træk & Slip GPX fil her",
        orLabel: "eller",
        browseBtn: "Gennemse Filer"
    },
    stayFinder: {
        title: "Find Overnatning",
        subtitle: "Søg hoteller tæt på bjergene.",
        label: "Lokation",
        btn: "Søg på Booking.com"
    },
    essentials: {
        title: "Udstyr & Info",
        subtitle: "Huskeliste og vigtig viden.",
        packing: {
            title: "Pakkeliste",
            subtitle: "Gemmes automatisk."
        },
        weather: {
            title: "Vejrudsigt",
            subtitle: "Bjergvejr links."
        },
        emergency: {
            title: "Nødinfo"
        }
    },
    routeViewer: {
        title: "Detaljerede Kort",
        subtitle: "Interaktive kort fra OnTheGoMap.",
        placeholder: "Indsæt dit OnTheGoMap embed link her.",
        createBtn: "Opret Rute"
    },
    altBase: {
        title: "Alternativ Base",
        subtitle: "Andre muligheder i området.",
        name: "Saint-Jean-de-Maurienne",
        desc: "Beliggende på den nordlige side af bjergene. Kendt som 'Verdens cykelhovedstad'.",
        pros: ["Direkte adgang til Glandon/Galibier (Nord)", "Lacets de Montvernier", "Mindre turistet"],
        cons: ["Længere fra Alpe d'Huez", "Mere industrielt præg"],
        hotels: {
            parc: {
                title: "Best Western Cœur de Maurienne",
                tier: "Mellemklasse",
                desc: "Moderne komfort i centrum."
            },
            georges: {
                title: "Hôtel Saint-Georges",
                tier: "Mellemklasse",
                desc: "God værdi og tæt på restauranter."
            },
            camping: {
                title: "Camping des Grands Cols",
                tier: "Økonomi",
                desc: "Perfekt til budgetrejser."
            }
        }
    },
    forecast: {
        title: "Prognose & Vinderbud",
        subtitle: "Tilføj ryttere for at simulere klassementet (GC).",
        addRiderBtn: "Tilføj Rytter",
        tableRider: "Rytter",
        tableWkg: "W/kg",
        tableAlpe: "Alpe d'Huez",
        tableCroix: "Croix de Fer",
        tableGalibier: "Galibier",
        tableTotal: "Total Tid (GC)",
        tableRank: "Placering"
    },
    budget: {
        title: "Tur Budget",
        subtitle: "Fælles udgiftsstyring.",
        itemPlaceholder: "Udgift (f.eks. Hotel)",
        costPlaceholder: "Pris (€)",
        payerPlaceholder: "Betaler",
        addBtn: "+",
        tableItem: "Post",
        tablePayer: "Betaler",
        tableCost: "Pris",
        tablePerPerson: "Pr. Person (8)",
        totalLabel: "Total Tur Pris",
        ppLabel: "Pris Pr. Person"
    },
    logistics: {
        title: "Base & Energi",
        subtitle: "Hoteller & Restauranter",
        disclaimer: "Bemærk: Hotel ledighed for 2026 er ikke bekræftet. Priser er estimater.",
        hotels: {
            chalet: {
                title: "Chalet Ilfer",
                tier: "High-End",
                desc: "Privat luksus i Vaujany.",
                location: "Vaujany (20 min fra Bourg). Panoramaudsigt over dalen.",
                pros: ["Privat sauna", "Kæmpe køkken", "Ingen andre gæster"],
                cons: ["Kørsel til start", "Dyrere"]
            },
            milan: {
                title: "Hotel de Milan",
                tier: "Mellemklasse",
                desc: "Cykel-hub i centrum.",
                location: "Midt i Bourg d'Oisans. Direkte ved foden af Alpe d'Huez.",
                pros: ["Lige ved start", "God morgenmad", "Cyklist-stemning"],
                cons: ["Små værelser", "Støj fra gaden"]
            },
            camping: {
                title: "Camping La Cascade",
                tier: "Økonomi",
                desc: "Hytter tæt på naturen.",
                location: "Udkanten af byen. Roligt og naturskønt.",
                pros: ["Billigt", "Natur", "Selvforplejning"],
                cons: ["Delte faciliteter", "Simpel komfort"]
            }
        },
        restaurants: {
            polyte: {
                title: "Le P'tit Polyte",
                tier: "Michelin Mad",
                desc: "Michelin-stjerne middag."
            },
            romanche: {
                title: "La Romanche",
                tier: "Brasserie",
                desc: "Kvalitetsbøffer og vin."
            },
            tremplin: {
                title: "Le Tremplin",
                tier: "Casual",
                desc: "Pizza og burgere."
            }
        },
        visitLink: "Besøg Website →",
        unitNight: "/nat",
        unitPp: "/pers"
    },
    map: {
        title: "Områdekort",
        subtitle: "Oisans Dalen & Ruter"
    },
    footer: {
        text: "© 2026 Alps Expedition Team",
        shareMessage: "Tjek vores Alpe tur plan! 🏔️🚴"
    }
};
