class Chat {
    constructor() {
        this.ws = null;
        this.init();
    }

    init() {
        // Элементы интерфейса
        this.messagesArea = document.getElementById('messagesArea');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.geolocationButton = document.getElementById('geolocationButton');

        // Инициализация WebSocket
        this.connectWebSocket();

        // Обработчики событий
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.geolocationButton.addEventListener('click', () => this.sendGeolocation());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    connectWebSocket() {
        this.ws = new WebSocket('wss://echo-ws-service.herokuapp.com');

        this.ws.onopen = () => {
            this.addMessage('Система', 'Подключение к эхо‑серверу установлено', 'system');
        };

        this.ws.onmessage = (event) => {
            // Для геолокации мы не показываем ответ сервера
            if (!this.isGeolocationMessage) {
                this.addMessage('Сервер', event.data, 'server-message');
            }
            this.isGeolocationMessage = false;
        };

        this.ws.onclose = () => {
            this.addMessage('Система', 'Соединение с сервером закрыто', 'system');
        };

        this.ws.onerror = () => {
            this.addMessage('Система', 'Ошибка соединения с сервером', 'system');
        };
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Отправляем сообщение серверу
        this.ws.send(message);

        // Показываем сообщение в чате
        this.addMessage('Вы', message, 'user-message');

        // Очищаем поле ввода
        this.messageInput.value = '';
    }

    sendGeolocation() {
        if (!navigator.geolocation) {
            alert('Геолокация не поддерживается вашим браузером');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;

                // Помечаем, что следующее сообщение — геолокация
                this.isGeolocationMessage = true;

                // Отправляем координаты серверу (в виде строки)
                this.ws.send(`Геолокация: ${latitude}, ${longitude}`);

                // Показываем ссылку в чате
                this.addMessage(
                    'Вы',
                    `<a href="${url}" target="_blank" style="color: white;">📍 Ваша геолокация</a>`,
                    'geolocation-message'
                );
            },
            (error) => {
                console.error('Ошибка получения геолокации:', error);
                alert('Не удалось получить геолокацию. Проверьте настройки браузера.');
            }
        );
    }

    addMessage(sender, text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;

        const senderSpan = document.createElement('span');
        senderSpan.style.fontWeight = 'bold';
        senderSpan.style.marginBottom = '5px';
        senderSpan.textContent = `${sender}:`;

        const textDiv = document.createElement('div');
        textDiv.innerHTML = text;

        messageDiv.appendChild(senderSpan);
        messageDiv.appendChild(textDiv);
        this.messagesArea.appendChild(messageDiv);

        // Прокручиваем вниз к последнему сообщению
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
}

// Инициализируем чат при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Chat();
});

