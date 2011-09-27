/*
	Copyright (C) 2011 Isaac Witmer, and others.

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


var STATUS_ID = "statuslog";

var zoneState = null;

var d2nagent = {

    onMenuItemCommand: function(e) {
        d2nagent.runUpdate();
    },


    onToolbarButtonCommand: function(e) {
        if (d2nagent.disableProgram()) {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, "D2N Map Agent", "This button is for The World Beyond on die2nite.com!");
        } else {
            d2nagent.runUpdate();
        }
    },

    runUpdate: function() {
        // VARIABLES
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch)
            .getBranch("extensions.d2nagent.");

        // clear statuslog each time you submit
        d2nagent.clearstatus();
        d2nagent.checkClearKeys();
        content.document.getElementsByClassName('right')[0].addEventListener( "change", function(){
            d2nagent.logger(" '.right' has changed");
        }, false);

        // Oval Office
        if (prefManager.getCharPref("apikey-oo").length > 2 ) {
            d2nagent.submitxhr("http://d2n.sindevel.com/oo/upd.php",
                "key=" + prefManager.getCharPref("apikey-oo"), "Oval Office", "^The Oval Office map has been updated.$");
        } else {
            d2nagent.storekey("http://www.die2nite.com/disclaimer?id=10", "Oval Office", "apikey-oo");
        }
        // Atlas
        if (prefManager.getCharPref("apikey-at").length > 2 ) {
            d2nagent.submitxhr("http://atlas.wonderfulfailure.com/scripts/updater.php",
                "key=" + prefManager.getCharPref("apikey-at"), "Atlas", "^1$");
        } else {
            d2nagent.storekey("http://www.die2nite.com/disclaimer?id=12", "Atlas", "apikey-at");
        }
        // External Map
        if (prefManager.getCharPref("apikey-em").length > 2 ) {
            d2nagent.submitxhr("http://d2nextmap.metaemployee.com/index.php?r=site/update",
                "key=" + prefManager.getCharPref("apikey-em"), "External Map", "^1$");
        } else {
            d2nagent.storekey("http://www.die2nite.com/disclaimer?id=15", "External Map", "apikey-em");
        }
        // Dusk till Dawn
        if (prefManager.getCharPref("apikey-dd").length > 2 ) {
            d2nagent.submitxhr("http://d2n.duskdawn.net/zone?action=UPDATE_ZONE",
                "key=" + prefManager.getCharPref("apikey-dd"), "Dusk till Dawn", ".*");
        } else {
            d2nagent.storekey("http://www.die2nite.com/disclaimer?id=14", "Dusk till Dawn", "apikey-dd");
        }
    },

    initstatus: function(id) {
        if (content.document.getElementById(id) == null) {
            var newNode = content.document.createElement("div");
            newNode.id = id;
            var refNode = content.document.getElementById("mapTips");
            refNode.parentNode.appendChild(newNode);
        }
        return content.document.getElementById(id);
    },

    setstatus: function(status) {
        if (d2nagent.disableProgram()) {
            return false;
        }
        var logNode = d2nagent.initstatus(STATUS_ID);

        var newEntry = content.document.createElement("p");
        newEntry.className = "entry";
        newEntry.textContent = status;

        logNode.appendChild(newEntry);
    },

    clearstatus: function() {
        var logNode = d2nagent.initstatus(STATUS_ID);
        logNode.textContent = "";
    },

    submitxhr: function(address, data, webname, rgxString) {
    // example: ("http://atlas.wonderfulfailure.com/scripts/updater.php", ??, "Atlas" "1")

        var tstSuccess = new RegExp(rgxString);

        var xhr = new XMLHttpRequest();
		xhr.open("POST", address, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Content-length", data.length);
		xhr.setRequestHeader("Connection", "close");
		xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (tstSuccess.test(xhr.responseText)) {
                        d2nagent.setstatus(webname + " is updated!");
                    } else {
                        d2nagent.setstatus(webname + " did not return the correct response.");
                    }
                } else {
                    d2nagent.setstatus(webname + " failed with html error: '" + xhr.status + "'");
                }
            } // just keep waiting.
		}
		xhr.send(data);
    },

    storekey: function(address, webname, prefLoc) {
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch)
            .getBranch("extensions.d2nagent.");

        var regex = /<input.*?name="key".*?value="([0-9a-f]+)"/ig;
        regex.lastIndex = 0;
        var xhr = new XMLHttpRequest();

        // syncronous code
        xhr.open("GET", address, true);
        d2nagent.setstatus("Requesting '" + webname + "' key ... please wait till it's retrieved.");
		xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if(xhr.status == 200) {
//               d2nagent.setstatus(webname + "'s key page has been retreived, and contains match = " + regex.test(xhr.responseText));
                    var matches = regex.exec(xhr.responseText);
                    prefManager.setCharPref(prefLoc, matches[1]);
                    d2nagent.setstatus("Success: " + webname + " key found. It will be used next time you update.");
                } else {
                    d2nagent.setstatus("Failure: Could not find the key for " + webname + ".");
                }
            }
        }
        xhr.send(null);
    },

    logger: function(aMessage) {
        var debugging = true;
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                        .getService(Components.interfaces.nsIConsoleService);
        if (debugging) {
            consoleService.logStringMessage("d2nA[dbg]:\n" + aMessage);
        }
    },

    onLoad: function() {
        // initialization code
        this.initialized = true;
	    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function (e) {
			d2nagent.showContextMenu();
		}, false);
    },

    showContextMenu: function() {
		document.getElementById("context-d2nagent").hidden = d2nagent.disableProgram();
    },

    disableProgram: function() { // returns true (disable the program!) if you're not outside
        return (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') == null);
    },

    checkClearKeys: function() {
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch)
            .getBranch("extensions.d2nagent.");

        if (prefManager.getBoolPref("clearkeys")) {
            d2nagent.setstatus("Clearing your keys, and fetching new ones as requested.");
            prefManager.setCharPref("apikey-oo", "");
            prefManager.setCharPref("apikey-at", "");
            prefManager.setCharPref("apikey-em", "");
            prefManager.setCharPref("apikey-dd", "");
            prefManager.setBoolPref("clearkeys", false);
        }
    }

};

window.addEventListener("load", function () {
    d2nagent.onLoad();
}, false);
