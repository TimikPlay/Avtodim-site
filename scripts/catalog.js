const catalogEl = document.getElementById('catalog');
const statsEl = document.getElementById('stats');
const categorySelect = document.getElementById('filter-category');
const stockSelect = document.getElementById('filter-stock');
const priceInput = document.getElementById('filter-price');
const nameInput = document.getElementById('filter-name');

let data = [];
let displayedCount = 30;
let filteredData = [];

// ✅ ЗБЕРЕЖЕННЯ scroll перед виходом
window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('scrollTop', window.scrollY);
});

// ✅ ЗБЕРЕЖЕННЯ фільтрів при зміні
function storeFilters() {
  sessionStorage.setItem('filter-category', categorySelect.value);
  sessionStorage.setItem('filter-stock', stockSelect.value);
  sessionStorage.setItem('filter-price', priceInput.value);
  sessionStorage.setItem('filter-name', nameInput.value);
}

// ✅ Підключення подій
[categorySelect, stockSelect].forEach(el => {
  el.addEventListener('change', () => {
    storeFilters();
    filterAndShow();
  });
});
[priceInput, nameInput].forEach(el => {
  el.addEventListener('input', () => {
    storeFilters();
    filterAndShow();
  });
});

// ✅ Завантаження даних
fetch('https://opensheet.vercel.app/1ahWQuOhEWDdSq2IA-COaztHe1Fmwzs82zpLTL8jSfc8/Лист1')
  .then(res => res.json())
  .then(json => {
    data = json.map(item => {
      item.Ціна = Number(item.Ціна) || 0;
      return item;
    });

    initFilters(); // спочатку створюємо <option>

    // ✅ Встановлюємо фільтри ПІСЛЯ ініціалізації категорій
    if (sessionStorage.getItem('filter-category')) categorySelect.value = sessionStorage.getItem('filter-category');
    if (sessionStorage.getItem('filter-stock')) stockSelect.value = sessionStorage.getItem('filter-stock');
    if (sessionStorage.getItem('filter-price')) priceInput.value = sessionStorage.getItem('filter-price');
    if (sessionStorage.getItem('filter-name')) nameInput.value = sessionStorage.getItem('filter-name');

    filterAndShow();

    // ✅ Відновлення scroll після відображення
    const savedScroll = sessionStorage.getItem('scrollTop');
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }
  })
  .catch(e => {
    console.error(e);
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
    if (cat && item.Категорія?.toLowerCase() !== cat) return false;

    if (stock) {
      const stockVal = item.Наявність?.toLowerCase() || '';
      if (stock === 'так' && stockVal !== 'так') return false;
      if (stock === 'ні' && stockVal !== 'ні') return false;
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
    <a href="product.html?index=${encodeURIComponent(item.Індекс)}" style="text-decoration: none; color: inherit;">
        <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва?.trim() || 'Без назви'}" />
        <h3>${item.Назва?.trim() || 'Без назви'}</h3>
        <p class="index">Індекс: ${item.Індекс?.trim() || 'Невідомо'}</p>
        <p>${item.Опис?.trim() || 'Опис відсутній.'}</p>
        <p class="price">${(item.Ціна ? item.Ціна.toLocaleString() + ' грн' : 'Ціна не вказана')}</p>
        <p>Наявність: <strong>${item.Наявність?.trim() || 'Невідомо'}</strong></p>
        <div class="watermark">Автодім</div>
    </a>
    `;
    catalogEl.appendChild(card);
  });
}

function showStats() {
  statsEl.textContent = `Знайдено товарів: ${filteredData.length}`;
}

function resetFilters() {
  categorySelect.value = '';
  stockSelect.value = '';
  priceInput.value = '';
  nameInput.value = '';
  storeFilters();
  filterAndShow();
}
