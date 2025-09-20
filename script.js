// Global değişkenler
let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);
let diaryData = JSON.parse(localStorage.getItem('diaryData')) || {};
let isDragging = false;
let startX = 0;
let startY = 0;
let dragThreshold = 50; // Minimum sürükleme mesafesi
let currentPhotoSide = 'left'; // Hangi sayfaya fotoğraf ekleneceği
let isEditMode = false; // Düzenleme modu
let currentUser = localStorage.getItem('currentUser') || null; // Mevcut kullanıcı

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, uygulama başlatılıyor...');
    checkUserSelection();
    initializeApp();
    setupEventListeners();
    loadDiaryData();
    
    // Debug için elementleri kontrol et
    setTimeout(() => {
        checkElements();
    }, 1000);
});

// Kullanıcı seçimini kontrol et
function checkUserSelection() {
    if (!currentUser) {
        // Kullanıcı seçimi yapılmamış, modal göster
        showUserSelectionModal();
    } else {
        // Kullanıcı seçilmiş, modal gizle
        hideUserSelectionModal();
    }
}

// Kullanıcı seçim modalını göster
function showUserSelectionModal() {
    const userModal = document.getElementById('userSelectionModal');
    const coverPage = document.getElementById('coverPage');
    
    userModal.classList.add('active');
    userModal.classList.remove('hidden');
    coverPage.classList.add('hidden');
}

// Kullanıcı seçim modalını gizle
function hideUserSelectionModal() {
    const userModal = document.getElementById('userSelectionModal');
    const coverPage = document.getElementById('coverPage');
    
    userModal.classList.add('hidden');
    userModal.classList.remove('active');
    coverPage.classList.remove('hidden');
}

// Kullanıcı seç
function selectUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', user);
    
    // Modal gizle ve kapak sayfasını göster
    hideUserSelectionModal();
    
    // Kullanıcıya göre düzenleme butonlarını güncelle
    updateEditButtons();
    
    showSaveNotification(`${user === 'berkay' ? 'Berkay' : 'Sıla'} olarak giriş yapıldı! 👋`);
}

// Düzenleme butonlarını kullanıcıya göre güncelle
function updateEditButtons() {
    const editBtnLeft = document.getElementById('editModeBtn');
    const editBtnRight = document.getElementById('editModeBtnRight');
    
    if (!editBtnLeft || !editBtnRight) {
        console.error('Düzenleme butonları bulunamadı');
        return;
    }
    
    if (currentUser === 'berkay') {
        // Berkay sağ sayfayı düzenleyebilir
        editBtnLeft.style.display = 'none';
        editBtnRight.style.display = 'block';
    } else if (currentUser === 'sila') {
        // Sıla sol sayfayı düzenleyebilir
        editBtnLeft.style.display = 'block';
        editBtnRight.style.display = 'none';
    } else {
        // Kullanıcı seçilmemiş
        editBtnLeft.style.display = 'none';
        editBtnRight.style.display = 'none';
    }
}

