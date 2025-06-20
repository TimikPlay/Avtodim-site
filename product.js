const params = new URLSearchParams(location.search);
const productIndex = params.get('index');
const container = document.getElementById('product-details');

if (!productIndex) {
    container.innerHTML = '<p class="message">Помилка: код товару не вказаний.</p>';
} else {
    fetch('https://opensheet.vercel.app/1ahWQuOhEWDdSq2IA-COaztHe1Fmwzs82zpLTL8jSfc8/Лист1')
    .then(res => res.json())
    .then(data => {
        const item = data.find(x => x.Код?.trim() === productIndex.trim());
        if (!item) {
            container.innerHTML = '<p class="message">Товар не знайдено.</p>';
            return;
        }

        let stockValRaw = item.Наявність;
        let stockDisplay;

        if (stockValRaw === undefined || stockValRaw === null || stockValRaw === '' || stockValRaw === '0') {
            stockDisplay = 'ні';
        } else if (!isNaN(Number(stockValRaw)) && Number(stockValRaw) > 0) {
            stockDisplay = 'так';
        } else {
            stockDisplay = stockValRaw.toString().toLowerCase();
            if (stockDisplay !== 'так' && stockDisplay !== 'ні') {
                stockDisplay = 'ні';
            }
        }

        container.innerHTML = `
        <div class="product-image" aria-label="Фото товару">
            <img src="${item.Фото?.trim() || 'https://i.postimg.cc/8c3tnzSz/1211233-200.png'}" alt="${item.Назва || 'Фото товару'}" id="productImage" />
        </div>
        <div class="product-info">
            <h1>${item.Назва || 'Без назви'}</h1>
            <p><strong>Опис:</strong> ${item.Опис || 'Немає опису.'}</p>
            <p><strong>Ціна:</strong> ${item.Ціна ? Number(item.Ціна).toLocaleString() + ' грн' : 'Не вказана'}</p>
            <p><strong>Наявність:</strong> ${stockDisplay}</p>
            <p><strong>Код:</strong> ${item.Код || '-'}</p>
            <div class="product-buttons">
                <button disabled>🛒 Додати в кошик</button>
                <button disabled>❤️ Вподобати</button>
                <button disabled>📞 Уточнити у продавця</button>
            </div>
        </div>
        `;

        const productImage = document.getElementById('productImage');
        let zoomed = false;

        productImage.addEventListener('mouseenter', () => {
            productImage.style.transition = 'transform 0.3s ease';
            productImage.style.transform = 'scale(1.8)';
            zoomed = true;
        });
        productImage.addEventListener('mouseleave', () => {
            productImage.style.transform = 'scale(1)';
            zoomed = false;
        });
        productImage.addEventListener('mousemove', e => {
            if (!zoomed) return;
            const rect = productImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xPercent = x / rect.width * 100;
            const yPercent = y / rect.height * 100;
            productImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });
    })
    .catch(() => {
        container.innerHTML = '<p class="message">Не вдалося завантажити товар.</p>';
    });
}
