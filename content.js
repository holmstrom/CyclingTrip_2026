// ============================================
// WEBSITE CONTENT - EASY TO EDIT
// ============================================
// Edit the text below to update the website content
// All text is in Danish - change as needed

const websiteContent = {
    // ===== HERO SECTION =====
    hero: {
        dateBadge: "3. Juni - 6. Juni, 2026",
        title: "Alors on",
        titleAccent: "Vélo!",
        subtitle: "Vive la France, Vive la Vélo, Vive la Champagne!",
        buttonPrimary: "Se Ruter",
        buttonSecondary: "Tur Budget"
    },

    // ===== NAVIGATION =====
    nav: {
        logo: "6th Tour",
        links: {
            updates: "Opdateringer",
            gallery: "Galleri",
            program: "Program",
            routes: "Ruter",
            forecast: "Prognose",
            budget: "Budget",
            logistics: "Logistik"
        },
        shareButton: "Del",
        planButton: "Planlæg Tur"
    },

    // ===== SECTIONS =====
    sections: {
        previousRides: {
            title: "Tidligere Ture",
            subtitle: "Reklamebilleder fra tidligere ture"
        },
        program: {
            title: "Program",
            subtitle: "Dag-for-dag oversigt over turen"
        },
        routes: {
            title: "Ruter",
            subtitle: "bjergpas efter bjergpas efter bjergpas"
        },
        forecast: {
            title: "Prognose og Vinderbud",
            subtitle: "Indtast din FTP og vægt for at se forventet tid"
        },
        budget: {
            title: "Tur Budget",
            subtitle: "Fælles budget for hele gruppen"
        },
        logistics: {
            title: "Logistik",
            subtitle: "Overnatning, rejse og cykelleje"
        },
        blog: {
            title: "Opdateringer",
            subtitle: "Hold dig opdateret med de seneste nyheder og kommentarer fra holdet"
        }
    },

    // ===== ROUTES =====
    routes: {
        alpeDhuez: {
            name: "Alpe d'Huez",
            description: "De legendariske 21 hårnålesving. Den ultimative test.",
            distance: "55 km",
            elevation: "1,600 m",
            difficulty: "Svær"
        },
        croixDeFer: {
            name: "Croix de Fer",
            description: "Ofte kaldt det smukkeste bjergpas i Alperne.",
            distance: "65 km",
            elevation: "1,700 m",
            difficulty: "Svær"
        },
        galibier: {
            name: "Galibier",
            description: "Taget af Touren. Vi rører himlen ved 2,642m.",
            distance: "40-90 km",
            elevation: "1,200+ m",
            difficulty: "Meget Svær"
        }
    },

    // ===== PROGRAM =====
    program: {
        arrival: {
            date: "3. Juni - Ankomst",
            title: "Base Camp Etablering",
            description: "Ankomst til Bourg d'Oisans. Check-in, samling af cykler og let aftenrul. Middag på La Romanche.",
            items: [
                "14:00 - Ankomst & Check-in",
                "16:00 - Samling af cykler",
                "19:00 - Fælles middag"
            ]
        },
        day1: {
            date: "4. Juni - Dag 1",
            title: "Alpe d'Huez",
            description: "Vi kommer pisse friske efter at have kørt aftenen forinden og hele natten. Nu er vi klar!",
            items: [
                "08:00 - Ankomst til hotellet",
                "08:30 - Udpakning og check-in",
                "09:00 - Fælles Morgenmad",
                "09:45 - Allez - mod Alpe d'Huez",
                "12:00 - Kaffe på toppen",
                "12:30 - Retur til byen",
                "14:00 - Frokost i byen",
                "15:00 - Fadøl og champagne"
            ]   
        },
        day2: {
            date: "5. Juni - Dag 2",
            title: "Croix de Fer",
            description: "Dronningetapen. Lang dag i sadlen med flot natur. Middag på Le P'tit Polyte.",
            items: [
                "09:00 - Afgang mod Allemond",
                "13:00 - Frokoststop",
                "20:00 - Festmiddag"
            ]
        },
        day3: {
            date: "6. Juni - Dag 3",
            title: "Galibier & Hjemrejse",
            description: "Tidlig start. Vi kører op til taget af touren. Pakning og afrejse sen eftermiddag.",
            items: [
                "08:30 - Van transport til Lautaret",
                "11:00 - Galibier topbillede",
                "16:00 - Afrejse mod lufthavn"
            ]
        }
    },

    // ===== TRAVEL =====
    travel: {
        title: "Rejse & Leje",
        subtitle: "Fly, Bil og Cykler.",
        flight: {
            title: "Fly",
            route: "København (CPH) -> Lyon (LYS)",
            items: [
                "Afgang: 08:00 - 10:30",
                "Hjemkomst: 20:00 - 22:30",
                "Selskab: SAS / Air France"
            ]
        },
        car: {
            title: "Billeje",
            description: "I kan sgu da leje en bil også!",
            items: [
                "Køretid: 1t 30m",
                "Alternativt at vi henter ved lufthavnen"
            ]
        },
        bike: {
            title: "Cykelleje",
            description: "Professionelle vejcykler tilgængelige",
            items: [
                "https://bcyclet.com/bike-rental/alps-bike-rental/bourg-d-oisans/",
                "https://www.huezbikehire.com/en/rent-a-bike/",
                "Pris: ~€40-60/dag",
                "Levering: Direkte til hotellet",
                "Book: Via lokale cykelbutikker"
            ]
        }
    }
};

