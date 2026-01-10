document.addEventListener('DOMContentLoaded', () => {
    
    // --- Firebase Sync Manager ---
    const syncManager = {
        isFirebaseAvailable: false,
        isAuthenticated: false,
        
        init: function() {
            // Check if Firebase is available
            if (typeof firebase !== 'undefined' && window.db) {
                this.isFirebaseAvailable = true;
                // Check if user is authenticated (password entered in session)
                const authToken = sessionStorage.getItem('alps_auth_token');
                if (authToken) {
                    this.isAuthenticated = true;
                }
            }
        },
        
        // Simple hash function for password (not cryptographically secure, but sufficient for basic protection)
        hashPassword: function(password) {
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString();
        },
        
        // Validate password against Firebase
        validatePassword: async function(password) {
            if (!this.isFirebaseAvailable) {
                console.error('Firebase not available');
                return false;
            }
            
            if (!window.db) {
                console.error('Firestore database not initialized');
                return false;
            }
            
            try {
                const configDoc = await window.db.collection('alps-2026').doc('config').get();
                if (!configDoc.exists) {
                    // First time setup - create config with default password
                    const defaultPassword = 'alps2026'; // Change this!
                    const hashedPassword = this.hashPassword(defaultPassword);
                    await window.db.collection('alps-2026').doc('config').set({
                        password: hashedPassword
                    });
                    console.log('Config document created with default password');
                    // Try again with provided password
                    const isValid = this.hashPassword(password) === hashedPassword;
                    console.log('Password validation result:', isValid);
                    return isValid;
                }
                
                const storedHash = configDoc.data().password;
                const isValid = this.hashPassword(password) === storedHash;
                console.log('Password validation result:', isValid);
                return isValid;
            } catch (error) {
                console.error('Password validation error:', error);
                console.error('Error details:', error.message, error.code);
                // Show more helpful error
                if (error.code === 'failed-precondition') {
                    console.error('Firestore database not enabled. Please enable it in Firebase Console.');
                } else if (error.code === 'permission-denied') {
                    console.error('⚠️ PERMISSION DENIED - Firestore security rules are blocking access!');
                    console.error('Go to Firebase Console -> Firestore Database -> Rules tab');
                    console.error('Temporarily set rules to: allow read, write: if true;');
                    console.error('Then click "Publish"');
                } else if (error.code === 'unavailable') {
                    console.error('Firestore service unavailable. Check your internet connection.');
                }
                return false;
            }
        },
        
        // Load data from Firebase (with localStorage fallback)
        loadData: async function(dataType) {
            if (!this.isFirebaseAvailable || !this.isAuthenticated) {
                // Fallback to localStorage
                const key = `alps_${dataType}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            }
            
            try {
                const doc = await window.db.collection('alps-2026').doc(dataType).get();
                if (doc.exists) {
                    const data = doc.data();
                    // Also save to localStorage as backup
                    localStorage.setItem(`alps_${dataType}`, JSON.stringify(data.value || data));
                    return data.value || data;
                }
                return null;
            } catch (error) {
                console.error(`Error loading ${dataType}:`, error);
                // Fallback to localStorage
                const key = `alps_${dataType}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            }
        },
        
        // Save data to Firebase (with localStorage backup)
        saveData: async function(dataType, data) {
            // Always save to localStorage as backup
            localStorage.setItem(`alps_${dataType}`, JSON.stringify(data));
            
            if (!this.isFirebaseAvailable || !this.isAuthenticated) {
                return false;
            }
            
            try {
                await window.db.collection('alps-2026').doc(dataType).set({
                    value: data,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            } catch (error) {
                console.error(`Error saving ${dataType}:`, error);
                return false;
            }
        },
        
        // Specific loaders
        loadBudget: async function() {
            const data = await this.loadData('budget_v2');
            return data || [];
        },
        
        saveBudget: async function(expenses) {
            return await this.saveData('budget_v2', expenses);
        },
        
        loadPackingList: async function() {
            const data = await this.loadData('packing_list');
            return data || [];
        },
        
        savePackingList: async function(items) {
            return await this.saveData('packing_list', items);
        },
        
        loadRiders: async function() {
            const data = await this.loadData('riders_v2');
            return data || [];
        },
        
        saveRiders: async function(riders) {
            return await this.saveData('riders_v2', riders);
        },
        
        // Upload GPX to Firebase Storage
        uploadGPX: async function(routeKey, gpxData, metadata) {
            if (!this.isFirebaseAvailable || !this.isAuthenticated) {
                return false;
            }
            
            try {
                // Store in Firestore subcollection
                const gpxRef = window.db.collection('alps-2026').doc('routes').collection('gpx').doc(routeKey);
                await gpxRef.set({
                    gpxData: gpxData,
                    metadata: metadata,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            } catch (error) {
                console.error('Error uploading GPX:', error);
                return false;
            }
        },
        
        // Load GPX from Firebase
        loadGPX: async function(routeKey) {
            if (!this.isFirebaseAvailable || !this.isAuthenticated) {
                return null;
            }
            
            try {
                const doc = await window.db.collection('alps-2026').doc('routes').collection('gpx').doc(routeKey).get();
                if (doc.exists) {
                    return doc.data();
                }
                return null;
            } catch (error) {
                console.error('Error loading GPX:', error);
                return null;
            }
        }
    };
    
    // Initialize sync manager
    syncManager.init();
    
    // Diagnostic: Check Firebase connection
    if (syncManager.isFirebaseAvailable && window.db) {
        console.log('Firebase initialized successfully');
        // Test Firestore connection
        window.db.collection('_test').doc('connection').get()
            .then(() => console.log('Firestore connection test: SUCCESS'))
            .catch((err) => {
                console.error('Firestore connection test: FAILED', err);
                if (err.code === 'failed-precondition') {
                    console.error('⚠️ Firestore database not enabled! Please:');
                    console.error('1. Go to Firebase Console -> Firestore Database');
                    console.error('2. Click "Create database"');
                    console.error('3. Choose "Start in test mode"');
                }
            });
    } else {
        console.warn('Firebase not available - check firebase-config.js');
    }
    
    // --- Password System ---
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    
    // Check if already authenticated
    if (!sessionStorage.getItem('alps_auth_token')) {
        // Show password modal if Firebase is available
        if (syncManager.isFirebaseAvailable) {
            if (passwordModal) passwordModal.style.display = 'flex';
        }
    } else {
        syncManager.isAuthenticated = true;
    }
    
    // Password submit handler
    if (passwordSubmit && passwordInput) {
        const handlePasswordSubmit = async () => {
            const password = passwordInput.value.trim();
            if (!password) {
                if (passwordError) {
                    passwordError.textContent = 'Indtast venligst en adgangskode';
                    passwordError.style.display = 'block';
                }
                return;
            }
            
            try {
                const isValid = await syncManager.validatePassword(password);
                if (isValid) {
                    sessionStorage.setItem('alps_auth_token', 'authenticated');
                    syncManager.isAuthenticated = true;
                    if (passwordModal) passwordModal.style.display = 'none';
                    // Reload data from Firebase
                    location.reload();
                } else {
                    if (passwordError) {
                        passwordError.textContent = 'Forkert adgangskode. Prøv igen. (Standard: alps2026)';
                        passwordError.style.display = 'block';
                    }
                    passwordInput.value = '';
                }
            } catch (error) {
                console.error('Login error:', error);
                if (passwordError) {
                    let errorMsg = `Fejl: ${error.message || 'Ukendt fejl'}`;
                    if (error.code === 'permission-denied') {
                        errorMsg = 'Firestore sikkerhedsregler blokerer adgang. Gå til Firebase Console -> Firestore Database -> Rules og sæt: allow read, write: if true;';
                    }
                    passwordError.innerHTML = `${errorMsg} <br><small>Tjek browser console (F12) for detaljer.</small>`;
                    passwordError.style.display = 'block';
                }
            }
        };
        
        passwordSubmit.addEventListener('click', handlePasswordSubmit);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            }
        });
    }
    
    // Make syncManager globally available
    window.syncManager = syncManager;
    
    // --- Localization ---
    function applyTranslations() {
        if (typeof translations === 'undefined') return;

        const setHtml = (selector, html) => {
            const el = document.querySelector(selector);
            if (el) el.innerHTML = html;
        };
        const setText = (selector, text) => {
            const el = document.querySelector(selector);
            if (el) el.textContent = text;
        };
        const setAttr = (selector, attr, val) => {
            const el = document.querySelector(selector);
            if (el) el.setAttribute(attr, val);
        };

        // Nav
        setText('a[href="#previous-rides"]', translations.nav.gallery);
        setText('a[href="#rides"]', translations.nav.routes);
        setText('a[href="#forecast"]', translations.nav.forecast);
        setText('a[href="#budget"]', translations.nav.budget);
        setText('a[href="#sleep"]', translations.nav.logistics);
        setText('nav .btn-primary', translations.nav.planBtn);
        const shareBtn = document.getElementById('share-btn');
        if(shareBtn) shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${translations.nav.shareBtn}`;

        // Hero
        setText('.hero .pill-badge', translations.hero.pill);
        setHtml('.hero h1', translations.hero.title);
        setText('.hero p', translations.hero.subtitle);
        setText('.hero .btn-primary', translations.hero.ctaRoute);
        setText('.hero .btn-secondary', translations.hero.ctaBudget);

        // Gallery
        setText('#previous-rides h2', translations.gallery.title);
        setText('#previous-rides p', translations.gallery.subtitle);

        // Routes
        setText('#rides h2', translations.routes.title);
        setText('#rides .text-secondary', translations.routes.subtitle);
        setAttr('#user-ftp', 'placeholder', translations.routes.ftpPlaceholder);
        setAttr('#user-weight', 'placeholder', translations.routes.weightPlaceholder);

        document.querySelectorAll('.ride-stats').forEach(statBlock => {
            const labels = statBlock.querySelectorAll('.stat-lbl');
            if (labels[0]) labels[0].textContent = translations.routes.distLabel;
            if (labels[1]) labels[1].textContent = translations.routes.gradLabel;
        });

        document.querySelectorAll('.calc-display span:first-child').forEach(el => {
            el.textContent = translations.routes.estTime;
        });

        // Forecast
        setText('#forecast h2', translations.forecast.title);
        setText('#forecast .text-secondary', translations.forecast.subtitle);
        setText('#add-rider-btn', translations.forecast.addRiderBtn);
        setAttr('#rider-name', 'placeholder', translations.forecast.tableRider); 
        
        const ths = document.querySelectorAll('#leaderboard-table th');
        if (ths.length > 0) {
            ths[0].textContent = translations.forecast.tableRider;
            ths[1].textContent = translations.forecast.tableWkg;
            ths[2].textContent = translations.forecast.tableAlpe;
            ths[3].textContent = translations.forecast.tableCroix;
            ths[4].textContent = translations.forecast.tableGalibier;
            ths[5].textContent = translations.forecast.tableTotal;
            ths[6].textContent = translations.forecast.tableRank;
        }

        // Budget
        setText('#budget h2', translations.budget.title);
        setText('#budget .text-secondary', translations.budget.subtitle);
        setAttr('#expense-item', 'placeholder', translations.budget.itemPlaceholder);
        setAttr('#expense-cost', 'placeholder', translations.budget.costPlaceholder);
        setAttr('#expense-payer', 'placeholder', translations.budget.payerPlaceholder);
        setText('#add-expense-btn', translations.budget.addBtn);

        const bths = document.querySelectorAll('#budget-table th');
        if (bths.length > 0) {
            bths[0].textContent = translations.budget.tableItem;
            bths[1].textContent = translations.budget.tablePayer;
            bths[2].textContent = translations.budget.tableCost;
            bths[3].textContent = translations.budget.tablePerPerson;
        }

        // Alternative Base
        setText('#alternative-base h2', translations.altBase.title);
        setText('#alternative-base p.text-secondary', translations.altBase.subtitle);
        setText('#alternative-base h3', translations.altBase.name);
        // Accommodations for Alt Base
        const altCards = document.querySelectorAll('#alternative-base .card');
        if(altCards[0]) {
            altCards[0].querySelector('h4').textContent = translations.altBase.hotels.parc.title;
            altCards[0].querySelector('.text-secondary').textContent = translations.altBase.hotels.parc.tier;
            altCards[0].querySelector('p:nth-of-type(2)').textContent = translations.altBase.hotels.parc.desc;
        }
        if(altCards[1]) {
            altCards[1].querySelector('h4').textContent = translations.altBase.hotels.georges.title;
            altCards[1].querySelector('.text-secondary').textContent = translations.altBase.hotels.georges.tier;
            altCards[1].querySelector('p:nth-of-type(2)').textContent = translations.altBase.hotels.georges.desc;
        }
        if(altCards[2]) {
            altCards[2].querySelector('h4').textContent = translations.altBase.hotels.camping.title;
            altCards[2].querySelector('.text-secondary').textContent = translations.altBase.hotels.camping.tier;
            altCards[2].querySelector('p:nth-of-type(2)').textContent = translations.altBase.hotels.camping.desc;
        }

        // Logistics (Base & Fuel)
        setText('#sleep h2', translations.logistics.title);
        // Note: Individual list items are hardcoded in HTML for the list view now.
        // If dynamic translation is needed for the list, specific IDs would be required.

        // Stay Finder
        setText('#stay-finder h2', translations.stayFinder.title);
        setText('#stay-finder p.text-secondary', translations.stayFinder.subtitle);
        setText('label[for="stay-location"]', translations.stayFinder.label);
        setText('#stay-search-btn', translations.stayFinder.btn);

        // Essentials
        setText('#essentials h2', translations.essentials.title);
        setText('#essentials p.text-secondary', translations.essentials.subtitle);
        setText('#essentials .card:nth-child(1) h3', `<i class="fas fa-suitcase"></i> ${translations.essentials.packing.title}`);
        setText('#essentials .card:nth-child(1) p.text-secondary', translations.essentials.packing.subtitle);
        
        setText('#essentials .card:nth-child(2) h3', `<i class="fas fa-cloud-sun"></i> ${translations.essentials.weather.title}`);
        setText('#essentials .card:nth-child(2) p.text-secondary', translations.essentials.weather.subtitle);

        setText('#essentials .card:nth-child(3) h3', `<i class="fas fa-first-aid"></i> ${translations.essentials.emergency.title}`);
        
        // Route Viewer
        setText('#route-viewer h2', translations.routeViewer.title);
        setText('#route-viewer p.text-secondary', translations.routeViewer.subtitle);
        setText('#route-placeholder p', translations.routeViewer.placeholder);
        setText('#route-placeholder .btn', `<i class="fas fa-map-marked-alt"></i> ${translations.routeViewer.createBtn}`);
        
        setText('footer p', translations.footer.text);

        // --- GPX Upload Logic (Moved to Map Section) ---
        // See 'Route Viewer Logic' below for implementation


        // --- Alt Routes Upload ---
        // Alternative Routes Storage
        let alternativeRoutes = JSON.parse(localStorage.getItem('alps_alternative_routes')) || [];
        let altRouteMap = null;
        let currentAltRouteData = null;
        
        const altInput = document.getElementById('alt-file-input');
        const altList = document.getElementById('alt-routes-list');
        const altDropZone = document.getElementById('alt-drop-zone');
        const altViewer = document.getElementById('alt-route-viewer');
        const altMapDiv = document.getElementById('alt-route-map');
        const altViewerTitle = document.getElementById('alt-route-viewer-title');
        const altViewerClose = document.getElementById('alt-route-viewer-close');
        const altControls = document.getElementById('alt-route-controls');
        const altDownloadBtn = document.getElementById('alt-download-gpx-btn');
        
        // Initialize alternative routes map (lazy - only when needed)
        function initAltRouteMap() {
            if (altRouteMap) return altRouteMap; // Already initialized
            
            if (!altMapDiv || typeof L === 'undefined') {
                console.error('Cannot initialize alt route map: Leaflet not available or map div not found');
                return null;
            }
            
            try {
                // Ensure map div is visible and has dimensions
                if (altViewer) altViewer.style.display = 'block';
                altRouteMap = L.map('alt-route-map').setView([45.092, 6.068], 11);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(altRouteMap);
                
                // Hide viewer again if it was hidden
                setTimeout(() => {
                    if (altViewer && !currentAltRouteData) {
                        altViewer.style.display = 'none';
                    }
                }, 100);
                
                return altRouteMap;
            } catch (err) {
                console.error('Alt route map init error:', err);
                return null;
            }
        }
        
        // Function to render alternative route in separate viewer
        function renderAltRoute(route) {
            if (!route || !route.gpxData) return;
            
            // Initialize map if not already done
            if (!altRouteMap) {
                initAltRouteMap();
            }
            
            if (!altRouteMap || typeof L === 'undefined') {
                alert('Kortet er ikke tilgængeligt. Tjek at Leaflet er indlæst.');
                return;
            }
            
            // Show viewer first (so map has dimensions)
            if (altViewer) altViewer.style.display = 'block';
            if (altViewerTitle) altViewerTitle.textContent = route.name;
            if (altControls) altControls.style.display = 'none';
            if (altDownloadBtn) altDownloadBtn.style.display = 'block';
            
            // Wait a moment for the viewer to render, then invalidate map size
            setTimeout(() => {
                if (altRouteMap) {
                    altRouteMap.invalidateSize();
                }
            }, 100);
            
            // Clear previous route
            if (altRouteMap) {
                altRouteMap.eachLayer((layer) => {
                    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                        altRouteMap.removeLayer(layer);
                    }
                });
            }
            
            // Parse GPX (reuse existing parsing logic)
            const text = route.gpxData;
            let latlngs = [];
            let elevations = [];
            
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "text/xml");
                const parserError = xml.querySelector('parsererror');
                if (parserError) throw new Error("XML Parse Error");
                
                let points = [];
                const tags = ['trkpt', 'rtept', 'wpt'];
                for (const tag of tags) {
                    const elements = xml.getElementsByTagName(tag);
                    if (elements.length > 0) {
                        points = Array.from(elements);
                        break;
                    }
                }
                
                points.forEach((pt) => {
                    const lat = parseFloat(pt.getAttribute('lat'));
                    const lon = parseFloat(pt.getAttribute('lon'));
                    if (!isNaN(lat) && !isNaN(lon)) {
                        latlngs.push([lat, lon]);
                        const eleNode = pt.getElementsByTagName('ele')[0];
                        if (eleNode) {
                            const ele = parseFloat(eleNode.textContent);
                            elevations.push(isNaN(ele) ? null : ele);
                        } else {
                            elevations.push(null);
                        }
                    }
                });
            } catch (domErr) {
                // Regex fallback
                const pointRegex = /<(?:trkpt|rtept|wpt)\s+lat="([-0-9.]+)"\s+lon="([-0-9.]+)"[^>]*>[\s\S]*?(?:<ele>([-0-9.]+)<\/ele>)?[\s\S]*?<\/(?:trkpt|rtept|wpt)>/g;
                let match;
                while ((match = pointRegex.exec(text)) !== null) {
                    const lat = parseFloat(match[1]);
                    const lon = parseFloat(match[2]);
                    const ele = match[3] ? parseFloat(match[3]) : null;
                    if (!isNaN(lat) && !isNaN(lon)) {
                        latlngs.push([lat, lon]);
                        elevations.push(ele);
                    }
                }
            }
            
            if (latlngs.length < 2) {
                alert('Kunne ikke finde koordinater i filen.');
                return;
            }
            
            // Draw route
            const polyline = L.polyline(latlngs, {
                color: '#FF4F40',
                weight: 6,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(altRouteMap);
            
            // Add waypoints
            const waypointMarkers = [];
            const waypointInterval = Math.max(1, Math.floor(latlngs.length / 20));
            latlngs.forEach((point, idx) => {
                if (idx === 0 || idx === latlngs.length - 1 || idx % waypointInterval === 0) {
                    const marker = L.marker(point, {
                        icon: L.divIcon({
                            className: 'waypoint-marker',
                            html: `<div style="background:#FF4F40;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(altRouteMap);
                    waypointMarkers.push(marker);
                }
            });
            
            // Zoom to bounds
            try {
                const bounds = polyline.getBounds();
                altRouteMap.fitBounds(bounds, {padding: [50, 50]});
            } catch(e) {
                if (latlngs.length > 0) {
                    altRouteMap.setView(latlngs[0], 13);
                }
            }
            
            // Store for download
            currentAltRouteData = {
                gpxData: text,
                elevations: elevations,
                latlngs: latlngs
            };
            
            // Render elevation profile and stats
            if (elevations.filter(e => e !== null).length > 0) {
                renderAltElevationProfile(elevations, latlngs);
            }
            
            // Invalidate map size after everything is rendered
            setTimeout(() => { 
                if(altRouteMap) {
                    altRouteMap.invalidateSize();
                    // Fit bounds again after size is correct
                    try {
                        const bounds = polyline.getBounds();
                        altRouteMap.fitBounds(bounds, {padding: [50, 50]});
                    } catch(e) {
                        console.warn('Could not fit bounds:', e);
                    }
                }
            }, 300);
        }
        
        // Render elevation profile for alternative routes
        function renderAltElevationProfile(elevations, latlngs) {
            // Calculate stats (reuse existing function)
            const stats = calculateElevationStats(elevations, latlngs);
            
            if (!stats) {
                console.warn('No elevation stats calculated - insufficient elevation data');
                return;
            }
            
            // Show stats
            const statsContainer = document.getElementById('alt-route-elevation-stats');
            if (statsContainer) {
                statsContainer.style.display = 'flex';
                statsContainer.style.flexDirection = 'row';
                statsContainer.innerHTML = `
                    <div style="flex: 1; min-width: 150px; text-align: center;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Stigning</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">${stats.totalAscent}m</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Fald</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.totalDescent}m</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Gns. Gradient</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.avgGradient}%</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; text-align: center;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Distance</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.totalDistance}km</div>
                    </div>
                `;
            }
            
            // Render profile - need to create a custom version since renderElevationProfile expects different params
            const profileContainer = document.getElementById('alt-elevation-profile-container');
            const profileSection = document.getElementById('alt-route-elevation-profile');
            if (profileContainer && profileSection) {
                profileSection.style.display = 'block';
                
                // Custom render for alt routes (similar to main renderElevationProfile)
                const validElevs = elevations.filter(e => e !== null);
                if (validElevs.length < 2) {
                    profileContainer.innerHTML = '<p class="text-secondary">Ingen højdedata tilgængelig</p>';
                    return;
                }
                
                const minElev = Math.min(...validElevs);
                const maxElev = Math.max(...validElevs);
                const elevRange = maxElev - minElev || 1;
                
                // Sample elevations
                const sampleRate = Math.max(1, Math.floor(validElevs.length / 200));
                const sampledElevs = [];
                for (let i = 0; i < validElevs.length; i += sampleRate) {
                    sampledElevs.push(validElevs[i]);
                }
                if (sampledElevs[sampledElevs.length - 1] !== validElevs[validElevs.length - 1]) {
                    sampledElevs.push(validElevs[validElevs.length - 1]);
                }
                
                // Create SVG
                const width = 800;
                const height = 150;
                const padding = 40;
                const chartWidth = width - (padding * 2);
                const chartHeight = height - (padding * 2);
                
                let pathData = '';
                sampledElevs.forEach((elev, idx) => {
                    const x = padding + (idx / (sampledElevs.length - 1)) * chartWidth;
                    const y = padding + chartHeight - ((elev - minElev) / elevRange) * chartHeight;
                    pathData += (idx === 0 ? 'M' : 'L') + ` ${x} ${y}`;
                });
                
                profileContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Min: ${Math.round(minElev)}m | Max: ${Math.round(maxElev)}m</div>
                    </div>
                    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 100%;">
                        <defs>
                            <linearGradient id="altGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:rgba(255, 79, 64, 0.3);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:rgba(255, 79, 64, 0.1);stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <path d="${pathData} L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z" 
                              fill="url(#altGradient)" 
                              stroke="var(--accent)" 
                              stroke-width="2"/>
                        <path d="${pathData}" 
                              fill="none" 
                              stroke="var(--accent)" 
                              stroke-width="2" 
                              stroke-linecap="round" 
                              stroke-linejoin="round"/>
                    </svg>
                `;
            }
        }
        
        // Close viewer
        if (altViewerClose) {
            altViewerClose.addEventListener('click', () => {
                if (altViewer) altViewer.style.display = 'none';
            });
        }
        
        // Download button
        if (altDownloadBtn && altDownloadBtn.querySelector('button')) {
            altDownloadBtn.querySelector('button').addEventListener('click', () => {
                if (currentAltRouteData && currentAltRouteData.gpxData) {
                    const blob = new Blob([currentAltRouteData.gpxData], { type: 'application/gpx+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = altViewerTitle ? altViewerTitle.textContent + '.gpx' : 'route.gpx';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        }
        
        // Function to render alternative routes list
        function renderAlternativeRoutes() {
            if (!altList) return;
            
            if (alternativeRoutes.length === 0) {
                altList.innerHTML = '<p class="text-secondary" style="font-style: italic;">Ingen ruter uploadet endnu.</p>';
                return;
            }
            
            altList.innerHTML = '';
            alternativeRoutes.forEach((route, index) => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style.padding = '0.5rem 1rem';
                div.style.marginBottom = '0.5rem';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.innerHTML = `
                    <div>
                        <strong>${route.name}</strong>
                        <span style="font-size:0.8rem; color: #888; display:block;">${(route.size / 1024).toFixed(1)} KB • ${new Date(route.timestamp).toLocaleDateString('da-DK')}</span>
                    </div>
                    <button class="btn btn-outline alt-view-btn" data-index="${index}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;"><i class="fas fa-eye"></i> Vis</button>
                `;
                altList.appendChild(div);
            });
            
            // Add click handlers to all "Vis" buttons
            altList.querySelectorAll('.alt-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('.alt-view-btn').dataset.index);
                    const route = alternativeRoutes[index];
                    if (route) {
                        renderAltRoute(route);
                        // Scroll to viewer
                        if (altViewer) {
                            altViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        }
        
        // Load and render routes on page load
        renderAlternativeRoutes();
        
        if (altInput && altList) {
            function handleFile(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const gpxData = e.target.result;
                    const route = {
                        id: Date.now().toString(),
                        name: file.name,
                        size: file.size,
                        gpxData: gpxData,
                        timestamp: Date.now()
                    };
                    
                    alternativeRoutes.push(route);
                    localStorage.setItem('alps_alternative_routes', JSON.stringify(alternativeRoutes));
                    renderAlternativeRoutes();
                };
                reader.readAsText(file);
            }

            altInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    handleFile(e.target.files[0]);
                    e.target.value = ''; // Reset input to allow re-uploading same file
                }
            });

            if (altDropZone) {
                altDropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    altDropZone.style.borderColor = 'var(--accent)';
                });
                altDropZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    altDropZone.style.borderColor = 'var(--border)';
                });
                altDropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    altDropZone.style.borderColor = 'var(--border)';
                    if (e.dataTransfer.files[0]) {
                        handleFile(e.dataTransfer.files[0]);
                    }
                });
            }
        }
    }

    applyTranslations();

    // --- Share Button Logic ---
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: 'Alps 2026 Expedition',
                text: (translations.footer && translations.footer.shareMessage) || "Tjek vores Alpe tur plan!",
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled');
                }
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const originalText = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<i class="fas fa-check"></i> Link Kopieret';
                    setTimeout(() => {
                        shareBtn.innerHTML = originalText;
                    }, 2000);
                });
            }
        });
    }

    // --- Print Logic ---
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // --- Stay Finder Logic ---
    const staySelect = document.getElementById('stay-location');
    const stayBtn = document.getElementById('stay-search-btn');
    
    if (staySelect && stayBtn) {
        const locations = {
            alpe: "https://www.booking.com/searchresults.html?ss=Le+Bourg-d%27Oisans&nflt=ht_id%3D204",
            galibier: "https://www.booking.com/searchresults.html?ss=Valloire&nflt=ht_id%3D204",
            croix: "https://www.booking.com/searchresults.html?ss=Saint-Jean-de-Maurienne&nflt=ht_id%3D204"
        };

        staySelect.addEventListener('change', () => {
            stayBtn.href = locations[staySelect.value];
        });
        
        // Init
        stayBtn.href = locations[staySelect.value];
    }

    // --- Packing List Logic ---
    const packingListContainer = document.getElementById('packing-list-container');
    const newPackInput = document.getElementById('new-pack-item');
    const addPackBtn = document.getElementById('add-pack-btn');

    if (packingListContainer) {
        const defaultItems = [
            "Hjelm", "Cykelbriller", "Cykeltrøjer (3)", "Bibshorts (3)", 
            "Vindvest", "Regnjakke", "Handsker (Korte/Lange)", "Cykelstrømper (4)",
            "Cykelsko", "Energibarer/Gels", "Drikkedunke (2)", "Slanger & Pumpe",
            "Multitool", "Pas & Sygesikring", "Opladere (Di2/Garmin)"
        ];

        let savedItems = [];
        let packingSaveTimeout = null;

        // Helper to update sync status
        function updatePackingSyncStatus(status) {
            let statusEl = document.getElementById('packing-sync-status');
            if (!statusEl) {
                const packingSection = document.getElementById('packing');
                if (packingSection) {
                    statusEl = document.createElement('span');
                    statusEl.id = 'packing-sync-status';
                    statusEl.className = 'sync-status';
                    const packingHeader = packingSection.querySelector('h2');
                    if (packingHeader) packingHeader.appendChild(statusEl);
                }
            }
            if (statusEl) {
                statusEl.className = `sync-status ${status}`;
                if (status === 'syncing') statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Synkroniserer...';
                else if (status === 'synced') statusEl.innerHTML = '<i class="fas fa-check"></i> Synkroniseret';
                else if (status === 'error') statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Fejl';
            }
        }

        // Save packing list with debouncing
        async function savePackingList() {
            if (packingSaveTimeout) clearTimeout(packingSaveTimeout);
            packingSaveTimeout = setTimeout(async () => {
                updatePackingSyncStatus('syncing');
                const success = await window.syncManager.savePackingList(savedItems);
                updatePackingSyncStatus(success ? 'synced' : 'error');
                setTimeout(() => {
                    const statusEl = document.getElementById('packing-sync-status');
                    if (statusEl) statusEl.style.opacity = '0.5';
                }, 2000);
            }, 500);
        }

        // Initialize if empty or new (simple check)
        async function initPackingList() {
            savedItems = await window.syncManager.loadPackingList();
            if (!savedItems || savedItems.length === 0) {
                savedItems = defaultItems.map(item => ({ name: item, checked: false }));
                await savePackingList();
            }
            renderChecklist();
        }

        function renderChecklist() {
            packingListContainer.innerHTML = '';
            savedItems.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `checklist-item ${item.checked ? 'checked' : ''}`;
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem; flex-grow: 1;">
                        <div class="checklist-checkbox"></div>
                        <span>${item.name}</span>
                    </div>
                    <button class="delete-pack-item" data-index="${index}" style="background: none; border: none; color: #555; cursor: pointer; padding: 0.5rem;"><i class="fas fa-times"></i></button>
                `;
                
                // Toggle check
                div.querySelector('div').addEventListener('click', async () => {
                    item.checked = !item.checked;
                    await savePackingList();
                    renderChecklist();
                });

                // Delete item
                div.querySelector('.delete-pack-item').addEventListener('click', async (e) => {
                    e.stopPropagation(); // prevent toggle
                    savedItems.splice(index, 1);
                    await savePackingList();
                    renderChecklist();
                });

                packingListContainer.appendChild(div);
            });
        }

        async function addItem() {
            const val = newPackInput.value.trim();
            if (val) {
                savedItems.push({ name: val, checked: false });
                await savePackingList();
                renderChecklist();
                newPackInput.value = '';
            }
        }

        if (addPackBtn) addPackBtn.addEventListener('click', addItem);
        if (newPackInput) {
            newPackInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addItem();
            });
        }

        initPackingList();
    }

    // --- Smooth Scroll & Animations ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // --- Map Initialization (Leaflet) ---
    // Removed old main map initialization as it is now Google Maps Embed in HTML
    
    // --- Core Calculation Logic ---
    function calculateTime(distanceKm, gradient, ftp, weight, bikeWeight = 8) {
        if (!ftp || !weight || ftp <= 0 || weight <= 0) return null;
        
        const totalMass = weight + bikeWeight;
        const g = 9.81;
        const efficiency = 0.92;
        const gravityForce = totalMass * g * gradient;
        const velocity = (ftp * efficiency) / gravityForce;
        const distanceMeters = distanceKm * 1000;
        const timeSeconds = distanceMeters / velocity;
        
        return timeSeconds;
    }

    function formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return "--:--";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}t ${m}m ${s}s`; // Danish Time Format
        return `${m}m ${s}s`;
    }

    // --- Interactive Calculator (Global Inputs) ---
    const userFtpInput = document.getElementById('user-ftp');
    const userWeightInput = document.getElementById('user-weight');
    const routeCards = document.querySelectorAll('.card[data-dist]'); 

    function updatePredictions() {
        const ftp = parseFloat(userFtpInput.value);
        const weight = parseFloat(userWeightInput.value);

        routeCards.forEach(card => {
            const dist = parseFloat(card.dataset.dist);
            const grad = parseFloat(card.dataset.grad);
            const timeDisplay = card.querySelector('.prediction-value');

            if (ftp && weight) {
                const seconds = calculateTime(dist, grad, ftp, weight);
                timeDisplay.textContent = formatTime(seconds);
                timeDisplay.style.color = 'var(--text-primary)';
            } else {
                timeDisplay.textContent = "--:--";
            }
        });
    }

    userFtpInput.addEventListener('input', updatePredictions);
    userWeightInput.addEventListener('input', updatePredictions);

    // --- Forecast / Leaderboard Logic ---
    const riderName = document.getElementById('rider-name');
    const riderFtp = document.getElementById('rider-ftp');
    const riderWeight = document.getElementById('rider-weight');
    const addRiderBtn = document.getElementById('add-rider-btn');
    const leaderboardBody = document.querySelector('#leaderboard-table tbody');
    
    let riders = [];
    let ridersSaveTimeout = null;

    // Helper to update sync status
    function updateRidersSyncStatus(status) {
        let statusEl = document.getElementById('riders-sync-status');
        if (!statusEl) {
            const forecastSection = document.getElementById('forecast');
            if (forecastSection) {
                statusEl = document.createElement('span');
                statusEl.id = 'riders-sync-status';
                statusEl.className = 'sync-status';
                const forecastHeader = forecastSection.querySelector('h2');
                if (forecastHeader) forecastHeader.appendChild(statusEl);
            }
        }
        if (statusEl) {
            statusEl.className = `sync-status ${status}`;
            if (status === 'syncing') statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Synkroniserer...';
            else if (status === 'synced') statusEl.innerHTML = '<i class="fas fa-check"></i> Synkroniseret';
            else if (status === 'error') statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Fejl';
        }
    }

    // Save riders with debouncing
    async function saveRiders() {
        if (ridersSaveTimeout) clearTimeout(ridersSaveTimeout);
        ridersSaveTimeout = setTimeout(async () => {
            updateRidersSyncStatus('syncing');
            const success = await window.syncManager.saveRiders(riders);
            updateRidersSyncStatus(success ? 'synced' : 'error');
            setTimeout(() => {
                const statusEl = document.getElementById('riders-sync-status');
                if (statusEl) statusEl.style.opacity = '0.5';
            }, 2000);
        }, 500);
    }

    // Load riders on init
    (async () => {
        riders = await window.syncManager.loadRiders();
        renderLeaderboard();
    })();

    function renderLeaderboard() {
        leaderboardBody.innerHTML = '';
        riders.sort((a, b) => a.totalTime - b.totalTime);

        riders.forEach((rider, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 600;">${rider.name}</td>
                <td>${rider.wkg.toFixed(2)}</td>
                <td>${formatTime(rider.splits[0])}</td>
                <td>${formatTime(rider.splits[1])}</td>
                <td>${formatTime(rider.splits[2])}</td>
                <td class="text-accent" style="font-weight: 700;">${formatTime(rider.totalTime)}</td>
                <td>#${index + 1}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }

    async function addRider() {
        const name = riderName.value;
        const ftp = parseFloat(riderFtp.value);
        const weight = parseFloat(riderWeight.value);

        if (!name || !ftp || !weight) return;

        const splits = [];
        let totalSeconds = 0;

        routeCards.forEach(card => {
            const dist = parseFloat(card.dataset.dist);
            const grad = parseFloat(card.dataset.grad);
            const time = calculateTime(dist, grad, ftp, weight);
            splits.push(time);
            totalSeconds += time;
        });

        const newRider = {
            name,
            ftp,
            weight,
            wkg: ftp / weight,
            splits: splits,
            totalTime: totalSeconds
        };

        riders.push(newRider);
        await saveRiders();
        renderLeaderboard();
        
        riderName.value = '';
        riderFtp.value = '';
        riderWeight.value = '';
    }

    addRiderBtn.addEventListener('click', addRider);

    // --- Budget Calculator Logic ---
    const expenseItem = document.getElementById('expense-item');
    const expenseCost = document.getElementById('expense-cost');
    const expensePayer = document.getElementById('expense-payer');
    const expenseSplit = document.getElementById('expense-split');
    const totalPeopleInput = document.getElementById('budget-total-people');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const budgetBody = document.querySelector('#budget-table tbody');
    const totalDisplay = document.getElementById('total-cost-display');
    const ppDisplay = document.getElementById('pp-cost-display');
    const budgetSection = document.getElementById('budget');

    let expenses = [];
    let saveTimeout = null;

    // Helper to update sync status
    function updateBudgetSyncStatus(status) {
        let statusEl = document.getElementById('budget-sync-status');
        if (!statusEl && budgetSection) {
            statusEl = document.createElement('span');
            statusEl.id = 'budget-sync-status';
            statusEl.className = 'sync-status';
            const budgetHeader = budgetSection.querySelector('h2');
            if (budgetHeader) budgetHeader.appendChild(statusEl);
        }
        if (statusEl) {
            statusEl.className = `sync-status ${status}`;
            if (status === 'syncing') statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Synkroniserer...';
            else if (status === 'synced') statusEl.innerHTML = '<i class="fas fa-check"></i> Synkroniseret';
            else if (status === 'error') statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Fejl';
        }
    }

    // Helper to get total people (default 8)
    function getTotalPeople() {
        return parseInt(totalPeopleInput.value) || 8;
    }

    // Save budget with debouncing
    async function saveBudget() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            updateBudgetSyncStatus('syncing');
            const success = await window.syncManager.saveBudget(expenses);
            updateBudgetSyncStatus(success ? 'synced' : 'error');
            setTimeout(() => {
                const statusEl = document.getElementById('budget-sync-status');
                if (statusEl) statusEl.style.opacity = '0.5';
            }, 2000);
        }, 500);
    }

    function renderBudget() {
        budgetBody.innerHTML = '';
        let total = 0;
        
        expenses.forEach((exp, index) => {
            total += exp.cost;
            const row = document.createElement('tr');
            
            // Calculate per person for this item
            const splitCount = exp.splitBy || getTotalPeople();
            const ppCost = exp.cost / splitCount;

            row.innerHTML = `
                <td>${exp.item}</td>
                <td>${exp.payer}</td>
                <td>${splitCount} pers</td>
                <td>€${exp.cost.toFixed(2)}</td>
                <td>€${ppCost.toFixed(2)}</td>
                <td><button class="btn-delete" data-index="${index}" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;"><i class="fas fa-trash"></i></button></td>
            `;
            budgetBody.appendChild(row);
        });

        // Add Delete Event Listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(btn.dataset.index);
                expenses.splice(idx, 1);
                await saveBudget();
                renderBudget();
            });
        });

        totalDisplay.textContent = `€${total.toFixed(2)}`;
        // For global PP, we just divide total by global count for a rough estimate, 
        // or we could sum up individual shares if we tracked "who pays what".
        // For simplicity:
        const globalPP = total / getTotalPeople();
        ppDisplay.textContent = `Gns. €${globalPP.toFixed(2)} / person`;
    }

    async function addExpense() {
        const item = expenseItem.value;
        const cost = parseFloat(expenseCost.value);
        const payer = expensePayer.value;
        const splitBy = parseInt(expenseSplit.value) || getTotalPeople();

        if (!item || !cost) return;

        expenses.push({ item, cost, payer, splitBy });
        await saveBudget();
        renderBudget();

        expenseItem.value = '';
        expenseCost.value = '';
        expensePayer.value = '';
        expenseSplit.value = getTotalPeople(); // Reset to default
    }

    addExpenseBtn.addEventListener('click', addExpense);
    totalPeopleInput.addEventListener('change', () => {
        // Update default split value and re-render (if global count affects defaults logic)
        expenseSplit.value = getTotalPeople();
        renderBudget();
    });
    
    // Load budget on init
    (async () => {
        expenses = await window.syncManager.loadBudget();
        expenseSplit.value = getTotalPeople();
        renderBudget();
    })();

    // --- Route Viewer Logic (Leaflet + GPX) ---
    const routeTabs = document.querySelectorAll('.route-tab');
    const viewerUpload = document.getElementById('viewer-upload');
    const viewerStatus = document.getElementById('viewer-status');
    const mapDiv = document.getElementById('route-map');
    
    console.log('Route tabs found:', routeTabs.length);
    console.log('Viewer upload found:', !!viewerUpload);
    console.log('Map div found:', !!mapDiv);
    
    // Tab Switching Logic (UI Only)
    function setActiveTabUI(routeKey) {
        console.log('setActiveTabUI called with:', routeKey);
        if (!routeTabs || routeTabs.length === 0) {
            console.error('routeTabs is empty!');
            return;
        }
        routeTabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.route-tab[data-route="${routeKey}"]`);
        if(activeTab) {
            activeTab.classList.add('active');
            console.log('Active tab set:', routeKey);
        } else {
            console.warn('Active tab not found for:', routeKey);
        }
    }

    // Map State
    let routeMap = null;
    let routeLayers = { 
        alpe: null, 
        croix: null, 
        galibier: null 
    }; // Each will be { polyline: L.polyline, waypoints: [L.marker...], gpxData: string } or null
    let currentRoute = 'alpe';

    // Try Initialize Map
    if (mapDiv) {
        try {
            if (typeof L === 'undefined') {
                throw new Error("Leaflet bibliotek ikke fundet. Tjek at leaflet.js er indlæst.");
            }

            // Force height
            if (mapDiv.clientHeight === 0) mapDiv.style.height = '500px';

            routeMap = L.map('route-map').setView([45.092, 6.068], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(routeMap);

        } catch (err) {
            console.error("Map Init Error:", err);
            mapDiv.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:red;text-align:center;padding:2rem;">
                <div>
                    <h3>Kortet kunne ikke indlæses</h3>
                    <p>${err.message}</p>
                    <p style="font-size:0.8rem; margin-top:1rem;">Prøv at genindlæse siden (F5)</p>
                </div>
            </div>`;
            routeMap = null; // Ensure null
        }
    }

    // Function to Switch Route (Logic)
    async function switchRouteTab(routeKey) {
        console.log('switchRouteTab called with:', routeKey);
        currentRoute = routeKey;
        setActiveTabUI(routeKey);

        if (!routeMap) {
            console.log('Map not available, UI updated only');
            return; // Exit if map broken
        }

        // Clear Layers
        Object.values(routeLayers).forEach(layer => {
            if (layer) {
                if (layer.polyline) routeMap.removeLayer(layer.polyline);
                if (layer.waypoints) {
                    layer.waypoints.forEach(marker => routeMap.removeLayer(marker));
                }
            }
        });

        // Try to load from Firebase if not in memory
        if (!routeLayers[routeKey] && window.syncManager && window.syncManager.isFirebaseAvailable && window.syncManager.isAuthenticated) {
            const gpxData = await window.syncManager.loadGPX(routeKey);
            if (gpxData && gpxData.gpxData) {
                // Create a File-like object from stored data
                const blob = new Blob([gpxData.gpxData], { type: 'application/gpx+xml' });
                const file = new File([blob], gpxData.metadata?.fileName || `${routeKey}.gpx`, { type: 'application/gpx+xml' });
                // Render the GPX
                if (window.parseGpxAndRender) {
                    window.parseGpxAndRender(file);
                }
            }
        }

        // Show current
        const overlay = document.getElementById('route-controls');
        const downloadBtn = document.getElementById('download-gpx-btn');
        
        if (routeLayers[routeKey] && routeLayers[routeKey].polyline) {
            routeLayers[routeKey].polyline.addTo(routeMap);
            if (routeLayers[routeKey].waypoints) {
                routeLayers[routeKey].waypoints.forEach(marker => marker.addTo(routeMap));
            }
            try {
                const bounds = routeLayers[routeKey].polyline.getBounds();
                if(bounds.isValid()) routeMap.fitBounds(bounds, { padding: [50, 50] });
            } catch(e) { console.warn(e); }
            
            if(overlay) overlay.style.display = 'none';
            if(downloadBtn) downloadBtn.style.display = 'block';
            if(viewerStatus) viewerStatus.textContent = "";
        } else {
            // Show overlay
            if(overlay) overlay.style.display = 'flex';
            if(downloadBtn) downloadBtn.style.display = 'none';
            
            // Hide elevation stats/profile if no route
            const profileContainer = document.getElementById('route-elevation-profile');
            if(profileContainer) profileContainer.style.display = 'none';
            const statsContainer = document.getElementById('route-elevation-stats');
            if(statsContainer) statsContainer.style.display = 'none';
        }
        
        // Show elevation stats/profile if route exists
        if (routeLayers[routeKey] && routeLayers[routeKey].elevations) {
            const profileContainer = document.getElementById('route-elevation-profile');
            if(profileContainer) profileContainer.style.display = 'block';
            const statsContainer = document.getElementById('route-elevation-stats');
            if(statsContainer) statsContainer.style.display = 'flex';
        }
        
        setTimeout(() => { routeMap.invalidateSize(); }, 100);
    }

    // Attach Listeners (Safely)
    if (routeTabs && routeTabs.length > 0) {
        // Convert NodeList to Array to avoid stale references
        Array.from(routeTabs).forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const routeKey = tab.dataset.route;
                if(routeKey) {
                    console.log('Tab clicked:', routeKey);
                    switchRouteTab(routeKey);
                } else {
                    console.warn('Tab missing data-route:', tab);
                }
            });
        });
        console.log('Tab listeners attached:', routeTabs.length);
    } else {
        console.error('No route tabs found!');
        if(mapDiv) {
            mapDiv.innerHTML = '<div style="padding:2rem;color:red;">FEJL: Ingen tabs fundet!</div>';
        }
    }

    // GPX Parsing (Global scope for access)
    window.parseGpxAndRender = function(file) {
            if(!file) return;
            
            if(viewerStatus) {
                viewerStatus.textContent = "Indlæser...";
                viewerStatus.style.color = "var(--text-secondary)";
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                let latlngs = [];
                let elevations = []; // Store elevation data

                // Method 1: DOMParser (Standard)
                try {
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, "text/xml");
                    
                    const parserError = xml.querySelector('parsererror');
                    if (parserError) throw new Error("XML Parse Error");

                    let points = [];
                    const tags = ['trkpt', 'rtept', 'wpt'];
                    for (const tag of tags) {
                        const elements = xml.getElementsByTagName(tag);
                        if (elements.length > 0) {
                            points = Array.from(elements);
                            break;
                        }
                    }

                    points.forEach((pt, idx) => {
                        const lat = parseFloat(pt.getAttribute('lat'));
                        const lon = parseFloat(pt.getAttribute('lon'));
                        if (!isNaN(lat) && !isNaN(lon)) {
                            latlngs.push([lat, lon]);
                            
                            // Extract elevation if available
                            const eleNode = pt.getElementsByTagName('ele')[0];
                            if (eleNode) {
                                const ele = parseFloat(eleNode.textContent);
                                elevations.push(isNaN(ele) ? null : ele);
                            } else {
                                elevations.push(null);
                            }
                        }
                    });
                    
                    console.log('DOMParser found', latlngs.length, 'track points');
                    console.log('Elevation data points:', elevations.filter(e => e !== null).length);

                } catch (domErr) {
                    console.warn("GPX DOM parsing failed, switching to Regex fallback", domErr);
                }

                // Method 2: Regex Fallback (Robustness)
                if (latlngs.length === 0) {
                    // Look for trkpt/rtept/wpt with lat/lon and optionally ele
                    const pointRegex = /<(?:trkpt|rtept|wpt)\s+lat="([-0-9.]+)"\s+lon="([-0-9.]+)"[^>]*>[\s\S]*?(?:<ele>([-0-9.]+)<\/ele>)?[\s\S]*?<\/(?:trkpt|rtept|wpt)>/g;
                    let match;
                    while ((match = pointRegex.exec(text)) !== null) {
                        const lat = parseFloat(match[1]);
                        const lon = parseFloat(match[2]);
                        const ele = match[3] ? parseFloat(match[3]) : null;
                        
                        if (!isNaN(lat) && !isNaN(lon)) {
                            latlngs.push([lat, lon]);
                            elevations.push(ele);
                        }
                    }
                    console.log('Regex fallback found', latlngs.length, 'points');
                }

                console.log('GPX parsed, coordinates found:', latlngs.length);
                
                if (latlngs.length < 2) {
                    if(viewerStatus) {
                        viewerStatus.textContent = "Kunne ikke finde koordinater i filen.";
                        viewerStatus.style.color = "#FF4F40";
                    }
                    console.error("No coordinates found in GPX");
                    return;
                }

                try {
                    if (!routeMap || typeof L === 'undefined') {
                        if(viewerStatus) {
                            viewerStatus.textContent = "Kortet er ikke tilgængeligt. Aktivér Leaflet for at se ruten.";
                            viewerStatus.style.color = "#FF4F40";
                        }
                        console.warn('Map not available for GPX rendering');
                        return;
                    }

                    console.log('Rendering route with', latlngs.length, 'points');
                    console.log('First point:', latlngs[0]);
                    console.log('Last point:', latlngs[latlngs.length - 1]);

                    // Hide overlay when route is loaded (replace button is always visible)
                    const overlay = document.getElementById('route-controls');
                    if(overlay) overlay.style.display = 'none';
                    
                    // Update replace button text
                    const uploadBtnText = document.getElementById('upload-btn-text');
                    if(uploadBtnText) uploadBtnText.textContent = 'Erstat Rute';

                    // Clear previous route and waypoints
                    if (routeLayers[currentRoute]) {
                        if (routeLayers[currentRoute].polyline) {
                            routeMap.removeLayer(routeLayers[currentRoute].polyline);
                        }
                        if (routeLayers[currentRoute].waypoints) {
                            routeLayers[currentRoute].waypoints.forEach(marker => {
                                routeMap.removeLayer(marker);
                            });
                        }
                    }

                    // Draw route - Make it more visible
                    const polyline = L.polyline(latlngs, {
                        color: '#FF4F40', 
                        weight: 6, 
                        opacity: 0.9,
                        lineJoin: 'round',
                        lineCap: 'round'
                    });
                    polyline.addTo(routeMap);
                    
                    // Add waypoint markers (every Nth point, or key points)
                    const waypointMarkers = [];
                    const waypointInterval = Math.max(1, Math.floor(latlngs.length / 20)); // Show ~20 waypoints max
                    
                    latlngs.forEach((point, idx) => {
                        // Show first, last, and every Nth point
                        if (idx === 0 || idx === latlngs.length - 1 || idx % waypointInterval === 0) {
                            const marker = L.marker(point, {
                                icon: L.divIcon({
                                    className: 'waypoint-marker',
                                    html: `<div style="background:#FF4F40;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${idx + 1}</div>`,
                                    iconSize: [24, 24],
                                    iconAnchor: [12, 12]
                                })
                            });
                            marker.addTo(routeMap);
                            waypointMarkers.push(marker);
                        }
                    });
                    
                    // Store both polyline, waypoints, and GPX data for download
                    routeLayers[currentRoute] = {
                        polyline: polyline,
                        waypoints: waypointMarkers,
                        gpxData: text, // Store original GPX content for download
                        elevations: elevations,
                        latlngs: latlngs
                    };
                    
                    // Save to Firebase
                    if (window.syncManager && window.syncManager.isFirebaseAvailable && window.syncManager.isAuthenticated) {
                        window.syncManager.uploadGPX(currentRoute, text, {
                            fileName: file.name,
                            pointCount: latlngs.length,
                            uploadedAt: new Date().toISOString()
                        }).catch(err => console.warn('Failed to save GPX to Firebase:', err));
                    }
                    
                    console.log('Polyline added to map with', waypointMarkers.length, 'waypoints');
                    
                    // Zoom to bounds
                    try {
                        const bounds = polyline.getBounds();
                        console.log('Route bounds:', bounds);
                        routeMap.fitBounds(bounds, {padding: [50, 50]});
                        console.log('Map zoomed to route');
                    } catch(boundsErr) {
                        console.error('Bounds error:', boundsErr);
                        // Fallback: zoom to first point
                        if (latlngs.length > 0) {
                            routeMap.setView(latlngs[0], 13);
                        }
                    }
                    
                    if(viewerStatus) {
                        viewerStatus.textContent = `Vises: ${file.name} (${latlngs.length} punkter)`;
                        viewerStatus.style.color = "var(--text-secondary)";
                    }
                    
                    // Show download button
                    const downloadBtn = document.getElementById('download-gpx-btn');
                    if(downloadBtn) downloadBtn.style.display = 'block';
                    
                    // Calculate and display elevation statistics
                    if (elevations.length > 0 && elevations.some(e => e !== null)) {
                        const elevStats = calculateElevationStats(elevations, latlngs);
                        renderElevationProfile(elevations, latlngs.length, elevStats);
                        displayElevationStats(elevStats);
                    }
                    
                    setTimeout(() => { 
                        routeMap.invalidateSize(); 
                        console.log('Map size invalidated');
                    }, 100);

                } catch (renderErr) {
                    console.error("Rendering Error:", renderErr);
                    if(viewerStatus) {
                        viewerStatus.textContent = "Fejl ved visning af kort.";
                        viewerStatus.style.color = "#FF4F40";
                    }
                }
            };
            
            reader.onerror = function() {
                if(viewerStatus) {
                    viewerStatus.textContent = "Kunne ikke læse filen.";
                    viewerStatus.style.color = "#FF4F40";
                }
            };

            reader.readAsText(file);
        }

        // Main upload handler
        if(viewerUpload) {
            const newUpload = viewerUpload.cloneNode(true);
            viewerUpload.parentNode.replaceChild(newUpload, viewerUpload);
            
            newUpload.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    parseGpxAndRender(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }
        
        // Replace route handler (always visible button)
        const replaceUpload = document.getElementById('viewer-upload-replace');
        if(replaceUpload) {
            replaceUpload.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    // Clear current route first
                    if (routeLayers[currentRoute]) {
                        if (routeLayers[currentRoute].polyline) {
                            routeMap.removeLayer(routeLayers[currentRoute].polyline);
                        }
                        if (routeLayers[currentRoute].waypoints) {
                            routeLayers[currentRoute].waypoints.forEach(marker => {
                                routeMap.removeLayer(marker);
                            });
                        }
                        routeLayers[currentRoute] = null;
                    }
                    // Remove elevation profile and stats
                    const profileContainer = document.getElementById('route-elevation-profile');
                    if(profileContainer) profileContainer.remove();
                    const statsContainer = document.getElementById('route-elevation-stats');
                    if(statsContainer) statsContainer.remove();
                    
                    parseGpxAndRender(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }
        
        // Download GPX handler
        const downloadBtn = document.getElementById('download-gpx-btn');
        if(downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const currentLayer = routeLayers[currentRoute];
                if (currentLayer && currentLayer.gpxData) {
                    const blob = new Blob([currentLayer.gpxData], { type: 'application/gpx+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `route-${currentRoute}-${Date.now()}.gpx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    alert('Ingen GPX fil at downloade. Upload en fil først.');
                }
            });
        }

        // Handle Card Uploads (Connect to Map)
        const gpxCardInputs = document.querySelectorAll('.gpx-upload');
        gpxCardInputs.forEach(input => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            newInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const mountain = newInput.dataset.mountain;
                    
                    // Visual feedback on card
                    const statusDiv = newInput.parentElement.querySelector('.gpx-status');
                    if(statusDiv) statusDiv.innerHTML = `<i class="fas fa-check"></i> ${file.name}`;

                    // Switch tab and render
                    if (mountain) {
                        switchRouteTab(mountain);
                        // Scroll to map if needed (optional)
                    }
                    
                    parseGpxAndRender(file);
                    e.target.value = '';
                }
            });
        });

        // Init
        setTimeout(() => { if(routeMap) routeMap.invalidateSize(); }, 500); 

    // Calculate Elevation Statistics
    function calculateElevationStats(elevations, latlngs) {
        const validElevs = elevations.filter(e => e !== null);
        if (validElevs.length < 2) return null;
        
        let totalAscent = 0;
        let totalDescent = 0;
        let prevElev = validElevs[0];
        
        for (let i = 1; i < validElevs.length; i++) {
            const currElev = validElevs[i];
            const diff = currElev - prevElev;
            if (diff > 0) {
                totalAscent += diff;
            } else {
                totalDescent += Math.abs(diff);
            }
            prevElev = currElev;
        }
        
        // Calculate total distance using Haversine formula
        let totalDistance = 0;
        for (let i = 1; i < latlngs.length; i++) {
            const [lat1, lon1] = latlngs[i-1];
            const [lat2, lon2] = latlngs[i];
            const R = 6371; // Earth radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            totalDistance += R * c;
        }
        
        // Average gradient (ascent / distance * 100)
        const avgGradient = totalDistance > 0 ? (totalAscent / (totalDistance * 1000)) * 100 : 0;
        
        return {
            min: Math.min(...validElevs),
            max: Math.max(...validElevs),
            totalAscent: Math.round(totalAscent),
            totalDescent: Math.round(totalDescent),
            avgGradient: avgGradient.toFixed(1),
            totalDistance: totalDistance.toFixed(1)
        };
    }

    // Display Elevation Statistics
    function displayElevationStats(stats) {
        if (!stats) return;
        
        // Find or create stats container
        let statsContainer = document.getElementById('route-elevation-stats');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'route-elevation-stats';
            statsContainer.style.cssText = 'margin-top: 1rem; padding: 1rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 1rem;';
            
            // Insert before elevation profile
            const profileContainer = document.getElementById('route-elevation-profile');
            const mapCard = document.querySelector('.route-frame-container').closest('.card');
            if (mapCard) {
                const cardPadding = mapCard.querySelector('.card-padding');
                if (profileContainer) {
                    cardPadding.insertBefore(statsContainer, profileContainer);
                } else {
                    cardPadding.appendChild(statsContainer);
                }
            }
        }
        
        statsContainer.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Stigning</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">${stats.totalAscent}m</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Fald</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.totalDescent}m</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Gns. Gradient</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.avgGradient}%</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.3rem;">Distance</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${stats.totalDistance}km</div>
            </div>
        `;
    }

    // Elevation Profile Renderer
    function renderElevationProfile(elevations, totalPoints, stats) {
        // Filter out null values and get valid elevations
        const validElevs = elevations.filter(e => e !== null);
        if (validElevs.length < 2) return;
        
        const minElev = Math.min(...validElevs);
        const maxElev = Math.max(...validElevs);
        const elevRange = maxElev - minElev || 1; // Avoid division by zero
        
        // Sample elevations for display (every Nth point to keep it smooth)
        const sampleRate = Math.max(1, Math.floor(validElevs.length / 200)); // Max 200 points
        const sampledElevs = [];
        for (let i = 0; i < validElevs.length; i += sampleRate) {
            sampledElevs.push(validElevs[i]);
        }
        if (sampledElevs[sampledElevs.length - 1] !== validElevs[validElevs.length - 1]) {
            sampledElevs.push(validElevs[validElevs.length - 1]); // Always include last
        }
        
        // Find or create elevation profile container
        let profileContainer = document.getElementById('route-elevation-profile');
        if (!profileContainer) {
            profileContainer = document.createElement('div');
            profileContainer.id = 'route-elevation-profile';
            profileContainer.style.cssText = 'margin-top: 1rem; padding: 1rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border);';
            
            // Insert after the map container
            const mapCard = document.querySelector('.route-frame-container').closest('.card');
            if (mapCard) {
                mapCard.querySelector('.card-padding').appendChild(profileContainer);
            }
        }
        
        // Create SVG
        const width = 800;
        const height = 150;
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        let pathData = '';
        sampledElevs.forEach((elev, idx) => {
            const x = padding + (idx / (sampledElevs.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((elev - minElev) / elevRange) * chartHeight;
            pathData += (idx === 0 ? 'M' : 'L') + ` ${x} ${y}`;
        });
        
        profileContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; font-size: 1rem;">Højdeprofil</h4>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">
                    Min: ${Math.round(minElev)}m | Max: ${Math.round(maxElev)}m
                </span>
            </div>
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">
                <defs>
                    <linearGradient id="elevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:rgba(255, 79, 64, 0.3);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgba(255, 79, 64, 0.1);stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z" 
                      fill="url(#elevGrad)" stroke="none"/>
                <path d="${pathData}" 
                      fill="none" 
                      stroke="#FF4F40" 
                      stroke-width="3" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"/>
                <!-- Y-axis labels -->
                <text x="${padding - 10}" y="${padding}" text-anchor="end" fill="var(--text-secondary)" font-size="10">${Math.round(maxElev)}m</text>
                <text x="${padding - 10}" y="${height - padding + 5}" text-anchor="end" fill="var(--text-secondary)" font-size="10">${Math.round(minElev)}m</text>
            </svg>
        `;
    }

}); // End DOMContentLoaded