// Uygulamayı başlat
function initializeApp() {
    updateDateDisplay();
    updateDatePicker();
    loadCurrentDayData();
    updateEditButtons();
    clearOldData(); // Eski verileri temizle
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Kapak fotoğrafı seçimi
    const coverImageInput = document.getElementById('coverImageInput');
    const coverImagePlaceholder = document.getElementById('coverImagePlaceholder');
    const coverImage = document.getElementById('coverImage');
    
    coverImagePlaceholder.addEventListener('click', () => {
        console.log('Kapak fotoğrafı placeholder tıklandı');
        coverImageInput.click();
    });
    coverImage.addEventListener('click', () => {
        console.log('Kapak fotoğrafı tıklandı');
        coverImageInput.click();
    });
    
    coverImageInput.addEventListener('change', function(e) {
        console.log('Kapak fotoğrafı seçildi:', e.target.files);
        handleImageUpload(e, 'cover');
    });
    
    // Günlük fotoğrafı seçimi - sadece düzenleme modunda
    const photoInput = document.getElementById('photoInput');
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    const photoContainer = document.getElementById('photoContainer');
    
    photoPlaceholder.addEventListener('click', () => {
        console.log('Sol sayfa fotoğraf placeholder tıklandı, düzenleme modu:', isEditMode, 'kullanıcı:', currentUser);
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'sila') {
            currentPhotoSide = 'left';
            photoInput.click();
        } else if (currentUser !== 'sila') {
            showSaveNotification('Bu sayfayı sadece Sıla düzenleyebilir! 🔒');
        }
    });
    photoContainer.addEventListener('click', () => {
        console.log('Sol sayfa fotoğraf container tıklandı, düzenleme modu:', isEditMode, 'kullanıcı:', currentUser);
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'sila') {
            currentPhotoSide = 'left';
            photoInput.click();
        } else if (currentUser !== 'sila') {
            showSaveNotification('Bu sayfayı sadece Sıla düzenleyebilir! 🔒');
        }
    });
    
    // Günlük fotoğrafı seçimi - sağ sayfa
    const nextPhotoPlaceholder = document.getElementById('nextPhotoPlaceholder');
    const nextPhotoContainer = document.getElementById('nextPhotoContainer');
    
    nextPhotoPlaceholder.addEventListener('click', () => {
        console.log('Sağ sayfa fotoğraf placeholder tıklandı, düzenleme modu:', isEditMode, 'kullanıcı:', currentUser);
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'berkay') {
            currentPhotoSide = 'right';
            photoInput.click();
        } else if (currentUser !== 'berkay') {
            showSaveNotification('Bu sayfayı sadece Berkay düzenleyebilir! 🔒');
        }
    });
    nextPhotoContainer.addEventListener('click', () => {
        console.log('Sağ sayfa fotoğraf container tıklandı, düzenleme modu:', isEditMode, 'kullanıcı:', currentUser);
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'berkay') {
            currentPhotoSide = 'right';
            photoInput.click();
        } else if (currentUser !== 'berkay') {
            showSaveNotification('Bu sayfayı sadece Berkay düzenleyebilir! 🔒');
        }
    });
    
    photoInput.addEventListener('change', function(e) {
        console.log('Fotoğraf seçildi:', e.target.files, 'Taraf:', currentPhotoSide);
        handleMultipleImageUpload(e);
    });
    
    // Tarih seçici
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', function(e) {
        currentDate = new Date(e.target.value);
        updateDateDisplay();
        loadCurrentDayData();
    });
    
    // Not alanı - sol sayfa
    const noteText = document.getElementById('noteText');
    noteText.addEventListener('input', function() {
        if (!isEditMode) {
            this.textContent = this.getAttribute('data-original-text') || '';
            return;
        }
        if (isEditMode && currentUser === 'sila') {
            saveCurrentDayData();
        }
    });
    
    // Enter tuşu ile satır sonu kontrolü - sol sayfa
    noteText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
        }
    });
    
    noteText.addEventListener('blur', function() {
        if (!isEditMode) {
            this.textContent = this.getAttribute('data-original-text') || '';
            return;
        }
        if (isEditMode && currentUser === 'sila') {
            saveCurrentDayData();
        }
    });
    
    noteText.addEventListener('click', function() {
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'sila' && (this.textContent.trim() === '' || this.textContent === 'Bugün ne yaptık, kiminle buluştuk...')) {
            this.textContent = '';
            this.focus();
        } else if (currentUser !== 'sila') {
            showSaveNotification('Bu sayfayı sadece Sıla düzenleyebilir! 🔒');
        }
    });
    
    // Not alanı - sağ sayfa
    const nextNoteText = document.getElementById('nextNoteText');
    nextNoteText.addEventListener('input', function() {
        if (!isEditMode) {
            this.textContent = this.getAttribute('data-original-text') || '';
            return;
        }
        if (isEditMode && currentUser === 'berkay') {
            saveCurrentDayData();
        }
    });
    
    // Enter tuşu ile satır sonu kontrolü - sağ sayfa
    nextNoteText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
        }
    });
    
    nextNoteText.addEventListener('blur', function() {
        if (!isEditMode) {
            this.textContent = this.getAttribute('data-original-text') || '';
            return;
        }
        if (isEditMode && currentUser === 'berkay') {
            saveCurrentDayData();
        }
    });
    
    nextNoteText.addEventListener('click', function() {
        if (!isEditMode) {
            showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
            return;
        }
        if (isEditMode && currentUser === 'berkay' && (this.textContent.trim() === '' || this.textContent === 'Yarın için planlarımız...')) {
            this.textContent = '';
            this.focus();
        } else if (currentUser !== 'berkay') {
            showSaveNotification('Bu sayfayı sadece Berkay düzenleyebilir! 🔒');
        }
    });
    
    // Sürükleme olayları
    setupDragEvents();
}

