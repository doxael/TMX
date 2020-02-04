/*****************************************************************************
Copyright (c) 2018-2020 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

const { ipcRenderer } = require('electron');

var languages;
var fileLoaded: boolean = false;

var currentPage: number = 0;
var maxPage: number = 0;
var unitsPage: number = 200;
var unitsCount: number;

var currentId: string = null;
var currentLang: string = null;
var currentCell: Element = null;
var currentContent: string = null;
var currentTags: string[] = [];
var textArea: HTMLTextAreaElement = null;

function openFile(): void {
    ipcRenderer.send('open-file');
}

function newFile(): void {
    ipcRenderer.send('new-file');
}

function saveFile(): void {
    ipcRenderer.send('save-file');
}

function showFileInfo(): void {
    ipcRenderer.send('show-file-info');
}

function saveEdit(): void {
    if (!fileLoaded) {
        return;
    }
    if (textArea !== null) {
        if (currentContent === textArea.value) {
            cancelEdit();
            return;
        }
        let edited: string = restoretags(textArea.value, currentTags);
        currentCell.innerHTML = edited;
        ipcRenderer.send('save-data', { command: 'saveTuvData', id: currentId, lang: currentLang, data: edited });
    }
}

ipcRenderer.on('save-edit', () => {
    saveEdit();
});


ipcRenderer.on('data-saved', (event, arg) => {
    var tr: HTMLElement = document.getElementById(arg.id);
    var children: HTMLCollection = tr.children;
    for (let i = 0; i < children.length; i++) {
        var td: HTMLElement = children.item(i) as HTMLElement;
        if (td.lang === arg.lang) {
            td.innerHTML = arg.data;
            break;
        }
    }
});

function cancelEdit(): void {
    if (!fileLoaded) {
        return;
    }
    currentCell.innerHTML = currentContent;
    textArea = null;
}

ipcRenderer.on('cancel-edit', () => {
    cancelEdit();
});

function replaceText(): void {
    ipcRenderer.send('replace-text');
}

function insertUnit(): void {
    // TODO
}

function deleteUnits(): void {
    // TODO
}

function sortUnits(): void {
    // TODO
}

function filterUnits(): void {
    ipcRenderer.send('filter-units');
}

function convertCSV(): void {
    ipcRenderer.send('convert-csv');
}

function sendFeedback(): void {
    ipcRenderer.send('send-feedback');
}

function openHelp(): void {
    ipcRenderer.send('show-help');
}

function editAttributes(): void {
    // TODO
}

function editProperties(): void {
    // TODO
}

function editNotes(): void {
    // TODO
}

ipcRenderer.on('start-waiting', () => {
    document.getElementById('body').classList.add("wait");
});

ipcRenderer.on('end-waiting', () => {
    document.getElementById('body').classList.remove("wait");
});

ipcRenderer.on('set-status', (event, arg) => {
    var status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
    status.innerHTML = arg;
    if (arg.length > 0) {
        status.style.display = 'block';
    } else {
        status.style.display = 'none';
    }
});

ipcRenderer.on('status-changed', (event, arg) => {
    if (arg.status === 'Success') {
        if (arg.count != undefined) {
            document.getElementById('units').innerText = arg.count;
            maxPage = Math.ceil(arg.count / unitsPage);
            document.getElementById('pages').innerText = '' + maxPage;
        }
    }
});

ipcRenderer.on('languages-changed', () => {
    ipcRenderer.send('get-languages');
});

ipcRenderer.on('update-languages', (event, arg) => {
    languages = arg;
    var row = '<tr  class="dark_background"><th class="dark_background fixed"><input type="checkbox" id="selectAll" onclick="toggleSelectAll()"></th><th class="dark_background fixed">#</th>';

    for (let index = 0; index < languages.length; ++index) {
        row = row + '<th class="dark_background">' + languages[index].code + ' - ' + arg[index].name + '</th>';
    }
    document.getElementById('tableHeader').innerHTML = row + '</tr>';
});

ipcRenderer.on('file-loaded', (event, arg) => {
    if (arg.count != undefined) {
        unitsCount = arg.count;
        document.getElementById('units').innerText = '' + unitsCount;
        maxPage = Math.ceil(unitsCount / unitsPage);
        document.getElementById('pages').innerText = '' + maxPage;
    }
    fileLoaded = true;
    firstPage();
});

ipcRenderer.on('update-segments', (event, arg) => {
    var rows: string = '';
    for (let i = 0; i < arg.units.length; i++) {
        rows = rows + arg.units[i];
    }
    document.getElementById("tableBody").innerHTML = rows;
});

ipcRenderer.on('file-closed', () => {
    document.getElementById("tableBody").innerHTML = '';
    document.getElementById("tableHeader").innerHTML = '<tr class="dark_background"><th class="fixed dark_background"><input type="checkbox" id="selectAll"></th><th class="fixed dark_background">#</th><th class="dark_background">&nbsp;</th><th class="dark_background">&nbsp;</th></tr>';
    (document.getElementById('page') as HTMLInputElement).value = '0';
    document.getElementById('pages').innerHTML = '0';
    document.getElementById('units').innerHTML = '';
    document.getElementById('attributesTable').innerHTML = '';
    document.getElementById('propertiesTable').innerHTML = '';
    document.getElementById('notesTable').innerHTML = '';
    currentPage = 0;
    maxPage = 0;
    fileLoaded = false;
});

document.getElementById('mainTable').addEventListener('click', (event) => {
    if (!fileLoaded) {
        return;
    }
    // TODO handle top checkbox for select all
    var x: string = (event.target as Element).tagName;
    if ('TEXTAREA' === x) {
        // already editing
        return;
    }
    var id: string;
    var lang: string;
    if ('TD' === x || 'INPUT' === x) {
        var composed = event.composedPath();
        if ('TR' === (composed[0] as Element).tagName) {
            id = (composed[0] as Element).id;
        } else if ('TR' === (composed[1] as Element).tagName) {
            id = (composed[1] as Element).id;
        } else if ('TR' === (composed[2] as Element).tagName) {
            id = (composed[2] as Element).id;
        }
        lang = (event.target as Element).getAttribute('lang');
        console.log('clicked ' + id + ' ' + lang);
    }
    if (textArea !== null && (currentId !== id || currentLang !== lang)) {
        saveEdit();
    }

    if (id !== null) {
        currentId = id;
        if (currentCell != null) {
            currentCell.innerHTML = currentContent;
            currentCell = null;
            currentContent = null;
        }
        if (lang !== null) {
            currentLang = lang;
            currentCell = (event.target as Element);
            currentContent = currentCell.innerHTML;
            textArea = document.createElement('textarea');
            textArea.setAttribute('style', 'height: ' + (currentCell.clientHeight - 8) + 'px; width: ' + (currentCell.clientWidth - 8) + 'px;')
            textArea.innerHTML = cleanTags(currentContent);
            currentCell.innerHTML = '';
            currentCell.parentElement.style.padding = '0px';
            currentCell.appendChild(textArea);
            textArea.focus();
            ipcRenderer.send('get-cell-properties', { id: currentId, lang: currentLang });
        } else {
            ipcRenderer.send('get-row-properties', { id: currentId });
        }
    }
});

ipcRenderer.on('update-properties', (event, arg) => {
    document.getElementById('attributesSpan').innerHTML = arg.type;
    var table = document.getElementById('attributesTable');
    table.innerHTML = '';
    var attributes = arg.attributes;
    for (let i = 0; i < attributes.length; i++) {
        let pair = attributes[i];
        let tr = document.createElement('tr');
        table.appendChild(tr);
        let left = document.createElement('td');
        left.textContent = pair[0];
        tr.appendChild(left);
        let right = document.createElement('td');
        right.textContent = pair[1];
        right.className = 'noWrap';
        tr.appendChild(right);
    }

    document.getElementById('propertiesSpan').innerHTML = arg.type;
    table = document.getElementById('propertiesTable');
    table.innerHTML = '';
    var properties = arg.properties;
    for (let i = 0; i < properties.length; i++) {
        let pair = properties[i];
        let tr = document.createElement('tr');
        table.appendChild(tr);
        let left = document.createElement('td');
        left.textContent = pair[0];
        tr.appendChild(left);
        let right = document.createElement('td');
        right.textContent = pair[1];
        right.className = 'noWrap';
        tr.appendChild(right);
    }

    document.getElementById('notesSpan').innerHTML = arg.type;
    table = document.getElementById('notesTable');
    table.innerHTML = '';
    var notes = arg.notes;
    for (let i = 0; i < properties.length; i++) {
        let tr = document.createElement('tr');
        table.appendChild(tr);
        let note = document.createElement('td');
        note.textContent = notes[i];
        tr.appendChild(note);
    }
});

function getSegments(): void {
    ipcRenderer.send('get-segments', {
        start: currentPage * unitsPage,
        count: unitsPage
    });
}

function firstPage(): void {
    currentPage = 0;
    (document.getElementById('page') as HTMLInputElement).value = '1';
    getSegments();
}

ipcRenderer.on('first-page', () => {
    firstPage();
});

function previousPage(): void {
    if (currentPage > 0) {
        currentPage--;
        (document.getElementById('page') as HTMLInputElement).value = '' + (currentPage + 1);
        getSegments();
    }
}

ipcRenderer.on('previous-page', () => {
    previousPage();
});

function nextPage(): void {
    if (currentPage < maxPage - 1) {
        currentPage++;
        (document.getElementById('page') as HTMLInputElement).value = '' + (currentPage + 1);
        getSegments();
    }
}

ipcRenderer.on('next-page', () => {
    nextPage();
});

function lastPage(): void {
    currentPage = maxPage - 1;
    (document.getElementById('page') as HTMLInputElement).value = '' + maxPage;
    getSegments();
}

ipcRenderer.on('last-page', () => {
    lastPage();
});

(document.getElementById('units_page') as HTMLInputElement).addEventListener('keydown', (ev: KeyboardEvent) => {
    if (!fileLoaded) {
        return;
    }
    if (ev.keyCode == 13) {
        unitsPage = Number.parseInt((document.getElementById('units_page') as HTMLInputElement).value);
        if (unitsPage < 1) {
            unitsPage = 1;
        }
        if (unitsPage > unitsCount) {
            unitsPage = unitsCount;
        }
        (document.getElementById('units_page') as HTMLInputElement).value = '' + unitsPage;
        maxPage = Math.ceil(unitsCount / unitsPage);
        document.getElementById('pages').innerText = '' + maxPage;
        firstPage();
    }
});

(document.getElementById('page') as HTMLInputElement).addEventListener('keydown', (ev: KeyboardEvent) => {
    if (!fileLoaded) {
        return;
    }
    if (ev.keyCode == 13) {
        currentPage = Number.parseInt((document.getElementById('page') as HTMLInputElement).value) - 1;
        if (currentPage < 0) {
            currentPage = 0;
        }
        if (currentPage > maxPage - 1) {
            currentPage = maxPage - 1;
        }
        (document.getElementById('page') as HTMLInputElement).value = '' + (currentPage + 1);
        getSegments();
    }
});

function cleanTags(unit: string): string {
    var index: number = unit.indexOf('<img ');
    var tagNumber: number = 1;
    currentTags = [];
    while (index >= 0) {
        let start: string = unit.slice(0, index);
        let rest: string = unit.slice(index + 1);
        let end: number = rest.indexOf('>');
        let tag: string = '<' + rest.slice(0, end) + '/>';
        currentTags.push(tag);
        unit = start + '[[' + tagNumber++ + ']]' + rest.slice(end + 1);
        index = unit.indexOf('<img ');
    }
    return unit;
}

function restoretags(text: string, originalTags: string[]): string {
    for (let i: number = 0; i < originalTags.length; i++) {
        text = text.replace('[[' + (i + 1) + ']]', originalTags[i]);
    }
    return text;
}

function toggleSelectAll(): void {
    // TODO
}