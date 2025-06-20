const catalogEl = document.getElementById('catalog');
const statsEl = document.getElementById('stats');
const showMoreBtn = document.getElementById('show-more');
const categorySelect = document.getElementById('filter-category');
const groupSelect = document.getElementById('filter-group');
const subgroupSelect = document.getElementById('filter-subgroup');
const stockSelect = document.getElementById('filter-stock');
const priceInput = document.getElementById('filter-price');
const nameInput = document.getElementById('filter-name');
const brandSelect = document.getElementById('filter-brand');
const sortSelect = document.getElementById('sort');


let data = [];
let displayedCount = 35;
let filteredData = [];
let availableFilters = {}; // Зберігатиме доступні опції фільтрів

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('scrollTop', window.scrollY);
});

function storeFilters() {
  sessionStorage.setItem('filter-category', categorySelect.value);
  sessionStorage.setItem('filter-group', groupSelect.value);
  sessionStorage.setItem('filter-subgroup', subgroupSelect.value);
  sessionStorage.setItem('filter-stock', stockSelect.value);
  sessionStorage.setItem('filter-price', priceInput.value);
  sessionStorage.setItem('filter-name', nameInput.value);
  sessionStorage.setItem('filter-brand', brandSelect.value);
  sessionStorage.setItem('sort', sortSelect.value);
}

// Обробники подій для фільтрів, що скидають залежні фільтри
[
  categorySelect,
  groupSelect,
  stockSelect,
  brandSelect,
  sortSelect,
  subgroupSelect
].forEach(el => {
  el.addEventListener('change', () => {
    if (el === categorySelect) {
      groupSelect.value = '';
      subgroupSelect.value = '';
      stockSelect.value = '';
    }
    if (el === groupSelect) {
      subgroupSelect.value = '';
      stockSelect.value = '';
    }
    if (el === subgroupSelect) {
      stockSelect.value = '';
    }

    storeFilters();
    filterAndShow(true); // Перезапускаємо фільтрацію та оновлення фільтрів
  });
});

// Обробники подій для текстових полів фільтрів
[priceInput, nameInput].forEach(el => {
  el.addEventListener('input', () => {
    storeFilters();
    filterAndShow(true); // Перезапускаємо фільтрацію та оновлення фільтрів
  });
});

// Завантаження даних та ініціалізація
fetch('https://opensheet.vercel.app/1ahWQuOhEWDdSq2IA-COaztHe1Fmwzs82zpLTL8jSfc8/Лист1')
  .then(res => res.json())
  .then(json => {
    data = json.map(item => {
      item.Ціна = Number(item.Ціна) || 0;
      return item;
    });

    initAllFiltersOptions(data);
    filterAndShow(true); // Перше завантаження, оновлення фільтрів

    // Відновлення збережених значень фільтрів
    categorySelect.value = sessionStorage.getItem('filter-category') || '';
    groupSelect.value = sessionStorage.getItem('filter-group') || '';
    subgroupSelect.value = sessionStorage.getItem('filter-subgroup') || '';
    stockSelect.value = sessionStorage.getItem('filter-stock') || '';
    priceInput.value = sessionStorage.getItem('filter-price') || '';
    nameInput.value = sessionStorage.getItem('filter-name') || '';
    brandSelect.value = sessionStorage.getItem('filter-brand') || '';
    sortSelect.value = sessionStorage.getItem('sort') || '';

    filterAndShow(false); // Застосовуємо відновлені фільтри

    const savedScroll = sessionStorage.getItem('scrollTop');
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }
  })
  .catch(e => {
    console.error(e);
    catalogEl.innerHTML = '<p style="color:red;">Помилка завантаження даних</p>';
  });

// Функція для отримання унікальних значень для фільтра з врахуванням поточних фільтрів
function getUniqueFilterOptions(items, property, currentFilterValues) {
  const options = new Set();
  items.forEach(item => {
    if (item[property] && meetsCurrentFilters(item, currentFilterValues)) {
      options.add(item[property]);
    }
  });
  return [...options].sort();
}

// Допоміжна функція для перевірки, чи елемент відповідає обраним фільтрам
function meetsCurrentFilters(item, currentFilterValues) {
  const { cat, group, subgroup, stock, brand, maxPrice, searchText } = currentFilterValues;

  if (cat && item.Категорія?.toLowerCase() !== cat) return false;
  if (group && item.Група?.toLowerCase() !== group) return false;
  if (subgroup && item.Підгрупа?.toLowerCase() !== subgroup) return false;
  if (brand && item.Виробник?.toLowerCase() !== brand) return false;

  if (stock) {
    let itemStockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');
    if ((stock === 'так' && itemStockVal !== 'так') || (stock === 'ні' && itemStockVal !== 'ні')) return false;
  }

  if (maxPrice && item.Ціна > maxPrice) return false;

  if (searchText) {
    const combined = `${item.Назва} ${item.Опис} ${item.Індекс}`.toLowerCase();
    if (!combined.includes(searchText)) return false;
  }

  return true;
}