// Görsel yükleme işlemi
function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (type === 'cover') {
        // Kapak fotoğrafını sıkıştır
        compressImage(file, 600, 0.8).then(compressedDataUrl => {
            const coverImage = document.getElementById('coverImage');
            const coverImagePlaceholder = document.getElementById('coverImagePlaceholder');
            
            if (!coverImage || !coverImagePlaceholder) {
                console.error('Kapak fotoğrafı elementleri bulunamadı');
                return;
            }
            
            coverImage.src = compressedDataUrl;
            coverImage.style.display = 'block';
            coverImagePlaceholder.style.display = 'none';
            
            try {
                // Kapak fotoğrafını kaydet
                diaryData.coverImage = compressedDataUrl;
                localStorage.setItem('diaryData', JSON.stringify(diaryData));
                showSaveNotification('Kapak fotoğrafı eklendi! 📸');
            } catch (error) {
                console.error('localStorage hatası:', error);
                showSaveNotification('Fotoğraf çok büyük! Daha küçük bir fotoğraf seçin. 📸');
            }
        });
    }
}

// Fotoğraf sıkıştırma fonksiyonu
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Orijinal boyutları al
            let { width, height } = img;
            
            // Boyutları küçült
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            // Canvas boyutunu ayarla
            canvas.width = width;
            canvas.height = height;
            
            // Fotoğrafı çiz
            ctx.drawImage(img, 0, 0, width, height);
            
            // Sıkıştırılmış base64'i al
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Tek fotoğraf yükleme işlemi
function handleMultipleImageUpload(event) {
    const file = event.target.files[0];
    console.log('Fotoğraf yükleme başladı:', file);
    
    if (!file) return;
    
    const dateKey = currentDate.toISOString().split('T')[0];
    if (!diaryData[dateKey]) {
        diaryData[dateKey] = {};
    }
    
    const pageKey = currentPhotoSide === 'left' ? 'leftPage' : 'rightPage';
    if (!diaryData[dateKey][pageKey]) {
        diaryData[dateKey][pageKey] = {};
    }
    
    // Fotoğrafı sıkıştır
    compressImage(file).then(compressedDataUrl => {
        try {
            // Sıkıştırılmış fotoğrafı kaydet
            diaryData[dateKey][pageKey].photo = compressedDataUrl;
            localStorage.setItem('diaryData', JSON.stringify(diaryData));
            loadCurrentDayData();
            showSaveNotification('Fotoğraf eklendi! 📸');
        } catch (error) {
            console.error('localStorage hatası:', error);
            showSaveNotification('Fotoğraf çok büyük! Daha küçük bir fotoğraf seçin. 📸');
        }
    });
}

// Tarih gösterimini güncelle
function updateDateDisplay() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const turkishDate = currentDate.toLocaleDateString('tr-TR', options);
    document.getElementById('currentDate').textContent = turkishDate;
    
    // Sağ sayfa da aynı günü göster
    document.getElementById('nextDate').textContent = turkishDate;
}

// Tarih seçicisini güncelle
function updateDatePicker() {
    const datePicker = document.getElementById('datePicker');
    const today = new Date();
    datePicker.value = today.toISOString().split('T')[0];
    datePicker.max = today.toISOString().split('T')[0]; // Gelecek tarih seçilemez
}

// Günlük verilerini yükle
function loadDiaryData() {
    // Kapak fotoğrafını yükle
    if (diaryData.coverImage) {
        const coverImage = document.getElementById('coverImage');
        const coverImagePlaceholder = document.getElementById('coverImagePlaceholder');
        
        if (coverImage && coverImagePlaceholder) {
            coverImage.src = diaryData.coverImage;
            coverImage.style.display = 'block';
            coverImagePlaceholder.style.display = 'none';
        }
    }
}

