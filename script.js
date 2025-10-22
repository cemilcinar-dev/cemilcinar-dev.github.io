// FIXED: Changed 'http' to 'https' to resolve the Mixed Content error.
const SURAHS_API_URL = 'https://api.alquran.cloud/v1/meta/surah';
const SURAH_DETAIL_URL = (id) => `https://api.alquran.cloud/v1/surah/${id}/editions/quran-simple,en.transliteration,en.sahih`;

document.addEventListener('DOMContentLoaded', () => {
    // Hide the Welcome & Information link, which is a placeholder
    const welcomeLink = document.getElementById('nav-info-tab');
    if (welcomeLink) {
        welcomeLink.remove();
    }
    
    fetch(SURAHS_API_URL)
        .then(response => {
            if (!response.ok) {
                // If the fetch fails for a non-security reason
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Filter Surahs: less than 10 Ayahs (and excluding Al-Fatiha, which is often handled separately)
            const shortSurahs = data.data.surahs.references.filter(s => s.ayahs < 10 && s.number > 1); 
            
            const surahListContainer = document.getElementById('surahList');
            
            // Clear any old content (though it should be empty now)
            surahListContainer.innerHTML = ''; 

            shortSurahs.forEach(surah => {
                const link = document.createElement('a');
                link.className = 'list-group-item list-group-item-action surah-link';
                link.setAttribute('data-surah-id', surah.number);
                link.innerHTML = `<strong>${surah.number}. ${surah.englishName}</strong> (${surah.name}) <small class="text-muted">${surah.ayahs} Ayahs</small>`;
                
                // Add event listener to load content on click
                link.addEventListener('click', () => {
                    // Deactivate all links
                    document.querySelectorAll('.surah-link').forEach(l => l.classList.remove('active'));
                    // Activate the clicked link
                    link.classList.add('active');
                    loadSurahContent(surah.number, surah.englishName, surah.revelationType);
                });
                
                surahListContainer.appendChild(link);
            });
            
            // Automatically load the first short surah on page load
            if (shortSurahs.length > 0) {
                const firstSurah = shortSurahs[0];
                const firstLink = document.querySelector(`[data-surah-id="${firstSurah.number}"]`);
                if (firstLink) {
                    firstLink.classList.add('active');
                    loadSurahContent(firstSurah.number, firstSurah.englishName, firstSurah.revelationType);
                }
            }

        })
        .catch(error => {
            console.error("Error fetching Surah list:", error);
            document.getElementById('surahList').innerHTML = `<div class="p-3 text-danger">Error loading Surahs. Check console for details.</div>`;
        });
});


function loadSurahContent(surahId, englishName, revelationType) {
    
    // Update static details immediately
    document.getElementById('surahTitle').textContent = `Surah ${surahId}: ${englishName}`;
    document.getElementById('surahDetails').innerHTML = `**Information:** Revealed in **${revelationType}**.`;

    // Show loading text across all tabs
    const loadingMessage = '<div class="text-center text-muted p-5">Loading Ayahs...</div>';
    document.getElementById('arabicContent').innerHTML = loadingMessage;
    document.getElementById('transliterationContent').innerHTML = loadingMessage;
    document.getElementById('translationContent').innerHTML = loadingMessage;
    
    // Ensure the Arabic tab is active while loading
    document.getElementById('tab-arabic').classList.add('active');
    document.getElementById('content-arabic').classList.add('show', 'active');
    document.getElementById('tab-transliteration').classList.remove('active');
    document.getElementById('content-transliteration').classList.remove('show', 'active');
    document.getElementById('tab-translation').classList.remove('active');
    document.getElementById('content-translation').classList.remove('show', 'active');


    // Fetch the content for the selected Surah
    fetch(SURAH_DETAIL_URL(surahId))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            
            // Extract the three required editions from the array
            const arabic = data.data.find(e => e.edition.name === 'quran-simple');
            const transliteration = data.data.find(e => e.edition.name === 'en.transliteration');
            const translation = data.data.find(e => e.edition.name === 'en.sahih');

            let arabicHTML = '';
            let transliterationHTML = '';
            let translationHTML = '';
            
            // Loop through the Ayahs and format the output
            arabic.ayahs.forEach((ayah, index) => {
                const ayahNumber = index + 1;
                // Arabic text with its unique font size and alignment
                arabicHTML += `<p class="fs-4 text-end my-3">${ayah.text} ﴿${ayahNumber}﴾</p>`;
                
                // Transliteration text
                transliterationHTML += `<p class="my-3"><span class="badge bg-secondary me-2">${ayahNumber}</span> ${transliteration.ayahs[index].text}</p>`;
                
                // Translation text
                translationHTML += `<p class="my-3"><span class="badge bg-primary me-2">${ayahNumber}</span> ${translation.ayahs[index].text}</p>`;
            });

            // Update the Tab Content with the loaded data
            document.getElementById('arabicContent').innerHTML = arabicHTML;
            document.getElementById('transliterationContent').innerHTML = transliterationHTML;
            document.getElementById('translationContent').innerHTML = translationHTML;
        })
        .catch(error => {
            console.error(`Error loading content for Surah ${surahId}:`, error);
            const errorMessage = `<div class="p-5 text-danger">Failed to load content for this Surah. Check your internet connection or the browser console for details.</div>`;
            document.getElementById('arabicContent').innerHTML = errorMessage;
            document.getElementById('transliterationContent').innerHTML = errorMessage;
            document.getElementById('translationContent').innerHTML = errorMessage;
        });
}
