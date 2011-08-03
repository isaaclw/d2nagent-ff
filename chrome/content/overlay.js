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
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch)
            .getBranch("extensions.d2nagent.");
        var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);

		if (prefManager.prefHasUserValue("apikeypref")) {
			var key = prefManager.getCharPref("apikeypref");
		}
		else {
			promptService.alert(null, "D2N Map Agent", 'Your secure API key for the die2nite map app could not be found!\n\nPlease configure it in preferences.');
			return;
		}


        var data = 'key=' + key;

        var oo_status = "";
        var at_status = "";


        // wow. awesome if statements follow.
        // also makes me want to gouge my eyes out.
        // switch to cases?
        function checkStatus(site_name, state, status, text) {
            d2nagent.logger("incoming report: " + site_name + " " + state + " " + status + " " + text + "\nPrevious: " + oo_status + " " + at_status);
            if (site_name == "oo") {
                if (state == 4) {
                    if (status == 200) {
                        oo_status = "Oval Office returned: " + text;
                    }
                    else {
                        oo_status = "Oval Office failed. Unknown reason.";
                    }
                }
            }
            if (site_name == "at") {
                if (state == 4) {
                    if (status == 200) {
                        at_status = "Atlas returned: " + text;
                    }
                    else {
                        at_status = "Atlas failed. Unknown reason.";
                    }
                }
            }
            if ( oo_status != "" && at_status != "") {
                promptService.alert(null, "D2N Map Agent", oo_status + "\n" + at_status);
            }
        }



        // NOW DO IT
        d2nagent.logger("Running function");

        // don't you just love running the same thing twice?
        // needs serious refactoring
        // maybe put both of these in a function and call the function?
		var xhro = new XMLHttpRequest();
		xhro.open("POST", "http://d2n.sindevel.com/oo/upd.php", true);
		xhro.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhro.setRequestHeader("Content-length", data.length);
		xhro.setRequestHeader("Connection", "close");
		xhro.onreadystatechange = function() {
            d2nagent.logger("Oval: state changed");
            checkStatus("oo", xhro.readyState, xhro.status, xhro.responseText);
		}
		xhro.send(data);

		var xhra = new XMLHttpRequest();
		xhra.open("POST", "http://atlas.wonderfulfailure.com/scripts/updater.php", true);
		xhra.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhra.setRequestHeader("Content-length", data.length);
		xhra.setRequestHeader("Connection", "close");
		xhra.onreadystatechange = function() {
            d2nagent.logger("Atlas: state changed");
            checkStatus("at", xhra.readyState, xhra.status, xhra.responseText);
		}
		xhra.send(data);

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

    logger: function(aMessage) {
        var debugging = false;
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                        .getService(Components.interfaces.nsIConsoleService);
        if (debugging) {
            consoleService.logStringMessage("d2nagent-debugger:\n" + aMessage);
        }
    },

    onLoad: function() {
        // initialization code
        this.initialized = true;
        d2nagent.logger("Initializing!");
	    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function (e) {
			d2nagent.showContextMenu();
		}, false)
    },

    showContextMenu: function() {
        d2nagent.logger("url: " + window.content.location.href);
        d2nagent.logger("isOutside: " + window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh'));
        d2nagent.logger("thereforeHidden: " + (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') == null));
		document.getElementById("context-d2nagent").hidden = (window.content.location.href.match('^http://www\.die2nite\.com/\#outside\\?go\=outside\/refresh') == null);
	}

};

window.addEventListener("load", function () {
    d2nagent.onLoad();
}, false);
