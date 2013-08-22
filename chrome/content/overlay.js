/*globals Components, content, XMLHttpRequest, document, window */
/*
    Copyright (C) 2011 Isaac Witmer

    This file is part of D2N Agent.

    D2N Agent is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

var d2nagent = {
    onMenuItemCommand: function (e) {
        "use strict";
        d2nagent.runUpdate();
    },


    onToolbarButtonCommand: function (e) {
        "use strict";
        if (d2nagent.disableProgram()) {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, "D2N Map Agent",
                "This button is for The World Beyond on die2nite.com!");
        } else {
            d2nagent.runUpdate();
        }
    },

    runUpdate: function () {
        // User triggered an update.
        "use strict";
        var prefManager, i, map, key, enabled, MAPS = [
            {
                'fname':    "Dusk till Dawn",
                'code':     "dd",
                'url':      "http://d2n.duskdawn.net/zone?action=UPDATE_ZONE",
                'dataval':  "key=",
                'success':  ".*", // TODO: we should be able to do better than this.
                'id':       14
            },
            {
                'fname':    "Map Viewer",
                'code':     "mv",
                'url':      "http://die2nite.gamerz.org.uk/plugin",
                'dataval':  "key=",
                'success':  "^Zone .* was updated successfully$",
                'id':       1
            }
        ];
        prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getBranch("extensions.d2nagent.");


        d2nagent.clearstatus();

        // If Keys should be cleared, clear them.
        if (prefManager.getBoolPref("clearkeys")) {
            d2nagent.setstatus("Clearing your keys, and fetching new ones as requested.");
            for (i = 0; i < MAPS.length; i = i + 1) {
                map = MAPS[i];
                d2nagent.logger('clearing key for ' + map.fname);
                prefManager.setCharPref('apikey-' + map.code, "");
            }
            prefManager.setBoolPref("clearkeys", false);
        }

        for (i = 0; i < MAPS.length; i = i + 1) {
            map = MAPS[i];
            key = prefManager.getCharPref('apikey-' + map.code);
            enabled = prefManager.getBoolPref('enable-' + map.code);
            if (enabled) {
                if (key.length > 2) {
                    d2nagent.submitUpdate(map, map.dataval + key);
                } else {
                    d2nagent.storekey(map);
                }
            }
        }
    },

    initstatus: function (id) {
        "use strict";
        var newNode, refNode;
        if (content.document.getElementById(id) === null) {
            newNode = content.document.createElement("div");
            refNode = content.document.getElementById("mapTips");
            newNode.id = id;
            refNode.parentNode.appendChild(newNode);
        }
        return content.document.getElementById(id);
    },

    setstatus: function (status) {
        // update the user status
        "use strict";
        var logNode, newEntry;
        if (d2nagent.disableProgram()) {
            return false;
        }

        logNode = d2nagent.initstatus("statuslog");
        newEntry = content.document.createElement("p");

        newEntry.className = "entry";
        newEntry.textContent = status;

        logNode.appendChild(newEntry);
    },

    clearstatus: function () {
        "use strict";
        var logNode = d2nagent.initstatus("statuslog");
        logNode.textContent = "";
    },

    submitUpdate: function (map, data) {
        // perform an update
        "use strict";
        var tstSuccess = new RegExp(map.success),
            xhr = new XMLHttpRequest();

        xhr.open("POST", map.url, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Content-length", data.length);
        xhr.setRequestHeader("Connection", "close");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (tstSuccess.test(xhr.responseText)) {
                        d2nagent.setstatus(map.fname + " is updated!");
                    } else {
                        d2nagent.setstatus(map.fname +
                                        " did not return the correct response.");
                    }
                } else {
                    d2nagent.setstatus(map.fname +
                                " failed, http error: '" + xhr.status + "'");
                }
            } // just keep waiting.
        };
        xhr.send(data);
    },

    storekey: function (map) {
        // retrieve and store the key of an application
        "use strict";
        var xhr, matches, regex, prefManager;

        prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getBranch("extensions.d2nagent.");

        regex = /<input.*?name="key".*?value="([0-9a-f]+)"/ig;
        regex.lastIndex = 0;

        xhr = new XMLHttpRequest();
        xhr.open("GET", "http://www.die2nite.com/disclaimer?id=" + map.id, true);
        d2nagent.setstatus("Requesting '" + map.fname + "' key ... please wait.");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    matches = regex.exec(xhr.responseText);
                    d2nagent.logger('matches = ' + matches);
                    if (matches === null || matches[1] === null) {
                        d2nagent.setstatus("Failure: could not find " + map.fname + " key.");
                    } else {
                        prefManager.setCharPref('apikey-' + map.code, matches[1]);
                        d2nagent.setstatus("Success: '" + map.fname + "' key found.");
                    }
                } else {
                    d2nagent.setstatus("Failure: http error: '" + xhr.status + "' while getting key for " + map.fname + ".");
                }
            }
        };
        xhr.send();
    },

    logger: function (aMessage) {
        // debug logger
        "use strict";
        var prefManager, debugging, consoleService;
        prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getBranch("extensions.d2nagent.");
        debugging = prefManager.getBoolPref('debug');
        if (debugging) {
            consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage("d2nA[dbg]:\n" + aMessage);
        }
    },

    onLoad: function () {
        "use strict";
        // initialization code
        this.initialized = true;
        document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function (e) {
            d2nagent.showContextMenu();
        }, false);
    },

    showContextMenu: function () {
        "use strict";
        document.getElementById("context-d2nagent").hidden = d2nagent.disableProgram();
    },

    disableProgram: function () { // returns true (disable the program!) if you're not outside
        "use strict";
        return (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') === null);
    }
};

window.addEventListener("load", function () {
    "use strict";
    d2nagent.onLoad();
}, false);