// Mevcut günün verilerini yükle
function loadCurrentDayData() {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayData = diaryData[dateKey] || {};
    
    // Sol sayfa - mevcut günün versiyonu A
    loadPageData('left', dayData.leftPage || {});
    
    // Sağ sayfa - mevcut günün versiyonu B
    loadPageData('right', dayData.rightPage || {});
    
    // Bant renklerini güncelle
    createRandomTape();
}

// Sayfa verilerini yükle
function loadPageData(side, pageData) {
    let photoContainer, photoPlaceholder, deletePhotoBtn, noteText;
    
    if (side === 'left') {
        photoContainer = document.getElementById('photoContainer');
        photoPlaceholder = document.getElementById('photoPlaceholder');
        deletePhotoBtn = document.getElementById('deletePhotoBtn');
        noteText = document.getElementById('noteText');
    } else {
        photoContainer = document.getElementById('nextPhotoContainer');
        photoPlaceholder = document.getElementById('nextPhotoPlaceholder');
        deletePhotoBtn = document.getElementById('deleteNextPhotoBtn');
        noteText = document.getElementById('nextNoteText');
    }
    
    // Elementlerin var olduğunu kontrol et
    if (!photoContainer || !photoPlaceholder || !deletePhotoBtn || !noteText) {
        console.error('Element bulunamadı:', { photoContainer, photoPlaceholder, deletePhotoBtn, noteText });
        return;
    }
    
    // Tek fotoğrafı yükle
    if (pageData.photo) {
        photoContainer.innerHTML = '';
        const photoElement = document.createElement('img');
        photoElement.src = pageData.photo;
        photoElement.className = 'photo-image';
        photoElement.style.display = 'block';
        photoElement.style.width = '100%';
        photoElement.style.height = '100%';
        photoElement.style.objectFit = 'cover';
        photoContainer.appendChild(photoElement);
        
        photoContainer.style.display = 'block';
        photoPlaceholder.style.display = 'none';
        
        // Sadece düzenle modunda ve kendi sayfasındaki fotoğrafı silebilir
        if (isEditMode && ((side === 'left' && currentUser === 'sila') || (side === 'right' && currentUser === 'berkay'))) {
            deletePhotoBtn.style.display = 'flex';
        } else {
            deletePhotoBtn.style.display = 'none';
        }
    } else {
        photoContainer.style.display = 'none';
        
        // Sadece kendi sayfasına fotoğraf ekleyebilir
        if ((side === 'left' && currentUser === 'sila') || (side === 'right' && currentUser === 'berkay')) {
            photoPlaceholder.style.display = 'flex';
            photoPlaceholder.style.cursor = 'pointer';
            photoPlaceholder.style.backgroundColor = 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)';
        } else {
            photoPlaceholder.style.display = 'flex';
            photoPlaceholder.style.cursor = 'default';
            photoPlaceholder.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            photoPlaceholder.style.pointerEvents = 'none';
        }
        
        deletePhotoBtn.style.display = 'none';
    }
    
    // Notu yükle
    const noteContent = pageData.note || '';
    setNoteTextWithLineBreaks(noteText, noteContent);
    noteText.setAttribute('data-original-text', noteContent);
    
    // Kullanıcıya göre not alanını düzenlenebilir yap
    if (isEditMode && ((side === 'left' && currentUser === 'sila') || (side === 'right' && currentUser === 'berkay'))) {
        noteText.contentEditable = 'true';
        noteText.style.cursor = 'text';
        noteText.style.backgroundColor = 'transparent';
        noteText.style.pointerEvents = 'auto';
    } else {
        noteText.contentEditable = 'false';
        noteText.style.cursor = 'default';
        noteText.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        noteText.style.pointerEvents = 'none';
    }
}

