/**
 * Material Design Utilities для Chrome AI Extension
 * Утилиты для работы с Material Design компонентами
 */

class MaterialDesignUtils {
    /**
     * Показать toast уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип уведомления (success, error, warning, info)
     * @param {number} duration - Длительность показа в миллисекундах (по умолчанию 3000)
     */
    static showToast(message, type = 'info', duration = 3000) {
        // Создаем или находим контейнер для toast
        let container = document.querySelector('.md-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'md-toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `md-toast md-toast--${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <span class="md-toast-icon">${icon}</span>
            <span class="md-toast-message">${message}</span>
            <button class="md-toast-close">×</button>
        `;
        
        // Добавляем обработчик клика для кнопки закрытия
        const closeButton = toast.querySelector('.md-toast-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                MaterialDesignUtils.removeToast(toast);
            });
        }
        
        container.appendChild(toast);
        
        // Автоматическое удаление
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        return toast;
    }
    
    /**
     * Получить иконку для toast
     * @param {string} type - Тип уведомления
     * @returns {string} HTML иконки
     */
    static getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Удалить toast уведомление
     * @param {HTMLElement} toast - Элемент toast
     */
    static removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                    
                    // Если контейнер пустой, удаляем его
                    const container = document.querySelector('.md-toast-container');
                    if (container && container.children.length === 0) {
                        container.remove();
                    }
                }
            }, 300);
        }
    }
    
    /**
     * Удалить все toast уведомления
     */
    static removeToasts() {
        const toasts = document.querySelectorAll('.md-toast');
        toasts.forEach(toast => this.removeToast(toast));
    }
    
    /**
     * Показать loading состояние
     * @param {HTMLElement} element - Элемент для показа loading
     * @param {string} text - Текст loading (по умолчанию "Загрузка...")
     */
    static showLoading(element, text = 'Загрузка...') {
        if (!element) return;
        
        element.dataset.originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="md-loading">
                <div class="md-spinner"></div>
                <span>${text}</span>
            </div>
        `;
        element.disabled = true;
    }
    
    /**
     * Скрыть loading состояние
     * @param {HTMLElement} element - Элемент для скрытия loading
     */
    static hideLoading(element) {
        if (!element) return;
        
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }
        element.disabled = false;
    }
    
    /**
     * Показать error состояние
     * @param {HTMLElement} container - Контейнер для показа ошибки
     * @param {string} title - Заголовок ошибки
     * @param {string} message - Сообщение об ошибке
     * @param {Function} onRetry - Функция для повторной попытки
     */
    static showError(container, title = 'Произошла ошибка', message = 'Попробуйте еще раз', onRetry = null) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="md-error-state">
                <div class="md-error-icon">⚠</div>
                <h3 class="md-error-title">${title}</h3>
                <p class="md-error-message">${message}</p>
                ${onRetry ? '<button class="md-button md-button--primary" onclick="this.parentElement.parentElement.dispatchEvent(new CustomEvent(\'retry\'))">Попробовать снова</button>' : ''}
            </div>
        `;
        
        if (onRetry) {
            container.addEventListener('retry', onRetry, { once: true });
        }
    }
    
    /**
     * Создать skeleton loading
     * @param {number} lines - Количество строк skeleton
     * @returns {string} HTML skeleton
     */
    static createSkeleton(lines = 3) {
        let skeleton = '';
        for (let i = 0; i < lines; i++) {
            const width = Math.random() * 40 + 60; // 60-100% ширина
            skeleton += `<div class="md-skeleton" style="width: ${width}%; height: 16px; margin-bottom: 8px;"></div>`;
        }
        return skeleton;
    }
    
    /**
     * Инициализировать tabs
     * @param {string} containerSelector - Селектор контейнера с tabs
     */
    static initTabs(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        
        const tabs = container.querySelectorAll('.md-tab');
        const tabContents = container.querySelectorAll('.md-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab || tab.id.replace('-tab', '');
                
                // Убираем активный класс со всех tabs
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                
                // Добавляем активный класс к выбранному tab
                tab.classList.add('active');
                const targetContent = document.getElementById(`${tabId}-content`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }
    
    /**
     * Создать анимированную кнопку
     * @param {string} text - Текст кнопки
     * @param {string} type - Тип кнопки (primary, secondary, danger)
     * @param {Function} onClick - Обработчик клика
     * @returns {HTMLElement} Элемент кнопки
     */
    static createAnimatedButton(text, type = 'primary', onClick = null) {
        const button = document.createElement('button');
        button.className = `md-button md-button--${type}`;
        button.textContent = text;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }
    
    /**
     * Создать input с Material Design стилями
     * @param {Object} options - Опции input
     * @returns {HTMLElement} Элемент input
     */
    static createInput(options = {}) {
        const {
            type = 'text',
            placeholder = '',
            label = '',
            required = false,
            error = '',
            helper = ''
        } = options;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = `md-input ${error ? 'md-input--error' : ''}`;
        
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.required = required;
        
        const labelEl = document.createElement('label');
        labelEl.className = 'md-input-label';
        labelEl.textContent = label;
        
        const helperEl = document.createElement('div');
        helperEl.className = error ? 'md-input-error' : 'md-input-helper';
        helperEl.textContent = error || helper;
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(labelEl);
        inputContainer.appendChild(helperEl);
        
        return inputContainer;
    }
    
    /**
     * Создать card с Material Design стилями
     * @param {Object} options - Опции card
     * @returns {HTMLElement} Элемент card
     */
    static createCard(options = {}) {
        const {
            title = '',
            subtitle = '',
            content = '',
            actions = []
        } = options;
        
        const card = document.createElement('div');
        card.className = 'md-card';
        
        let cardHtml = '';
        
        if (title || subtitle) {
            cardHtml += `
                <div class="md-card-header">
                    <h3 class="md-card-title">${title}</h3>
                    ${subtitle ? `<p class="md-card-subtitle">${subtitle}</p>` : ''}
                </div>
            `;
        }
        
        if (content) {
            cardHtml += `<div class="md-card-content">${content}</div>`;
        }
        
        if (actions.length > 0) {
            cardHtml += '<div class="md-card-actions">';
            actions.forEach(action => {
                cardHtml += `<button class="md-button md-button--${action.type || 'primary'}">${action.text}</button>`;
            });
            cardHtml += '</div>';
        }
        
        card.innerHTML = cardHtml;
        return card;
    }
    
    /**
     * Включить dark mode
     */
    static enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('md-theme', 'dark');
    }
    
    /**
     * Отключить dark mode
     */
    static disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('md-theme', 'light');
    }
    
    /**
     * Переключить dark mode
     */
    static toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }
    
    /**
     * Инициализировать dark mode из localStorage
     */
    static initDarkMode() {
        const savedTheme = localStorage.getItem('md-theme');
        if (savedTheme === 'dark') {
            this.enableDarkMode();
        }
    }
    
    /**
     * Добавить анимацию появления элемента
     * @param {HTMLElement} element - Элемент для анимации
     * @param {string} animation - Тип анимации (fadeIn, slideUp, scaleIn)
     */
    static animateElement(element, animation = 'fadeIn') {
        if (!element) return;
        
        element.classList.add(`md-${animation}`);
        
        // Убираем класс анимации после завершения
        element.addEventListener('animationend', () => {
            element.classList.remove(`md-${animation}`);
        }, { once: true });
    }
    
    /**
     * Создать ripple эффект при клике
     * @param {HTMLElement} button - Кнопка для ripple эффекта
     * @param {Event} event - Событие клика
     */
    static createRipple(button, event) {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
}

// Добавляем CSS для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    MaterialDesignUtils.initDarkMode();
    
    // Добавляем ripple эффект ко всем кнопкам
    document.addEventListener('click', (event) => {
        const button = event.target.closest('.md-button');
        if (button) {
            MaterialDesignUtils.createRipple(button, event);
        }
    });
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MaterialDesignUtils;
} else if (typeof window !== 'undefined') {
    window.MaterialDesignUtils = MaterialDesignUtils;
}
