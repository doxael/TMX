/*******************************************************************************
 * Copyright (c) 2018-2022 Maxprograms.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 1.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors:
 *     Maxprograms - initial API and implementation
 *******************************************************************************/
class Attributes {
    constructor() {
        this.electron = require('electron');
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event, arg) => {
            document.getElementById('theme').href = arg;
        });
        this.electron.ipcRenderer.send('get-filter-languages');
        this.electron.ipcRenderer.on('filter-languages', (event, arg) => {
            this.filterLanguages(arg);
        });
        this.electron.ipcRenderer.on('set-unit-attributes', (event, arg) => {
            this.setUnitAttributes(arg);
        });
        document.getElementById('saveAttributes').addEventListener('click', () => {
            this.saveAttributes();
        });
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                this.saveAttributes();
            }
            if (event.code === 'Escape') {
                this.electron.ipcRenderer.send('close-attributes');
            }
        });
    }
    setUnitAttributes(arg) {
        this.currentId = arg.id;
        this.currentType = arg.type;
        document.getElementById('title').innerHTML = this.currentType + ' Attributes';
        var attributes = arg.atts;
        for (let i = 0; i < attributes.length; i++) {
            var pair = attributes[i];
            if (pair[0] === 'xml:lang' || pair[0] === 'lang') {
                continue;
            }
            if (pair[0] === 'segtype') {
                document.getElementById('segtype').value = pair[1];
            }
            else if (pair[0] === 'srclang') {
                document.getElementById('srclang').value = pair[1];
            }
            else {
                document.getElementById(pair[0]).value = pair[1];
            }
        }
        if (this.currentType !== 'TU') {
            document.getElementById('topRow').style.display = 'none';
        }
        let body = document.getElementById('body');
        this.electron.ipcRenderer.send('attributes-height', { width: body.clientWidth, height: body.clientHeight });
    }
    filterLanguages(arg) {
        var language = document.getElementById('srclang');
        var options = '<option value=""></option><option value="*all*">*all*</option>';
        for (let i = 0; i < arg.length; i++) {
            let lang = arg[i];
            options = options + '<option value="' + lang.code + '">' + lang.code + '</option>';
        }
        language.innerHTML = options;
        this.electron.ipcRenderer.send('get-unit-attributes');
    }
    saveAttributes() {
        var lang = this.currentType === 'TU' ? '' : this.currentType;
        var array = [];
        var oencoding = document.getElementById('o-encoding').value;
        if (oencoding) {
            const pair = ['o-encoding', oencoding];
            array.push(pair);
        }
        var datatype = document.getElementById('datatype').value;
        if (datatype) {
            const pair = ['datatype', datatype];
            array.push(pair);
        }
        var usagecount = document.getElementById('usagecount').value;
        if (usagecount) {
            const pair = ['usagecount', usagecount];
            array.push(pair);
        }
        var lastusagedate = document.getElementById('lastusagedate').value;
        if (lastusagedate) {
            const pair = ['lastusagedate', lastusagedate];
            array.push(pair);
        }
        var creationtool = document.getElementById('creationtool').value;
        if (creationtool) {
            const pair = ['creationtool', creationtool];
            array.push(pair);
        }
        var creationtoolversion = document.getElementById('creationtoolversion').value;
        if (creationtoolversion) {
            const pair = ['creationtoolversion', creationtoolversion];
            array.push(pair);
        }
        var creationdate = document.getElementById('creationdate').value;
        if (creationdate) {
            const pair = ['creationdate', creationdate];
            array.push(pair);
        }
        var creationid = document.getElementById('creationid').value;
        if (creationid) {
            const pair = ['creationid', creationid];
            array.push(pair);
        }
        var changedate = document.getElementById('changedate').value;
        if (changedate) {
            const pair = ['changedate', changedate];
            array.push(pair);
        }
        var segtype = document.getElementById('segtype').value;
        if (segtype) {
            const pair = ['segtype', segtype];
            array.push(pair);
        }
        var changeid = document.getElementById('changeid').value;
        if (changeid) {
            const pair = ['changeid', changeid];
            array.push(pair);
        }
        var otmf = document.getElementById('o-tmf').value;
        if (otmf) {
            const pair = ['o-tmf', otmf];
            array.push(pair);
        }
        var srclang = document.getElementById('srclang').value;
        if (srclang) {
            const pair = ['srclang', srclang];
            array.push(pair);
        }
        var tuid = document.getElementById('tuid').value;
        if (tuid) {
            const pair = ['tuid', tuid];
            array.push(pair);
        }
        if (lang) {
            const pair = ['xml:lang', lang];
            array.push(pair);
        }
        var arg = {
            id: this.currentId,
            lang: lang,
            attributes: array
        };
        this.electron.ipcRenderer.send('save-attributes', arg);
    }
}
new Attributes();