// Satır sonlarını koruyarak not metnini al
function getNoteTextWithLineBreaks(element) {
    // Artık sadece <br> etiketleri kullanıyoruz, HTML'i temizle
    let html = element.innerHTML;
    
    // Tüm div yapılarını temizle
    html = html.replace(/<div[^>]*>/g, '');
    html = html.replace(/<\/div>/g, '');
    
    // Fazla br'leri temizle
    html = html.replace(/<br><br>/g, '<br>');
    html = html.replace(/^<br>/, '');
    html = html.replace(/<br>$/, '');
    
    return html;
}

// Satır sonlarını koruyarak not metnini ayarla
function setNoteTextWithLineBreaks(element, text) {
    if (!text) {
        element.innerHTML = '';
        return;
    }
    
    // Sadece <br> etiketlerini kullan
    element.innerHTML = text;
}

// Mevcut günün verilerini kaydet
function saveCurrentDayData() {
    const dateKey = currentDate.toISOString().split('T')[0];
    if (!diaryData[dateKey]) {
        diaryData[dateKey] = {};
    }
    
    // Sol sayfa verilerini kaydet
    const noteText = document.getElementById('noteText');
    if (!diaryData[dateKey].leftPage) {
        diaryData[dateKey].leftPage = {};
    }
    diaryData[dateKey].leftPage.note = getNoteTextWithLineBreaks(noteText);
    
    // Sağ sayfa verilerini kaydet
    const nextNoteText = document.getElementById('nextNoteText');
    if (!diaryData[dateKey].rightPage) {
        diaryData[dateKey].rightPage = {};
    }
    diaryData[dateKey].rightPage.note = getNoteTextWithLineBreaks(nextNoteText);
    
    localStorage.setItem('diaryData', JSON.stringify(diaryData));
}

// Günlüğü aç
function openDiary() {
    const coverPage = document.getElementById('coverPage');
    const diaryContainer = document.getElementById('diaryContainer');
    
    coverPage.classList.add('hidden');
    diaryContainer.classList.add('active');
    
    // Bugünün tarihine git
    goToToday();
}

// Kapak sayfasına git
function goToCover() {
    const coverPage = document.getElementById('coverPage');
    const diaryContainer = document.getElementById('diaryContainer');
    
    diaryContainer.classList.remove('active');
    setTimeout(() => {
        coverPage.classList.remove('hidden');
    }, 100);
}

// Bugüne git
function goToToday() {
    currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const datePicker = document.getElementById('datePicker');
    datePicker.value = currentDate.toISOString().split('T')[0];
    updateDateDisplay();
    loadCurrentDayData();
}

// Rastgele renkli bantlar için
function createRandomTape() {
    const leftTapes = document.querySelectorAll('#leftPage .polaroid-tapes .tape');
    const rightTapes = document.querySelectorAll('#rightPage .polaroid-tapes .tape');
    const colors = ['#fd79a8', '#fdcb6e', '#a29bfe', '#00b894', '#e17055', '#6c5ce7', '#fd79a8', '#fdcb6e', '#a29bfe', '#00b894', '#e17055'];
    
    // Sol sayfa bantları için rastgele renk
    leftTapes.forEach(tape => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        tape.style.background = `linear-gradient(45deg, ${randomColor}, ${randomColor}dd)`;
    });
    
    // Sağ sayfa bantları için farklı rastgele renk
    rightTapes.forEach(tape => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        tape.style.background = `linear-gradient(45deg, ${randomColor}, ${randomColor}dd)`;
    });
}

// Sayfa yüklendiğinde rastgele bant renkleri
window.addEventListener('load', createRandomTape);

// Sürükleme olaylarını ayarla
function setupDragEvents() {
    const notebookContainer = document.querySelector('.notebook-container');
    
    // Touch olayları (mobil) - 2 parmak ile kaydırma
    notebookContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    notebookContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    notebookContainer.addEventListener('touchend', handleTouchEnd);
    
    // Mouse olayları (PC) - 2 parmak ile kaydırma (trackpad)
    notebookContainer.addEventListener('wheel', handleWheel, { passive: false });
}

// Touch başlangıcı - 2 parmak kontrolü
function handleTouchStart(e) {
    if (e.touches.length === 2 && !isEditMode) {
        isDragging = true;
        startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        e.preventDefault();
    }
    // Mobilde tek parmakla da kaydırma (daha kolay kullanım)
    else if (e.touches.length === 1 && !isEditMode) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
}

