const catalogEl = document.getElementById('catalog');
const statsEl = document.getElementById('stats');
const showMoreBtn = document.getElementById('show-more');
const categorySelect = document.getElementById('filter-category');
const groupSelect = document.getElementById('filter-group');
const subgroupSelect = document.getElementById('filter-subgroup');
const stockSelect = document.getElementById('filter-stock'); // Виправлено typo: document.getElementById
const priceInput = document.getElementById('filter-price');
const nameInput = document.getElementById('filter-name');
const brandSelect = document.getElementById('filter-brand');
const sortSelect = document.getElementById('sort');


let data = []; // Зберігає всі завантажені дані
let displayedCount = 35; // Кількість товарів, що відображаються за раз
let filteredData = []; // Дані після застосування фільтрів
let availableFilters = {}; // Зберігатиме доступні опції фільтрів для випадаючих списків

// Зберігаємо позицію прокрутки перед закриттям сторінки
window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('scrollTop', window.scrollY);
});

// Функція для збереження поточних значень фільтрів у sessionStorage
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

// Обробники подій для випадаючих списків фільтрів (при зміні скидають залежні фільтри)
[
  categorySelect,
  groupSelect,
  stockSelect,
  brandSelect,
  sortSelect,
  subgroupSelect
].forEach(el => {
  el.addEventListener('change', () => {
    // Якщо змінюється категорія, скидаємо групу, підгрупу та наявність
    if (el === categorySelect) {
      groupSelect.value = '';
      subgroupSelect.value = '';
      stockSelect.value = '';
    }
    // Якщо змінюється група, скидаємо підгрупу та наявність
    if (el === groupSelect) {
      subgroupSelect.value = '';
      stockSelect.value = '';
    }
    // Якщо змінюється підгрупа, скидаємо наявність
    if (el === subgroupSelect) {
      stockSelect.value = '';
    }

    storeFilters(); // Зберігаємо фільтри
    filterAndShow(true); // Перезапускаємо фільтрацію та оновлення фільтрів (скидаємо лічильник відображених товарів)
  });
});

// Обробники подій для текстових полів фільтрів (ціна, назва)
[priceInput, nameInput].forEach(el => {
  el.addEventListener('input', () => {
    storeFilters(); // Зберігаємо фільтри
    filterAndShow(true); // Перезапускаємо фільтрацію та оновлення фільтрів (скидаємо лічильник відображених товарів)
  });
});

