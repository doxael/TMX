"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Locations = exports.Point = void 0;
const fs_1 = require("fs");
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
exports.Point = Point;
class Locations {
    constructor(file) {
        this.file = file;
        this.locations = new Map();
        if ((0, fs_1.existsSync)(file)) {
            try {
                let data = (0, fs_1.readFileSync)(file);
                let json = JSON.parse(data.toString());
                for (const [key, value] of Object.entries(json)) {
                    this.locations.set(key, new Point(value.x, value.y));
                }
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    hasLocation(window) {
        return this.locations.has(window);
    }
    setLocation(window, x, y) {
        let point = new Point(x, y);
        this.locations.set(window, point);
        let text = '{';
        this.locations.forEach((value, key) => {
            text = text + '\"' + key + '\": {\"x\":' + value.x + ', \"y\":' + value.y + '},';
        });
        text = text.substr(0, text.length - 1) + '}';
        let json = JSON.parse(text);
        (0, fs_1.writeFile)(this.file, JSON.stringify(json), (err) => {
            if (err)
                throw err;
        });
    }
    getLocation(window) {
        if (this.locations.has(window)) {
            return this.locations.get(window);
        }
        return null;
    }
}
exports.Locations = Locations;
