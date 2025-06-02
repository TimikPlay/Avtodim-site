
const catalogEl = document.getElementById('catalog');
const statsEl = document.getElementById('stats');
const categorySelect = document.getElementById('filter-category');
const stockSelect = document.getElementById('filter-stock');
const priceInput = document.getElementById('filter-price');
const nameInput = document.getElementById('filter-name');

let data = [];
let displayedCount = 30;
let filteredData = [];

fetch('https://opensheet.vercel.app/1ahWQuOhEWDdSq2IA-COaztHe1Fmwzs82zpLTL8jSfc8/Лист1')
    .then(res => res.json())
    .then(json => {
    data = json.map(item => {
        // корекція даних
        item.Ціна = Number(item.Ціна) || 0;
        return item;
    });
    initFilters();
    filterAndShow();
    })
    .catch(e => {
    catalogEl.innerHTML = '<p style="color:red;">Помилка завантаження даних</p>';
    });

function initFilters() {
    const categories = [...new Set(data.map(item => item.Категорія).filter(c => c))].sort();
    categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
    });
}

function filterAndShow() {
    displayedCount = 30;
    const cat = categorySelect.value.toLowerCase();
    const stock = stockSelect.value.toLowerCase();
    const maxPrice = Number(priceInput.value);
    const searchText = nameInput.value.toLowerCase();

    filteredData = data.filter(item => {
    if (cat && item.Категорія.toLowerCase() !== cat) return false;
    if (stock) {
        if (stock === 'так' && item.Наявність.toLowerCase() !== 'так') return false;
        if (stock === 'ні' && item.Наявність.toLowerCase() !== 'ні') return false;
    }
    if (maxPrice && item.Ціна > maxPrice) return false;
    if (searchText) {
        const combined = (item.Назва + ' ' + item.Опис + ' ' + item.Індекс).toLowerCase();
        if (!combined.includes(searchText)) return false;
    }
    return true;
    });

    showCatalog();
    showStats();
}

function showCatalog() {
    catalogEl.innerHTML = '';
    const itemsToShow = filteredData.slice(0, displayedCount);
    if (itemsToShow.length === 0) {
    catalogEl.innerHTML = '<p>Товари не знайдені за поточними фільтрами.</p>';
    return;
    }

    itemsToShow.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${item.Фото || 'no-image.png'}" alt="${item.Назва}" />
        <h3>${item.Назва}</h3>
        <p class="index">Індекс: ${item.Індекс}</p>
        <p>${item.Опис}</p>
        <p class="price">${item.Ціна.toLocaleString()} грн</p>
        <p>Наявність: <strong>${item.Наявність}</strong></p>
        <div class="watermark">Автодім</div>
    `;
    catalogEl.appendChild(card);
    });
}

function showStats() {
    statsEl.textContent = `Знайдено товарів: ${filteredData.length}`;
}

categorySelect.addEventListener('change', filterAndShow,);
stockSelect.addEventListener('change', filterAndShow);
priceInput.addEventListener('input', filterAndShow);
nameInput.addEventListener('input', filterAndShow);

function resetFilters() {
    displayedCount = data.length;
    showCatalog();
    showStats();
}