// Завантаження даних та ініціалізація сторінки
fetch('https://opensheet.vercel.app/1ahWQuOhEWDdSq2IA-COaztHe1Fmwzs82zpLTL8jSfc8/Лист1')
  .then(res => res.json())
  .then(json => {
    // **** КЛЮЧОВА ЗМІНА ТУТ: Фільтруємо об'єкти, які не мають достатньо даних для картки
    data = json.map(item => {
      // Перетворюємо ціну на число, якщо її немає, встановлюємо 0
      item.Ціна = Number(item.Ціна) || 0;
      return item;
    }).filter(item => {
      // Фільтруємо об'єкти, які не мають Коду АБО Назви (або обидва порожні)
      // Це дозволить відкинути порожні рядки з таблиці.
      const hasCode = item.Код && String(item.Код).trim() !== '';
      const hasName = item.Назва && String(item.Назва).trim() !== '';
      return hasCode || hasName; // Елемент вважається валідним, якщо має хоча б код АБО назву
    });

    initAllFiltersOptions(data); // Ініціалізуємо всі доступні опції фільтрів
    filterAndShow(true); // Перше завантаження, оновлюємо фільтри та відображаємо товари

    // Відновлення збережених значень фільтрів з sessionStorage
    categorySelect.value = sessionStorage.getItem('filter-category') || '';
    groupSelect.value = sessionStorage.getItem('filter-group') || '';
    subgroupSelect.value = sessionStorage.getItem('filter-subgroup') || '';
    stockSelect.value = sessionStorage.getItem('filter-stock') || '';
    priceInput.value = sessionStorage.getItem('filter-price') || '';
    nameInput.value = sessionStorage.getItem('filter-name') || '';
    brandSelect.value = sessionStorage.getItem('filter-brand') || '';
    sortSelect.value = sessionStorage.getItem('sort') || '';

    filterAndShow(false); // Застосовуємо відновлені фільтри без скидання лічильника відображених товарів

    // Відновлення позиції прокрутки
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
  return [...options].sort(); // Повертаємо відсортований масив унікальних значень
}

// Допоміжна функція для перевірки, чи елемент відповідає обраним фільтрам
function meetsCurrentFilters(item, currentFilterValues) {
  const { cat, group, subgroup, stock, brand, maxPrice, searchText } = currentFilterValues;

  // Перевірка на відповідність категорії
  if (cat && item.Категорія?.toLowerCase() !== cat) return false;
  // Перевірка на відповідність групі
  if (group && item.Група?.toLowerCase() !== group) return false;
  // Перевірка на відповідність підгрупі
  if (subgroup && item.Підгрупа?.toLowerCase() !== subgroup) return false;
  // Перевірка на відповідність виробнику
  if (brand && item.Виробник?.toLowerCase() !== brand) return false;

  // Перевірка наявності
  if (stock) {
    let itemStockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');
    if ((stock === 'так' && itemStockVal !== 'так') || (stock === 'ні' && itemStockVal !== 'ні')) return false;
  }

  // Перевірка ціни (менше або дорівнює максимальній ціні)
  if (maxPrice && item.Ціна > maxPrice) return false;

  // Пошук за текстом (назва, опис, код)
  if (searchText) {
    const combined = `${item.Назва} ${item.Опис} ${item.Код}`.toLowerCase();
    if (!combined.includes(searchText)) return false;
  }

  return true; // Якщо пройшов усі перевірки, елемент відповідає фільтрам
}

// Ініціалізує всі опції фільтрів на основі повного набору даних
function initAllFiltersOptions(dataToProcess) {
  availableFilters.categories = [...new Set(dataToProcess.map(item => item.Категорія).filter(Boolean))].sort();
  availableFilters.groups = [...new Set(dataToProcess.map(item => item.Група).filter(Boolean))].sort();
  availableFilters.subgroups = [...new Set(dataToProcess.map(item => item.Підгрупа).filter(Boolean))].sort();
  availableFilters.brands = [...new Set(dataToProcess.map(item => item.Виробник).filter(Boolean))].sort();
}

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
  const filtersForGroupOptions = {
    cat: currentFilterValues.cat,
    group: null,
    subgroup: null,
    stock: currentFilterValues.stock,
    brand: currentFilterValues.brand,
    maxPrice: currentFilterValues.maxPrice,
    searchText: currentFilterValues.searchText,
  };

  const filteredGroups = getUniqueFilterOptions(data, 'Група', filtersForGroupOptions);
  updateSelectOptions(groupSelect, filteredGroups, item => {
    const tempCurrentFilterValuesForPredicate = {
      ...currentFilterValues,
      group: item.toLowerCase(),
      subgroup: null
    };
    return data.some(dItem => meetsCurrentFilters(dItem, tempCurrentFilterValuesForPredicate));
  });
  groupSelect.disabled = !currentFilterValues.cat;

  // Оновлення підгруп
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
  subgroupSelect.disabled = !currentFilterValues.cat || !currentFilterValues.group;

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
      stock: null
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
      stock: null
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

// Головна функція для фільтрації та відображення даних
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


  // Сортування відфільтрованих даних
  const sortOption = sortSelect.value;
  filteredData.sort((a, b) => {
    switch (sortOption) {
      case 'price-asc': return a.Ціна - b.Ціна;
      case 'price-desc': return b.Ціна - a.Ціна;
      case 'index-asc': return (a.Код || '').localeCompare(b.Код || '', undefined, { numeric: true });
      case 'index-desc': return (b.Код || '').localeCompare(a.Код || '', undefined, { numeric: true });
      case 'name-asc': return (a.Назва || '').localeCompare(b.Назва || '');
      case 'name-desc': return (b.Назва || '').localeCompare(a.Назва || '');
      default: return 0;
    }
  });

  updateFilterOptions(); // Оновлюємо випадаючі списки фільтрів після фільтрації даних

  showCatalog(); // Відображаємо товари
  showStats(); // Оновлюємо статистику
}