// Ініціалізує всі опції фільтрів на основі повного набору даних
function initAllFiltersOptions(dataToProcess) {
  availableFilters.categories = [...new Set(dataToProcess.map(item => item.Категорія).filter(Boolean))].sort();
  availableFilters.groups = [...new Set(dataToProcess.map(item => item.Група).filter(Boolean))].sort();
  availableFilters.subgroups = [...new Set(dataToProcess.map(item => item.Підгрупа).filter(Boolean))].sort();
  availableFilters.brands = [...new Set(dataToProcess.map(item => item.Виробник).filter(Boolean))].sort();
}

// Функція оновлення випадаючих списків фільтрів
// Функція оновлення випадаючих списків фільтрів
function updateFilterOptions() {
  const currentFilterValues = {
    cat: categorySelect.value.toLowerCase(),
    group: groupSelect.value.toLowerCase(),
    subgroup: subgroupSelect.value.toLowerCase(),
    stock: stockSelect.value.toLowerCase(),
    brand: brandSelect.value.toLowerCase(),
    maxPrice: Number(priceInput.value),
    searchText: nameInput.value.toLowerCase(),
  };

  // Оновлення категорій
  updateSelectOptions(categorySelect, availableFilters.categories, item => {
    const tempCurrentFilterValues = {
      ...currentFilterValues,
      cat: item.toLowerCase()
    };
    return data.some(dItem => meetsCurrentFilters(dItem, tempCurrentFilterValues));
  });

  // Оновлення груп
  // **** ЗМІНА ТУТ: Ми створюємо тимчасовий об'єкт фільтрів, де subgroup та group встановлені на null.
  // Це дозволяє отримати ВСІ групи, які відповідають лише обраній категорії (і іншим неієрархічним фільтрам).
  const filtersForGroupOptions = {
    cat: currentFilterValues.cat, // Враховуємо обрану категорію
    group: null, // Не враховуємо поточний вибір групи
    subgroup: null, // <--- КЛЮЧОВА ЗМІНА: Не враховуємо підгрупу для фільтрації опцій групи
    stock: currentFilterValues.stock,
    brand: currentFilterValues.brand,
    maxPrice: currentFilterValues.maxPrice,
    searchText: currentFilterValues.searchText,
  };

  const filteredGroups = getUniqueFilterOptions(data, 'Група', filtersForGroupOptions);
  updateSelectOptions(groupSelect, filteredGroups, item => {
    // При перевірці чи опція групи актуальна, знову ж таки, ігноруємо subgroup
    const tempCurrentFilterValuesForPredicate = {
      ...currentFilterValues,
      group: item.toLowerCase(),
      subgroup: null // Ігноруємо підгрупу, коли перевіряємо чи є товари для цієї групи
    };
    return data.some(dItem => meetsCurrentFilters(dItem, tempCurrentFilterValuesForPredicate));
  });
  groupSelect.disabled = !currentFilterValues.cat; // Група залежить від категорії

  // Оновлення підгруп
  // Підгрупа повинна фільтруватися за категорією та групою.
  const filteredSubgroups = getUniqueFilterOptions(data, 'Підгрупа', { ...currentFilterValues,
    subgroup: null
  });
  updateSelectOptions(subgroupSelect, filteredSubgroups, item => {
    const tempCurrentFilterValues = {
      ...currentFilterValues,
      subgroup: item.toLowerCase()
    };
    return data.some(dItem => meetsCurrentFilters(dItem, tempCurrentFilterValues));
  });
  subgroupSelect.disabled = !currentFilterValues.cat || !currentFilterValues.group; // Підгрупа залежить від категорії та групи


  // Оновлення виробників
  const filteredBrands = getUniqueFilterOptions(data, 'Виробник', { ...currentFilterValues,
    brand: null
  });
  updateSelectOptions(brandSelect, filteredBrands, item => {
    const tempCurrentFilterValues = {
      ...currentFilterValues,
      brand: item.toLowerCase()
    };
    return data.some(dItem => meetsCurrentFilters(dItem, tempCurrentFilterValues));
  });
  if (!filteredBrands.includes(brandSelect.value) && brandSelect.value !== '') brandSelect.value = '';

  // Оновлення фільтра "Наявність"
  const hasInStock = data.some(item => {
    const itemStockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');
    return itemStockVal === 'так' && meetsCurrentFilters(item, {
      cat: currentFilterValues.cat,
      group: currentFilterValues.group,
      subgroup: currentFilterValues.subgroup,
      brand: currentFilterValues.brand,
      maxPrice: currentFilterValues.maxPrice,
      searchText: currentFilterValues.searchText,
      stock: null // Ігноруємо поточний фільтр наявності при перевірці
    });
  });

  const hasOutOfStock = data.some(item => {
    const itemStockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');
    return itemStockVal === 'ні' && meetsCurrentFilters(item, {
      cat: currentFilterValues.cat,
      group: currentFilterValues.group,
      subgroup: currentFilterValues.subgroup,
      brand: currentFilterValues.brand,
      maxPrice: currentFilterValues.maxPrice,
      searchText: currentFilterValues.searchText,
      stock: null // Ігноруємо поточний фільтр наявності при перевірці
    });
  });

  const currentStockValue = stockSelect.value;
  stockSelect.innerHTML = '<option value="">Усі</option>';

  if (hasInStock) {
    const opt = document.createElement('option');
    opt.value = 'так';
    opt.textContent = 'В наявності';
    stockSelect.appendChild(opt);
  }
  if (hasOutOfStock) {
    const opt = document.createElement('option');
    opt.value = 'ні';
    opt.textContent = 'Немає';
    stockSelect.appendChild(opt);
  }

  const currentStockOptions = Array.from(stockSelect.options);
  if (!currentStockOptions.some(opt => opt.value === currentStockValue) && currentStockValue !== '') {
    stockSelect.value = '';
  } else {
    stockSelect.value = currentStockValue;
  }
}