// Touch hareketi - 2 parmak ile kaydırma
function handleTouchMove(e) {
    if (!isDragging) return;
    
    let currentX, currentY;
    
    if (e.touches.length === 2) {
        currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else {
        return;
    }
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Yatay kaydırma dikey kaydırmadan daha fazlaysa
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
        e.preventDefault();
        
        if (deltaX > 0) {
            // Sağa kaydırma - sonraki gün
            nextDay();
        } else {
            // Sola kaydırma - önceki gün
            previousDay();
        }
        
        isDragging = false;
    }
}

// Touch sonu
function handleTouchEnd(e) {
    isDragging = false;
}

// PC'de wheel olayı (trackpad 2 parmak kaydırma)
function handleWheel(e) {
    // Sadece düzenleme modu değilse sayfa çevirme
    if (!isEditMode) {
        // Yatay kaydırma kontrolü (trackpad 2 parmak)
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
            e.preventDefault();
            
            if (e.deltaX > 0) {
                // Sağa kaydırma - sonraki gün
                nextDay();
            } else {
                // Sola kaydırma - önceki gün
                previousDay();
            }
        }
        // Dikey kaydırma ile de sayfa çevirme (alternatif)
        else if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 50) {
            e.preventDefault();
            
            if (e.deltaY > 0) {
                // Aşağı kaydırma - sonraki gün
                nextDay();
            } else {
                // Yukarı kaydırma - önceki gün
                previousDay();
            }
        }
    }
}

// Önceki güne git
function previousDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    
    // Bugünden önceki tarihlere gitmeyi engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate <= today) {
        currentDate = newDate;
        updateDatePicker();
        updateDateDisplay();
        loadCurrentDayData();
        showPageTransition('left');
    }
}

// Sonraki güne git
function nextDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    
    // Bugünden sonraki tarihlere gitmeyi engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate <= today) {
        currentDate = newDate;
        updateDatePicker();
        updateDateDisplay();
        loadCurrentDayData();
        showPageTransition('right');
    }
}

// Sayfa geçiş animasyonu
function showPageTransition(direction) {
    const notebookContainer = document.querySelector('.notebook-container');
    
    // Geçiş animasyonu sınıfı ekle - daha yavaş ve akıcı
    notebookContainer.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    if (direction === 'left') {
        notebookContainer.style.transform = 'translateX(-30px) scale(0.98)';
    } else {
        notebookContainer.style.transform = 'translateX(30px) scale(0.98)';
    }
    
    // Animasyonu sıfırla
    setTimeout(() => {
        notebookContainer.style.transform = 'translateX(0) scale(1)';
        setTimeout(() => {
            notebookContainer.style.transition = '';
        }, 800);
    }, 400);
}

// Klavye kısayolları
document.addEventListener('keydown', function(e) {
    // Ctrl + S ile kaydet
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentDayData();
        showSaveNotification();
    }
    
    // Escape ile kapak sayfasına dön
    if (e.key === 'Escape') {
        goToCover();
    }
    
    // Sol ok tuşu - önceki gün (sadece düzenleme modu değilse)
    if (e.key === 'ArrowLeft' && !isEditMode) {
        e.preventDefault();
        previousDay();
    }
    
    // Sağ ok tuşu - sonraki gün (sadece düzenleme modu değilse)
    if (e.key === 'ArrowRight' && !isEditMode) {
        e.preventDefault();
        nextDay();
    }
});

// Kaydetme bildirimi
function showSaveNotification(message = 'Günlük kaydedildi! 💾') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00b894;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-family: 'Kalam', cursive;
        font-size: 1rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Fotoğraf silme fonksiyonu