// Функція для відображення каталогу товарів
function showCatalog() {
  catalogEl.innerHTML = ''; // Очищаємо вміст каталогу
  const itemsToShow = filteredData.slice(0, displayedCount); // Беремо тільки певну кількість товарів
  const isMobile = window.innerWidth <= 768; // Перевіряємо, чи це мобільна версія

  // Якщо товарів немає, виводимо повідомлення та приховуємо кнопку "Показати більше"
  if (itemsToShow.length === 0) {
    catalogEl.innerHTML = '<p>Товари не знайдені за поточними фільтрами.</p>';
    showMoreBtn.style.display = 'none';
    return;
  }

  itemsToShow.forEach(item => {
    // Ця перевірка залишається як додатковий запобіжник, хоча основна фільтрація вже відбулась
    if (!item.Код && !item.Назва) { // Якщо немає ні Коду, ні Назви, пропускаємо
      return;
    }

    // Визначаємо значення наявності
    const stockVal = (!item.Наявність || item.Наявність === '0') ? 'ні' :
      (!isNaN(Number(item.Наявність)) && Number(item.Наявність) > 0) ? 'так' :
      (item.Наявність.toString().toLowerCase() === 'так' ? 'так' : 'ні');

    const card = document.createElement('div');
    card.className = 'card';
    // Шаблон картки товару для мобільних та десктопних пристроїв
    card.innerHTML = isMobile ? `
      <a href="product.html?index=${encodeURIComponent(item.Код || '')}" style="text-decoration: none; color: inherit;">
        <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва?.trim() || 'Без назви'}" />
        <h3>${item.Назва?.trim() || 'Без назви'}</h3>
        <p class="description">${truncateText(item.Опис?.trim(), 37)}</p>
        <p class="price">${item.Ціна ? item.Ціна.toLocaleString() + ' грн' : '<small>Ціна не вказана</small>'}</p>
        <p><strong>${stockVal === 'так' ? 'В наявності' : 'Немає'}</strong></p>
        <p class="index"><small>Код: ${item.Код?.trim() || 'Невідомо'}</small></p>
        <div class="watermark">Автодім</div>
      </a>
    ` : `
      <a href="product.html?index=${encodeURIComponent(item.Код || '')}" style="text-decoration: none; color: inherit;">
        <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва?.trim() || 'Без назви'}" />
        <h3>${item.Назва?.trim() || 'Без назви'}</h3>
        <p class="index">Код: ${item.Код?.trim() || 'Невідомо'}</p>
        <p class="description">${truncateText(item.Опис?.trim(), 50)}</p>
        <p class="price">${item.Ціна ? item.Ціна.toLocaleString() + ' грн' : 'Ціна не вказана'}</p>
        <p>Наявність: <strong>${stockVal === 'так' ? 'В наявності' : 'Немає'}</strong></p>
        <div class="watermark">Автодім</div>
      </a>
    `;
    catalogEl.appendChild(card);
  });

  // Показуємо або приховуємо кнопку "Показати більше"
  showMoreBtn.style.display = (filteredData.length > displayedCount) ? 'block' : 'none';
}

// Функція для відображення статистики (кількість знайдених товарів)
function showStats() {
  statsEl.textContent = `Знайдено товарів: ${filteredData.length}`;
}

// Функція для обрізання тексту опису
function truncateText(text, maxLength) {
  if (!text) return 'Опис відсутній.';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}

// Функція для завантаження більшої кількості товарів
function showMoreItems() {
  displayedCount += 35; // Збільшуємо лічильник
  showCatalog(); // Відображаємо оновлений каталог
}