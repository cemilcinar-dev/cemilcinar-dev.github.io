// --- WARNING ---
// This is a simplified plan. Implementing this fully requires detailed API knowledge
// and robust error handling.

const SURAHS_API_URL = 'http://api.alquran.cloud/v1/meta/surah';
const SURAH_DETAIL_URL = (id) => `http://api.alquran.cloud/v1/surah/${id}/editions/quran-simple,en.transliteration,en.sahih`;

document.addEventListener('DOMContentLoaded', () => {
    fetch(SURAHS_API_URL)
        .then(response => response.json())
        .then(data => {
            const shortSurahs = data.data.surahs.references.filter(s => s.ayahs < 10 && s.number > 1); // Get Surahs with < 10 Ayahs, excluding Al-Fatiha (which is often handled separately/has 7)
            
            const surahListContainer = document.getElementById('surahList');
            
            // Clear the placeholder/Welcome item
            surahListContainer.innerHTML = ''; 

            shortSurahs.forEach(surah => {
                const link = document.createElement('a');
                link.className = 'list-group-item list-group-item-action surah-link';
                link.setAttribute('data-surah-id', surah.number);
                link.innerHTML = `<strong>${surah.number}. ${surah.englishName}</strong> (${surah.name}) <small class="text-muted">${surah.ayahs} Ayahs</small>`;
                
                link.addEventListener('click', () => loadSurahContent(surah.number, surah.englishName, surah.revelationType));
                
                surahListContainer.appendChild(link);
            });
            
            // Automatically load the first short surah on page load
            if (shortSurahs.length > 0) {
                const firstSurah = shortSurahs[0];
                loadSurahContent(firstSurah.number, firstSurah.englishName, firstSurah.revelationType);
                document.querySelector(`[data-surah-id="${firstSurah.number}"]`).classList.add('active');
            }

        })
        .catch(error => console.error("Error fetching Surah list:", error));
});


function loadSurahContent(surahId, englishName, revelationType) {
    
    // Deactivate all surah links
    document.querySelectorAll('.surah-link').forEach(link => link.classList.remove('active'));
    // Activate the clicked link
    document.querySelector(`[data-surah-id="${surahId}"]`).classList.add('active');

    // Update static details
    document.getElementById('surahTitle').textContent = englishName;
    document.getElementById('surahDetails').innerHTML = `**Surah Info:** Revealed in ${revelationType}. ${document.querySelector(`[data-surah-id="${surahId}"]`).querySelector('small').textContent}`;

    // Show loading text
    document.getElementById('arabicContent').textContent = 'Loading...';
    document.getElementById('transliterationContent').textContent = 'Loading...';
    document.getElementById('translationContent').textContent = 'Loading...';

    // Fetch the content for the selected Surah
    fetch(SURAH_DETAIL_URL(surahId))
        .then(response => response.json())
        .then(data => {
            
            // The API returns an array of editions (quran-simple, transliteration, sahih)
            const arabic = data.data.find(e => e.edition.name === 'quran-simple');
            const transliteration = data.data.find(e => e.edition.name === 'en.transliteration');
            const translation = data.data.find(e => e.edition.name === 'en.sahih');

            let arabicHTML = '';
            let transliterationHTML = '';
            let translationHTML = '';
            
            // Loop through the Ayahs and format the output
            arabic.ayahs.forEach((ayah, index) => {
                const ayahNumber = index + 1;
                const arabicText = ayah.text;
                const transText = transliteration.ayahs[index].text;
                const translaText = translation.ayahs[index].text;

                arabicHTML += `<p class="fs-4 text-end my-3">${arabicText} (${ayahNumber})</p>`;
                transliterationHTML += `<p class="my-3">(${ayahNumber}) ${transText}</p>`;
                translationHTML += `<p class="my-3">(${ayahNumber}) ${translaText}</p>`;
            });

            // Update the Tab Content
            document.getElementById('arabicContent').innerHTML = arabicHTML;
            document.getElementById('transliterationContent').innerHTML = transliterationHTML;
            document.getElementById('translationContent').innerHTML = translationHTML;
        })
        .catch(error => console.error(`Error loading content for Surah ${surahId}:`, error));
}
