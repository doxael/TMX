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
class KeyboardHandler {
    static keyListener(event) {
        if ((event.ctrlKey || event.metaKey) && (event.key === 'x' || event.key === 'X')) {
            event.preventDefault();
            let element = event.target;
            let type = element.tagName;
            if (type === 'INPUT') {
                let input = element;
                let start = input.selectionStart;
                let end = input.selectionEnd;
                navigator.clipboard.writeText(input.value.substring(start, end));
                input.setRangeText('');
            }
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault();
            let element = event.target;
            let type = element.tagName;
            if (type === 'INPUT') {
                let input = element;
                input.setSelectionRange(0, input.value.length);
            }
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
            event.preventDefault();
            navigator.clipboard.writeText(window.getSelection().toString());
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
            event.preventDefault();
            let element = event.target;
            let type = element.tagName;
            if (type === 'INPUT') {
                navigator.clipboard.readText().then((clipText) => {
                    let input = element;
                    let currentText = input.value;
                    let start = input.selectionStart;
                    let newText = currentText.substring(0, start) + clipText + currentText.substring(start);
                    input.value = newText;
                });
            }
        }
    }
}
