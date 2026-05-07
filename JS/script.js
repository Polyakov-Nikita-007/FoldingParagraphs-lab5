/**
 * Получает значение из textarea по id.
 * @param {string} type - id поля.
 * @returns {string} Введённый текст.
 */
function typeValue(type){
    return document.getElementById(type).value || '';
}

/**
 * Ищет ближайший открывающий или закрывающий тег.
 * @param {string} text - Исходный текст.
 * @param {string} openTag - Открывающий тег.
 * @param {string} closeTag - Закрывающий тег.
 * @param {number} pos - Позиция начала поиска.
 * @returns {{type: string, idx: number} | null} Объект с типом тега и 
 * индексом или null.
 */
function findNextTag(text, openTag, closeTag, pos) {
    const OPEN_IDX = text.indexOf(openTag, pos);
    const CLOSE_IDX = text.indexOf(closeTag, pos);
    if (OPEN_IDX === -1 && CLOSE_IDX === -1) return null;
    if (OPEN_IDX === -1) return { type: 'close', idx: CLOSE_IDX };
    if (CLOSE_IDX === -1) return { type: 'open', idx: OPEN_IDX };
    return OPEN_IDX < CLOSE_IDX 
        ? { type: 'open', idx: OPEN_IDX } 
        : { type: 'close', idx: CLOSE_IDX };
}

/**
 * Парсит текст с поддержкой вложенных <region>.
 * @param {string} text - Исходный текст.
 * @returns {Array} Дерево узлов.
 */
function regionsFromText(text) {
    const ROOT = { type: 'root', children: [] };
    const STACK = [ROOT];
    const OPEN_TAG = '<region>';
    const CLOSE_TAG = '</region>';
    let pos = 0;
    let regionIdx = 0;
    while (pos < text.length) {
        const NEXT_TAG = findNextTag(text, OPEN_TAG, CLOSE_TAG, pos);
        if (!NEXT_TAG) {
            const REST = text.slice(pos).trim();
            if (REST) STACK[STACK.length - 1].children.push({ type: 'text',
                value: REST });
            break;
        }
        if (NEXT_TAG.idx > pos) {
            const BETWEEN = text.slice(pos, NEXT_TAG.idx).trim();
            if (BETWEEN) STACK[STACK.length - 1].children.push({ type: 'text', 
               value: BETWEEN });
        }
        if (NEXT_TAG.type === 'open') {
            const NEW_REGION = { type: 'region', id: `region-${regionIdx++}`, 
               children: [] };
            STACK[STACK.length - 1].children.push(NEW_REGION);
            STACK.push(NEW_REGION);
            pos = NEXT_TAG.idx + OPEN_TAG.length;
        } else {
            if (STACK.length > 1) STACK.pop();
            pos = NEXT_TAG.idx + CLOSE_TAG.length;
        }
    }
    return ROOT.children;
}

/**
 * Преобразует массив распарсенных элементов в HTML.
 * @param {Array} parts - Массив распарсенных объектов.
 * @returns {string} Готовая HTML-строка для вставки в DOM.
 */
function HTMLFromRegions(parts) {
    function renderNodes(nodes) {
        let html = '';
        for (const NODE of nodes) {
            const SAFE = (NODE.value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            if (NODE.type === 'text') {
                html += `<p class="text-fragment">${SAFE}</p>`;
            } else if (NODE.type === 'region') {
                html += `
                    <div class="accordion-item">
                        <button class="accordion-toggle" type="button" 
                        aria-expanded="false" aria-controls="${NODE.id}">
                            <span class="toggle-icon">▼</span>
                            <span class="toggle-text">Показать блок</span>
                        </button>
                        <div id="${NODE.id}" class="accordion-content" 
                        role="region" hidden>
                            ${renderNodes(NODE.children)}
                        </div>
                    </div>`;
            }
        }
        return html;
    }
    return renderNodes(parts);
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
        const CONTENT = BUTTON.next('.accordion-content');
        const IS_EXPANDED = BUTTON.attr('aria-expanded') === 'true';
        if (!IS_EXPANDED) {
            BUTTON.addClass('active')
                  .attr('aria-expanded', 'true')
                  .find('.toggle-text').text('Скрыть блок');
            CONTENT.stop(true, true).slideDown('fast').removeAttr('hidden');
        } else {
            BUTTON.removeClass('active')
                  .attr('aria-expanded', 'false')
                  .find('.toggle-text').text('Показать блок');
            CONTENT.stop(true, true).slideUp('fast').attr('hidden', true);
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