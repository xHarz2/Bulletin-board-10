// Фреймворк: Vue 3 (через CDN). Обрано Vue, бо він підключається одним тегом <script>
// і не потребує Babel для JSX, а шаблони схожі на звичайний HTML.

// Адреса API з оголошеннями (JSONPlaceholder, мок-дані)
const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=3';

const DESCRIPTION_MAX = 200;

// Функцію renderAds() з практичної №7 видалено: список тепер рендерить
// компонент AdCard через v-for, без createElement та innerHTML.

// Компонент картки оголошення
const AdCard = {
    props: {
        title: String,
        category: String,
        description: String,
        daysAgo: Number
    },
    data() {
        // Локальний прапорець: чи розгорнуто опис
        return { expanded: false };
    },
    computed: {
        // Заголовок, скорочений до 30 символів
        shortTitle() {
            return this.title.length > 30 ? this.title.slice(0, 30) + '...' : this.title;
        },
        // Клас бейджа залежно від категорії
        badgeClass() {
            const classes = {
                'Речі': 'badge-items',
                'Послуги': 'badge-services',
                'Тварини': 'badge-animals',
                'З мережі': 'badge-online'
            };
            return classes[this.category] || '';
        },
        imgSrc() {
            const imgText = this.title.split(' ')[0];
            return `https://placehold.co/400x200/EEE/31343C?text=${imgText}`;
        }
    },
    template: `
        <article class="card" :class="{ outdated: daysAgo > 14 }">
            <span class="badge" :class="badgeClass">{{ category }}</span>
            <h3>{{ shortTitle }}</h3>
            <img :src="imgSrc" :alt="title">

            <button v-if="description" type="button" class="btn-details" @click="expanded = !expanded">
                {{ expanded ? 'Сховати деталі' : 'Показати деталі' }}
            </button>
            <p v-if="expanded" class="card-description">{{ description }}</p>

            <p v-if="daysAgo !== undefined">Опубліковано днів тому: {{ daysAgo }}</p>
        </article>
    `
};

// Головний застосунок: стан списку, завантаження з API, лічильник
const app = Vue.createApp({
    components: { AdCard },
    data() {
        return {
            ads: [],
            loading: false,
            errorMessage: ''
        };
    },
    computed: {
        // Кількість активних оголошень перераховується автоматично
        activeCount() {
            return this.ads.filter(ad => !(ad.daysAgo > 14)).length;
        }
    },
    methods: {
        // Завантаження оголошень з API JSONPlaceholder (як у практичній №9)
        async loadData() {
            this.loading = true;
            this.errorMessage = '';

            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Сервер відповів кодом ${response.status}`);
                }
                const data = await response.json();

                const apiAds = data.map(post => ({
                    id: post.id,
                    title: post.title,
                    category: 'З мережі',
                    description: post.body
                }));

                // Оголошення, додані через форму, лишаємо в списку
                const userAds = this.ads.filter(ad => ad.fromForm);
                this.ads = [...apiAds, ...userAds];
            } catch (error) {
                this.errorMessage = 'Оголошення тимчасово недоступні. Спробуйте пізніше.';
                console.error('Помилка завантаження оголошень:', error);
            } finally {
                this.loading = false;
            }
        },
        // Додає оголошення з форми у реактивний масив
        addAd(ad) {
            this.ads.push({ ...ad, id: Date.now(), fromForm: true });
        }
    },
    mounted() {
        this.loadData();
    },
    template: `
        <div class="list-controls">
            <button type="button" class="btn-reload" :disabled="loading" @click="loadData">Оновити</button>
            <p class="load-status" :class="{ error: errorMessage }" role="status">
                {{ loading ? 'Завантаження...' : errorMessage }}
            </p>
        </div>

        <p id="listings-count">Активних оголошень: {{ activeCount }}</p>

        <div class="cards-grid">
            <ad-card
                v-for="ad in ads"
                :key="ad.id"
                :title="ad.title"
                :category="ad.category"
                :description="ad.description"
                :days-ago="ad.daysAgo"
            ></ad-card>
        </div>
    `
});

const adsApp = app.mount('#ads-app');

// ----- Форма додавання (з практичної №8) -----

const form = document.querySelector('#add-ad-form');
const titleInput = document.querySelector('#ad-title');
const categorySelect = document.querySelector('#ad-category');
const descriptionInput = document.querySelector('#ad-description');
const counterElement = document.querySelector('#description-counter');
const toggleFormBtn = document.querySelector('#toggle-form-btn');

// Оновлює лічильник символів, що залишилися в описі
function updateCounter() {
    const left = DESCRIPTION_MAX - descriptionInput.value.length;
    counterElement.textContent = `Залишилось символів: ${left}`;
}

// Клік на "Додати оголошення" - показує або ховає форму
toggleFormBtn.addEventListener('click', () => {
    form.classList.toggle('visible');

    if (form.classList.contains('visible')) {
        toggleFormBtn.textContent = 'Сховати форму';
        form.scrollIntoView({ behavior: 'smooth' });
        titleInput.focus();
    } else {
        toggleFormBtn.textContent = 'Додати оголошення';
    }
});

// Лічильник символів оновлюється на кожне натискання клавіші
descriptionInput.addEventListener('input', updateCounter);

// Заголовок не може складатися лише з пробілів
titleInput.addEventListener('input', () => {
    if (titleInput.value !== '' && titleInput.value.trim() === '') {
        titleInput.setCustomValidity('Заголовок не може складатися лише з пробілів');
    } else {
        titleInput.setCustomValidity('');
    }
});

// Надсилання форми: нове оголошення передаємо у стан Vue, список оновиться сам
form.addEventListener('submit', event => {
    event.preventDefault();

    adsApp.addAd({
        title: titleInput.value.trim(),
        category: categorySelect.value,
        description: descriptionInput.value.trim(),
        daysAgo: 0
    });

    form.reset();
    updateCounter();
});
