/**
 * Получает значение из textarea по id.
 * @param {string} type - id поля.
 * @returns {string} Введённый текст.
 */
function typeValue(type){
    return document.getElementById(type).value || '';
}

/**
 * Парсит исходный текст на обычные фрагменты и сворачиваемые блоки.
 * @param {string} text - Исходный текст с тегами <region> и </region>.
 * @returns {Array} Массив объектов обычного текста и сворачиваемых блоков.
 */
function regionsFromText(text) {
    const RESULT = [];
    const OPEN = '<region>';
    const CLOSE = '</region>';
    let pos = 0;
    let regionIdx = 0;
    while (pos < text.length) {
        const STARTIDX = text.indexOf(OPEN, pos);
        if (STARTIDX === -1) {
            const NOREG = text.slice(pos).trim();
            if (NOREG) {
                RESULT.push({ type: 'text', value: NOREG });
            }
            break;
        }
        if (STARTIDX > pos) {
            const BEFORE = text.slice(pos, STARTIDX).trim();
            if (BEFORE) {
                RESULT.push({ type: 'text', value: BEFORE });
            }
        }
        const ENDIDX = text.indexOf(CLOSE, STARTIDX + OPEN.length);
        if (ENDIDX === -1) {
            const NOREG = text.slice(STARTIDX).trim();
            if (NOREG) RESULT.push({ type: 'text', value: NOREG });
            break;
        }
        const REGCONT = text.slice(STARTIDX + OPEN.length, ENDIDX).trim();
        if (REGCONT) {
            RESULT.push({ 
                type: 'region', 
                value: REGCONT,
                id: `region-${regionIdx++}`
            });
        }
        pos = ENDIDX + CLOSE.length;
    }
    return RESULT;
}

/**
 * Преобразует массив распарсенных элементов в HTML.
 * @param {Array} parts - Массив распарсенных объектов.
 * @returns {string} Готовая HTML-строка для вставки в DOM.
 */
function HTMLFromRegions(parts) {
    let html = '';
    for (const CONT of parts) {
        const SAFE = CONT.value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        if (CONT.type === 'text') {
            html += `<p class="text-fragment">${SAFE}</p>`;   
        } else if (CONT.type === 'region') {
            html += `
                <div class="accordion-item">
                    <button class="accordion-toggle" 
                            type="button" 
                            aria-expanded="false"
                            aria-controls="${CONT.id}"
                            data-region-id="${CONT.id}">
                        <span class="toggle-icon">▼</span>
                        <span class="toggle-text">Показать блок</span>
                    </button>
                    <div id="${CONT.id}" 
                         class="accordion-content" 
                         role="region" 
                         hidden>
                        ${SAFE}
                    </div>
                </div>`;
        }
    }
    return html;
}

/**
 * Вставляет парсированные HTML строки в контейнер .mod.
 * @param {string} text - Исходный текст от пользователя.
 * @returns {void}
 */
function parseRegions(text) {
    if (!text.trim()) {
        $(".mod").empty();
        return;
    }
    const PARTS = regionsFromText(text);
    const HTML = HTMLFromRegions(PARTS);
    $(".mod").html(HTML);
    Accordion();
}

/**
 * Инициализация и управление аккордеоном.
 * @returns {void}
 */
function Accordion() {
    const MOD = $('.mod');
    MOD.off('click.accordion').on('click.accordion', '.accordion-toggle', 
    function () {
        const BUTTON = $(this);
        const TARGID = BUTTON.attr('aria-controls');
        const CONTENT = MOD.find(`#${TARGID}`);
        const EXPANDED = BUTTON.attr('aria-expanded') === 'true';
        if (!EXPANDED) {
            BUTTON.addClass('active')
                .attr('aria-expanded', 'true')
                .find('.toggle-text').text('Скрыть блок');
            CONTENT.slideDown('fast').removeAttr('hidden');
        } else {
            BUTTON.removeClass('active')
                .attr('aria-expanded', 'false')
                .find('.toggle-text').text('Показать блок');
            CONTENT.slideUp('fast').attr('hidden', true);
        }
    });
}

/**
 * Считывает значение из поля ввода и запускает процесс парсинга и отображения.
 * @returns {void}
 */
function Form() {
    parseRegions(typeValue("user-text"));
}