// ============================================
// AUTO-UPDATE FUNCTION
// ============================================
// This function automatically updates the page when content changes
function updatePageContent() {
    // Hero Section
    const heroDate = document.querySelector('.pill-badge');
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero p');
    const heroBtnPrimary = document.querySelector('.hero .btn-primary');
    const heroBtnSecondary = document.querySelector('.hero .btn-secondary');
    
    if (heroDate) heroDate.textContent = websiteContent.hero.dateBadge;
    if (heroTitle) {
        heroTitle.innerHTML = `${websiteContent.hero.title}<br><span class="text-accent">${websiteContent.hero.titleAccent}</span>`;
    }
    if (heroSubtitle) heroSubtitle.textContent = websiteContent.hero.subtitle;
    if (heroBtnPrimary) heroBtnPrimary.textContent = websiteContent.hero.buttonPrimary;
    if (heroBtnSecondary) heroBtnSecondary.textContent = websiteContent.hero.buttonSecondary;
    
    // Navigation
    const navLogo = document.querySelector('.logo');
    if (navLogo && navLogo.textContent.includes('ALPS')) {
        navLogo.innerHTML = `<div class="logo-dot"></div>${websiteContent.nav.logo}`;
    }
    
    // Update nav links
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length >= 7) {
        navLinks[0].textContent = websiteContent.nav.links.updates;
        navLinks[1].textContent = websiteContent.nav.links.gallery;
        navLinks[2].textContent = websiteContent.nav.links.program;
        navLinks[3].textContent = websiteContent.nav.links.routes;
        navLinks[4].textContent = websiteContent.nav.links.forecast;
        navLinks[5].textContent = websiteContent.nav.links.budget;
        navLinks[6].textContent = websiteContent.nav.links.logistics;
    }
    
    // Update Routes
    // Alpe d'Huez
    const alpeName = document.querySelector('[data-content="routes.alpeDhuez.name"]');
    const alpeDesc = document.querySelector('[data-content="routes.alpeDhuez.description"]');
    const alpeDist = document.querySelector('[data-route="alpeDhuez"] [data-content="routes.alpeDhuez.distance"]');
    const alpeElev = document.querySelector('[data-route="alpeDhuez"] [data-content="routes.alpeDhuez.elevation"]');
    const alpeDiff = document.querySelector('[data-route="alpeDhuez"] [data-content="routes.alpeDhuez.difficulty"]');
    
    if (alpeName) alpeName.textContent = websiteContent.routes.alpeDhuez.name;
    if (alpeDesc) alpeDesc.textContent = websiteContent.routes.alpeDhuez.description;
    if (alpeDist) alpeDist.textContent = websiteContent.routes.alpeDhuez.distance;
    if (alpeElev) alpeElev.textContent = websiteContent.routes.alpeDhuez.elevation;
    if (alpeDiff) alpeDiff.textContent = websiteContent.routes.alpeDhuez.difficulty;
    
    // Croix de Fer
    const croixName = document.querySelector('[data-content="routes.croixDeFer.name"]');
    const croixDesc = document.querySelector('[data-content="routes.croixDeFer.description"]');
    const croixDist = document.querySelector('[data-route="croixDeFer"] [data-content="routes.croixDeFer.distance"]');
    const croixElev = document.querySelector('[data-route="croixDeFer"] [data-content="routes.croixDeFer.elevation"]');
    const croixDiff = document.querySelector('[data-route="croixDeFer"] [data-content="routes.croixDeFer.difficulty"]');
    
    if (croixName) croixName.textContent = websiteContent.routes.croixDeFer.name;
    if (croixDesc) croixDesc.textContent = websiteContent.routes.croixDeFer.description;
    if (croixDist) croixDist.textContent = websiteContent.routes.croixDeFer.distance;
    if (croixElev) croixElev.textContent = websiteContent.routes.croixDeFer.elevation;
    if (croixDiff) croixDiff.textContent = websiteContent.routes.croixDeFer.difficulty;
    
    // Galibier
    const galibierName = document.querySelector('[data-content="routes.galibier.name"]');
    const galibierDesc = document.querySelector('[data-content="routes.galibier.description"]');
    const galibierDist = document.querySelector('[data-route="galibier"] [data-content="routes.galibier.distance"]');
    const galibierElev = document.querySelector('[data-route="galibier"] [data-content="routes.galibier.elevation"]');
    const galibierDiff = document.querySelector('[data-route="galibier"] [data-content="routes.galibier.difficulty"]');
    
    if (galibierName) galibierName.textContent = websiteContent.routes.galibier.name;
    if (galibierDesc) galibierDesc.textContent = websiteContent.routes.galibier.description;
    if (galibierDist) galibierDist.textContent = websiteContent.routes.galibier.distance;
    if (galibierElev) galibierElev.textContent = websiteContent.routes.galibier.elevation;
    if (galibierDiff) galibierDiff.textContent = websiteContent.routes.galibier.difficulty;
    
    // Update route tabs
    const routeTabs = document.querySelectorAll('.route-tab');
    if (routeTabs.length >= 3) {
        routeTabs[0].textContent = websiteContent.routes.alpeDhuez.name;
        routeTabs[1].textContent = websiteContent.routes.croixDeFer.name;
        routeTabs[2].textContent = websiteContent.routes.galibier.name;
    }
    
    // Update Section Headers
    // Previous Rides
    const prevRidesTitle = document.querySelector('[data-content="sections.previousRides.title"]');
    const prevRidesSubtitle = document.querySelector('[data-content="sections.previousRides.subtitle"]');
    if (prevRidesTitle) prevRidesTitle.textContent = websiteContent.sections.previousRides.title;
    if (prevRidesSubtitle) prevRidesSubtitle.textContent = websiteContent.sections.previousRides.subtitle;
    
    // Program
    const programTitle = document.querySelector('[data-content="sections.program.title"]');
    const programSubtitle = document.querySelector('[data-content="sections.program.subtitle"]');
    if (programTitle) programTitle.textContent = websiteContent.sections.program.title;
    if (programSubtitle) programSubtitle.textContent = websiteContent.sections.program.subtitle;
    
    // Routes
    const routesTitle = document.querySelector('[data-content="sections.routes.title"]');
    const routesSubtitle = document.querySelector('[data-content="sections.routes.subtitle"]');
    if (routesTitle) routesTitle.textContent = websiteContent.sections.routes.title;
    if (routesSubtitle) routesSubtitle.textContent = websiteContent.sections.routes.subtitle;
    
    // Forecast
    const forecastTitle = document.querySelector('[data-content="sections.forecast.title"]');
    const forecastSubtitle = document.querySelector('[data-content="sections.forecast.subtitle"]');
    if (forecastTitle) forecastTitle.textContent = websiteContent.sections.forecast.title;
    if (forecastSubtitle) forecastSubtitle.textContent = websiteContent.sections.forecast.subtitle;
    
    // Budget
    const budgetTitle = document.querySelector('[data-content="sections.budget.title"]');
    const budgetSubtitle = document.querySelector('[data-content="sections.budget.subtitle"]');
    if (budgetTitle) budgetTitle.textContent = websiteContent.sections.budget.title;
    if (budgetSubtitle) budgetSubtitle.textContent = websiteContent.sections.budget.subtitle;
    
    // Blog/Updates
    const blogTitle = document.querySelector('[data-content="sections.blog.title"]');
    const blogSubtitle = document.querySelector('[data-content="sections.blog.subtitle"]');
    if (blogTitle) blogTitle.textContent = websiteContent.sections.blog.title;
    if (blogSubtitle) blogSubtitle.textContent = websiteContent.sections.blog.subtitle;
    
    // Program is now handled by program-editor.js
    // It loads from Firebase first, then falls back to content.js
    // No need to update program here - program-editor.js handles it
    
    // Update Travel Section
    // Section Header
    const travelTitle = document.querySelector('[data-content="travel.title"]');
    const travelSubtitle = document.querySelector('[data-content="travel.subtitle"]');
    if (travelTitle) travelTitle.textContent = websiteContent.travel.title;
    if (travelSubtitle) travelSubtitle.textContent = websiteContent.travel.subtitle;
    
    // Flight Card
    const flightTitle = document.querySelector('[data-travel="flight"] [data-content="travel.flight.title"]');
    const flightRoute = document.querySelector('[data-travel="flight"] [data-content="travel.flight.route"]');
    const flightItems = document.querySelector('[data-travel="flight"] [data-content="travel.flight.items"]');
    if (flightTitle) flightTitle.textContent = websiteContent.travel.flight.title;
    if (flightRoute) flightRoute.textContent = websiteContent.travel.flight.route;
    if (flightItems) {
        flightItems.innerHTML = websiteContent.travel.flight.items.map(item => `<li>${item}</li>`).join('');
    }
    
    // Car Card
    const carTitle = document.querySelector('[data-travel="car"] [data-content="travel.car.title"]');
    const carDesc = document.querySelector('[data-travel="car"] [data-content="travel.car.description"]');
    const carItems = document.querySelector('[data-travel="car"] [data-content="travel.car.items"]');
    if (carTitle) carTitle.textContent = websiteContent.travel.car.title;
    if (carDesc) carDesc.textContent = websiteContent.travel.car.description;
    if (carItems) {
        carItems.innerHTML = websiteContent.travel.car.items.map(item => `<li>${item}</li>`).join('');
    }
    
    // Bike Card
    const bikeTitle = document.querySelector('[data-travel="bike"] [data-content="travel.bike.title"]');
    const bikeDesc = document.querySelector('[data-travel="bike"] [data-content="travel.bike.description"]');
    const bikeItems = document.querySelector('[data-travel="bike"] [data-content="travel.bike.items"]');
    if (bikeTitle) bikeTitle.textContent = websiteContent.travel.bike.title;
    if (bikeDesc) bikeDesc.textContent = websiteContent.travel.bike.description;
    if (bikeItems) {
        bikeItems.innerHTML = websiteContent.travel.bike.items.map(item => {
            // Check if item is a URL
            if (item.startsWith('http')) {
                return `<li><a href="${item}" target="_blank" style="color: var(--accent); text-decoration: underline;">${item}</a></li>`;
            }
            return `<li>${item}</li>`;
        }).join('');
    }
}

// Run when DOM is ready - with delay to ensure all elements exist
function initContent() {
    // Wait a bit for all scripts to load
    setTimeout(() => {
        updatePageContent();
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContent);
} else {
    initContent();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = websiteContent;
}