function deletePhoto(side) {
    // Düzenleme modu kontrolü
    if (!isEditMode) {
        showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
        return;
    }
    
    // Kullanıcı kontrolü
    if ((side === 'left' && currentUser !== 'sila') || (side === 'right' && currentUser !== 'berkay')) {
        showSaveNotification('Bu sayfayı sadece ' + (side === 'left' ? 'Sıla' : 'Berkay') + ' düzenleyebilir! 🔒');
        return;
    }
    
    if (confirm('Bu sayfadaki fotoğrafı silmek istediğinizden emin misiniz?')) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const pageKey = side === 'left' ? 'leftPage' : 'rightPage';
        
        if (diaryData[dateKey] && diaryData[dateKey][pageKey]) {
            delete diaryData[dateKey][pageKey].photo;
        }
        
        localStorage.setItem('diaryData', JSON.stringify(diaryData));
        loadCurrentDayData();
        showSaveNotification('Fotoğraf silindi! 🗑️');
    }
}

// Not silme fonksiyonu
function deleteNote(side) {
    // Düzenleme modu kontrolü
    if (!isEditMode) {
        showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
        return;
    }
    
    // Kullanıcı kontrolü
    if ((side === 'left' && currentUser !== 'sila') || (side === 'right' && currentUser !== 'berkay')) {
        showSaveNotification('Bu sayfayı sadece ' + (side === 'left' ? 'Sıla' : 'Berkay') + ' düzenleyebilir! 🔒');
        return;
    }
    
    if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const pageKey = side === 'left' ? 'leftPage' : 'rightPage';
        const noteElementId = side === 'left' ? 'noteText' : 'nextNoteText';
        
        const noteText = document.getElementById(noteElementId);
        noteText.textContent = '';
        
        // Veritabanından sil
        if (diaryData[dateKey] && diaryData[dateKey][pageKey]) {
            delete diaryData[dateKey][pageKey].note;
        }
        
        localStorage.setItem('diaryData', JSON.stringify(diaryData));
        showSaveNotification('Not silindi! 🗑️');
    }
}

// Düzenleme modu toggle
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtnLeft = document.getElementById('editModeBtn');
    const editBtnRight = document.getElementById('editModeBtnRight');
    
    if (!editBtnLeft || !editBtnRight) {
        console.error('Düzenleme butonları bulunamadı');
        return;
    }
    
    // Kullanıcıya göre hangi sayfayı düzenleyebileceğini belirle
    let allowedSide = null;
    if (currentUser === 'berkay') {
        allowedSide = 'right';
    } else if (currentUser === 'sila') {
        allowedSide = 'left';
    }
    
    if (isEditMode) {
        // Sadece kullanıcının sayfasındaki butonu güncelle
        if (allowedSide === 'left') {
            editBtnLeft.textContent = '✅ Tamam';
            editBtnLeft.style.background = '#00b894';
            editBtnLeft.style.borderColor = '#00b894';
            editBtnLeft.style.color = 'white';
        } else if (allowedSide === 'right') {
            editBtnRight.textContent = '✅ Tamam';
            editBtnRight.style.background = '#00b894';
            editBtnRight.style.borderColor = '#00b894';
            editBtnRight.style.color = 'white';
        }
        
        // Sadece kullanıcının sayfasındaki düzenleme kontrollerini göster
        const editControls = document.querySelectorAll('.edit-control');
        editControls.forEach(control => {
            const isLeftControl = control.id.includes('Left') || control.id.includes('left') || control.id === 'deletePhotoBtn' || control.id === 'deleteNoteBtn';
            const isRightControl = control.id.includes('Right') || control.id.includes('right') || control.id === 'deleteNextPhotoBtn' || control.id === 'deleteNextNoteBtn';
            
            if (allowedSide === 'left' && isLeftControl) {
                control.style.display = 'flex';
            } else if (allowedSide === 'right' && isRightControl) {
                control.style.display = 'flex';
            } else {
                control.style.display = 'none';
            }
        });
        
        // Sayfa verilerini yeniden yükle (sil butonları için)
        loadCurrentDayData();
        
        showSaveNotification(`${currentUser === 'berkay' ? 'Berkay' : 'Sıla'} düzenleme modu aktif! ✏️`);
    } else {
        // Sadece kullanıcının sayfasındaki butonu güncelle
        if (allowedSide === 'left') {
            editBtnLeft.textContent = '✏️';
            editBtnLeft.style.background = 'rgba(255, 255, 255, 0.9)';
            editBtnLeft.style.borderColor = '#fd79a8';
            editBtnLeft.style.color = '#fd79a8';
        } else if (allowedSide === 'right') {
            editBtnRight.textContent = '✏️';
            editBtnRight.style.background = 'rgba(255, 255, 255, 0.9)';
            editBtnRight.style.borderColor = '#fd79a8';
            editBtnRight.style.color = '#fd79a8';
        }
        
        // Tüm düzenleme kontrollerini gizle
        const editControls = document.querySelectorAll('.edit-control');
        editControls.forEach(control => {
            control.style.display = 'none';
        });
        
        // Sayfa verilerini yeniden yükle (sil butonları için)
        loadCurrentDayData();
        
        showSaveNotification('Düzenleme modu kapatıldı! ✅');
    }
}