// Допоміжна функція для оновлення елементів select
function updateSelectOptions(selectElement, options, filterPredicate) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = `<option value="">Усі${selectElement.id === 'filter-brand' ? ' виробники' : ''}</option>`;

  options.forEach(option => {
    if (filterPredicate(option)) {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      selectElement.appendChild(opt);
    }
  });

  const currentOptions = Array.from(selectElement.options);

  if (!currentOptions.some(opt => opt.value === currentValue) && currentValue !== '') {
    selectElement.value = '';
  } else {
    selectElement.value = currentValue;
  }
}

function filterAndShow(reset = false) {
  if (reset) displayedCount = 35;

  const cat = categorySelect.value.toLowerCase();
  const group = groupSelect.value.toLowerCase();
  const subgroup = subgroupSelect.value.toLowerCase();
  const stock = stockSelect.value.toLowerCase();
  const brand = brandSelect.value.toLowerCase();
  const maxPrice = Number(priceInput.value);
  const searchText = nameInput.value.toLowerCase();

  const currentFilterValues = { cat, group, subgroup, stock, brand, maxPrice, searchText };

  filteredData = data.filter(item => meetsCurrentFilters(item, currentFilterValues));

  const sortOption = sortSelect.value;
  filteredData.sort((a, b) => {
    switch (sortOption) {
      case 'price-asc': return a.Ціна - b.Ціна;
      case 'price-desc': return b.Ціна - a.Ціна;
      case 'index-asc': return (a.Індекс || '').localeCompare(b.Індекс || '', undefined, { numeric: true });
      case 'index-desc': return (b.Індекс || '').localeCompare(a.Індекс || '', undefined, { numeric: true });
      case 'name-asc': return (a.Назва || '').localeCompare(b.Назва || '');
      case 'name-desc': return (b.Назва || '').localeCompare(a.Назва || '');
      default: return 0;
    }
  });

  updateFilterOptions(); // Оновлюємо фільтри після фільтрації даних

  showCatalog();
  showStats();
}

function showCatalog() {
  catalogEl.innerHTML = '';
  const itemsToShow = filteredData.slice(0, displayedCount);
  const isMobile = window.innerWidth <= 768;

  if (itemsToShow.length === 0) {
    catalogEl.innerHTML = '<p>Товари не знайдені за поточними фільтрами.</p>';
    showMoreBtn.style.display = 'none';
    return;
  }

  itemsToShow.forEach(item => {
    const stockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = isMobile ?  `
      <a href="product.html?index=${encodeURIComponent(item.Індекс || '')}" style="text-decoration: none; color: inherit;">
        <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва?.trim() || 'Без назви'}" />
        <h3>${item.Назва?.trim() || 'Без назви'}</h3>
        <p class="description">${truncateText(item.Опис?.trim(), 37)}</p>
        <p class="price">${item.Ціна ? item.Ціна.toLocaleString() + ' грн' : '<small>Ціна не вказана</small>'}</p>
        <p><strong>${stockVal === 'так' ? 'В наявності' : 'Немає'}</strong></p>
        <p class="index"><small>Індекс: ${item.Індекс?.trim() || 'Невідомо'}</small></p>
        <div class="watermark">Автодім</div>
      </a>
    ` : `
      <a href="product.html?index=${encodeURIComponent(item.Індекс || '')}" style="text-decoration: none; color: inherit;">
        <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва?.trim() || 'Без назви'}" />
        <h3>${item.Назва?.trim() || 'Без назви'}</h3>
        <p class="index">Індекс: ${item.Індекс?.trim() || 'Невідомо'}</p>
        <p class="description">${truncateText(item.Опис?.trim(), 50)}</p>
        <p class="price">${item.Ціна ? item.Ціна.toLocaleString() + ' грн' : 'Ціна не вказана'}</p>
        <p>Наявність: <strong>${stockVal === 'так' ? 'В наявності' : 'Немає'}</strong></p>
        <div class="watermark">Автодім</div>
      </a>
    `;
    catalogEl.appendChild(card);
  });

  showMoreBtn.style.display = (filteredData.length > displayedCount) ? 'block' : 'none';
}

function showStats() {
  statsEl.textContent = `Знайдено товарів: ${filteredData.length}`;
}

function truncateText(text, maxLength) {
  if (!text) return 'Опис відсутній.';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

function showMoreItems() {
  displayedCount += 35;
  showCatalog();
}