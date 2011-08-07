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

var d2nagent = {
    // I wish I could put some global variables here...

    onMenuItemCommand: function(e) {
        // VARIABLES
        var ookey="";
        var atkey="";
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch)
            .getBranch("extensions.d2nagent.");

        // Oval Office
        if (prefManager.prefHasUserValue("apikeypref-oo")) {
        	ookey = prefManager.getCharPref("apikeypref-oo");
        } else {
            ookey = d2nagent.getkey("http://www.die2nite.com/disclaimer?id=10");
            d2nagent.logger("Oval Office returned the key: " + ookey);
            prefManager.setCharPref("apikeypref-oo", ookey);
        }
        d2nagent.submitxhr("http://d2n.sindevel.com/oo/upd.php", "key=" + ookey, "Oval Office", "The Oval Office map has been updated.");

        // Atlas
        if (prefManager.prefHasUserValue("apikeypref-at")) {
            var atkey = prefManager.getCharPref("apikeypref-at");
        } else {
            atkey = d2nagent.getkey("http://www.die2nite.com/disclaimer?id=12");
            d2nagent.logger("Atlas returned the key: " + atkey);
            prefManager.setCharPref("apikeypref-at", atkey);
        }
        d2nagent.submitxhr("http://atlas.wonderfulfailure.com/scripts/updater.php", "key=" + atkey, "Atlas", "1");

    },

    onToolbarButtonCommand: function(e) {
        if (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') == null) {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
            promptService.alert(null, "D2N Map Agent", "This button is for The World Beyond on die2nite.com!");
        }
        else {
            d2nagent.onMenuItemCommand();
        }
    },

    submitxhr: function(address, data, webname, succeedstring) {
    // example: ("http://atlas.wonderfulfailure.com/scripts/updater.php", ??, "Atlas" "1")

        var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

        var xhr = new XMLHttpRequest();
		xhr.open("POST", address, true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Content-length", data.length);
		xhr.setRequestHeader("Connection", "close");
		xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (xhr.responseText == succeedstring) { 
                        promptService.alert(null, "D2N Map Agent", webname + " is updated!");
                    } else { 
                        promptService.alert(null, "D2N Map Agent", webname + " was supposed to return '" + succeedstring + "' but instead returned '" + xhr.responseText + "'");
                    }
                } else {
                    promptService.alert(null, "D2N Map Agent", webname + " failed with html error: '" + xhr.status + "'");
                }
            } // no else, just keep waiting.
		}
		xhr.send(data);
    },

    getkey: function(page) {
        var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

        var key = "";
        var regex = /<input.*?name="key".*?value="([0-9a-f]+)"/ig;
        regex.lastIndex = 0;
        var xhr = new XMLHttpRequest();

        // syncronous code
        xhr.open("GET", page, false);
        d2nagent.logger("sending");
        promptService.alert(null, "D2N Map Agent", "Your Browser may freeze.\nGetting your secure key...");
        xhr.send(null);
        if(xhr.status == 200) {
            d2nagent.logger("recieved");
            var matches = regex.exec(xhr.responseText);
            key = matches[1];
            d2nagent.logger("found key: '" + key + "'.");
            return key;
        } else {
            d2nagent.logger("Error loading page\n"); 
            return "-1";
        }
/*
        // asyncronous code
        xhr.open("GET", page, false);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if(xhr.status == 200) {
                    var html = xhr.responseText;
                    var matches = regex.exec(html);
                    key = matches[1];
                    d2nagent.logger("found key: '" + key + "'.");
                    return key;
                } else {
                    d2nagent.logger("Error loading page\n"); 
                    return "-1";
                }
            }
        };
        // now we wait for it to complete
        while ( key == "" ) {
            d2nagent.logger("waiting for key to be set");

            d2nagent.logger("recovering, trying again");
        }
        d2nagent.logger("key = '" + key + "' so continuing");
        return key;
*/

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
		}, false)
    },

    showContextMenu: function() {
		document.getElementById("context-d2nagent").hidden = (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') == null);
    }

};

window.addEventListener("load", function () {
    d2nagent.onLoad();
}, false);