// Fotoğraf ekleme fonksiyonu
function addPhoto(side) {
    // Düzenleme modu kontrolü
    if (!isEditMode) {
        showSaveNotification('Önce "Düzenle" butonuna basın! ✏️');
        return;
    }
    
    // Kullanıcı kontrolü
    if ((side === 'left' && currentUser !== 'sila') || (side === 'right' && currentUser !== 'berkay')) {
        showSaveNotification('Bu sayfayı sadece ' + (side === 'left' ? 'Sıla' : 'Berkay') + ' düzenleyebilir! 🔒');
        return;
    }
    
    currentPhotoSide = side;
    document.getElementById('photoInput').click();
}

// Kullanıcı değiştir
function switchUser() {
    if (confirm('Kullanıcı değiştirmek istediğinizden emin misiniz?')) {
        // Mevcut kullanıcıyı temizle
        localStorage.removeItem('currentUser');
        currentUser = null;
        
        // Düzenleme modunu kapat
        isEditMode = false;
        
        // Kullanıcı seçim modalını göster
        showUserSelectionModal();
        
        // Günlük container'ı gizle
        const diaryContainer = document.getElementById('diaryContainer');
        diaryContainer.classList.remove('active');
    }
}

// localStorage temizleme fonksiyonu
function clearOldData() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    let hasChanges = false;
    Object.keys(diaryData).forEach(dateKey => {
        if (dateKey !== 'coverImage') {
            const date = new Date(dateKey);
            if (date < thirtyDaysAgo) {
                delete diaryData[dateKey];
                hasChanges = true;
            }
        }
    });
    
    if (hasChanges) {
        localStorage.setItem('diaryData', JSON.stringify(diaryData));
        showSaveNotification('Eski veriler temizlendi! 🗑️');
    }
}

// Veri yapısını kontrol et (debug için)
function checkDataStructure() {
    console.log('Mevcut tarih:', currentDate.toISOString().split('T')[0]);
    console.log('Tüm günlük verileri:', diaryData);
    console.log('Mevcut günün verileri:', diaryData[currentDate.toISOString().split('T')[0]]);
    console.log('Mevcut kullanıcı:', currentUser);
    console.log('Düzenleme modu:', isEditMode);
}

// Element kontrolü (debug için)
function checkElements() {
    console.log('Sol sayfa elementleri:');
    console.log('- photoContainer:', document.getElementById('photoContainer'));
    console.log('- photoPlaceholder:', document.getElementById('photoPlaceholder'));
    console.log('- deletePhotoBtn:', document.getElementById('deletePhotoBtn'));
    console.log('- noteText:', document.getElementById('noteText'));
    console.log('- editModeBtn:', document.getElementById('editModeBtn'));
    
    console.log('Sağ sayfa elementleri:');
    console.log('- nextPhotoContainer:', document.getElementById('nextPhotoContainer'));
    console.log('- nextPhotoPlaceholder:', document.getElementById('nextPhotoPlaceholder'));
    console.log('- deleteNextPhotoBtn:', document.getElementById('deleteNextPhotoBtn'));
    console.log('- nextNoteText:', document.getElementById('nextNoteText'));
    console.log('- editModeBtnRight:', document.getElementById('editModeBtnRight'));
    
    console.log('Kapak elementleri:');
    console.log('- coverImage:', document.getElementById('coverImage'));
    console.log('- coverImagePlaceholder:', document.getElementById('coverImagePlaceholder'));
}

// CSS animasyonları ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);