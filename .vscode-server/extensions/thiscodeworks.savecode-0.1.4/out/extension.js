"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
require("isomorphic-fetch");
const path = require("path");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('tcw-save-code.helloWorld', () => {
        let apiKey = context.globalState.get('apiKey');
        if (!apiKey) {
            let apiOptions = {
                placeHolder: "Enter API token from thiscodeworks.com/settings"
            };
            vscode.window.showInputBox(apiOptions).then(value => {
                if (!value)
                    return;
                context.globalState.update('apiKey', value);
                vscode.window.showInformationMessage('API token successfully saved');
                vscode.window.showInformationMessage('The Save Code Extension API Token has been installed');
            });
        }
        else {
            let apiOptions = {
                placeHolder: "Update your API token"
            };
            vscode.window.showInputBox(apiOptions).then(value => {
                if (!value)
                    return;
                context.globalState.update('apiKey', value);
                vscode.window.showInformationMessage('API token successfully updated');
            });
        }
    });
    context.subscriptions.push(disposable);
    let selectText = vscode.commands.registerCommand('tcw-save-code.selectText', () => {
        let apiKey = context.globalState.get('apiKey');
        if (!apiKey) {
            let apiOptions = {
                placeHolder: "Enter API token from thiscodeworks.com/user/settings"
            };
            vscode.window.showInputBox(apiOptions).then(value => {
                if (!value)
                    return;
                context.globalState.update('apiKey', value);
                vscode.window.showInformationMessage('API token successfully saved');
            });
        }
        else {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            var lang = editor.document.languageId;
            var selectedText = editor.document.getText(editor.selection);
            if (!selectedText) {
                vscode.window.showErrorMessage("Select some text first!");
                return;
            }
            let options = {
                placeHolder: "What does this snippet do?"
            };
            vscode.window.showInputBox(options).then(value => {
                if (!value)
                    return;
                const url = "https://api.thiscodeworks.com/snippets";
                const headers = {
                    'Content-Type': 'application/json',
                    "Authorization": "Bearer " + apiKey
                };
                const body = {
                    title: value,
                    code: selectedText,
                    public: false,
                    tags: lang,
                    on: "vscode"
                };
                fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) })
                    .then(response => {
                    if (!response.ok) {
                        if (response.status == 401) {
                            vscode.window.showErrorMessage("Snippet not saved. Please update API Token!");
                            return;
                        }
                        vscode.window.showErrorMessage(response.status + ': Snippet not saved!');
                        return;
                    }
                    vscode.window.showInformationMessage("Snippet saved!");
                })
                    .catch(error => vscode.window.showErrorMessage(error.status + ' Error: Snippet not saved!'));
            });
        }
    });
    context.subscriptions.push(selectText);
    //View snippets
    let mySnippets = vscode.commands.registerCommand('tcw-save-code.mySnippets', () => {
        var snippets;
        let apiKey = context.globalState.get('apiKey');
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel('mySnippets', // Identifies the type of the webview. Used internally
        'My Snippets', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
            enableScripts: true
        });
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'css', 'mysnippets.css'));
        // And get the special URI to use with the webview
        const cssURI = panel.webview.asWebviewUri(onDiskPath);
        const jsonDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'mysnippets.js'));
        const jsURI = panel.webview.asWebviewUri(jsonDiskPath);
        //Fetch snippets
        const url = "https://api.thiscodeworks.com/snippets";
        const headers = {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + apiKey
        };
        fetch(url, { method: 'GET', headers: headers })
            .then(response => {
            if (!response.ok) {
                if (response.status == 401) {
                    var msg = "Your API token is invalid! Follow these steps: (1) Get a new API token from thiscodeworks.com/user/settings. (2) Enter it into the VS Code extension by typing 'Activate Save Code' in the Command Palette. (3) Close this window and try again.";
                    panel.webview.html = getErrorWebview(cssURI, msg);
                    vscode.window.showErrorMessage("Error. Please update API Token!");
                    return;
                }
                panel.webview.html = getErrorWebview(cssURI, "");
                vscode.window.showErrorMessage(response.status + ': Unable to connect!');
                return;
            }
            return response.json();
        }).then(result => {
            snippets = result;
            panel.webview.html = getWebviewContent(result, cssURI, jsURI, apiKey, "");
        }).catch(error => vscode.window.showErrorMessage(error.status + ' Error: Unable to connect'));
        //Refresh snippets when refresh button clicked inside webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'refresh':
                    fetch(url, { method: 'GET', headers: headers })
                        .then(response => response.json())
                        .then(result => {
                        snippets = result;
                        panel.webview.html = getWebviewContent(result, cssURI, jsURI, apiKey, "");
                        vscode.window.showInformationMessage('Window refreshed');
                    })
                        .catch(error => vscode.window.showErrorMessage(error.status + ': Unable to connect'));
            }
        }, undefined, context.subscriptions);
        //Search bar function - fetches search results from tcw
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'search':
                    fetch("https://api.thiscodeworks.com/snippets/search?q=" + message.text, { method: 'GET', headers: headers })
                        .then(response => response.json())
                        .then(result => {
                        snippets = result;
                        panel.webview.html = getWebviewContent(result, cssURI, jsURI, apiKey, message.text);
                    })
                        .catch(error => vscode.window.showErrorMessage(error.status + ': Unable to connect'));
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(mySnippets);
}
exports.activate = activate;
function getWebviewContent(data, uri, jsuri, key, search) {
    var json = JSON.parse(JSON.stringify(data));
    let list = "";
    let searchMsg = "";
    if (search) {
        searchMsg = `Search results for "` + search + `"`;
    }
    if (json.length > 0) {
        for (var i = 0, n = json.length; i < n; i++) {
            list += `<li class="card">
			<div class="titlecontent">
				<a class="title" href="javascript:;" target="_blank">` + json[i].title + `</br><span class="tag">` + json[i].tags + `</span></a>
				<div class="buttons"><span style="float:right; display:block;margin-bottom: 7px;">
					<a href="javascript:;" class="copy">Copy</a></span>   <a href="https://www.thiscodeworks.com/` + json[i]._id + `/edit" target="_blank">Edit</a>   <a href="https://www.thiscodeworks.com/` + json[i]._id + `" target="_blank">Link</a>
				</div>
			</div>
			<pre class="code prettyprint"><xmp>` + json[i].code + `</xmp></pre>
			</li>`;
        }
    }
    else {
        searchMsg = `No snippets found`;
    }
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <link rel='stylesheet' href='` + uri + `' />
	  
	  <title>My snippets</title>
  </head>
  <body>
  <div class="menu">
  <div class="leftbtns">
  	<a href="javascript:;" class="button" id="refresh" title="Refresh snippets">⤾</a>
	  <a href="https://www.thiscodeworks.com/user/dashboard" target="_blank" class="button" title="Go to Dashboard">Go to Dashboard</a>
  </div>
  <div>
	<input type="text" placeholder="Search" id="searchBar">
	</div>
	<div>
	<select id="view" class="button" title="Switch view">
	<option value="grid">Grid view</option>
	<option value="list">List view</option>
	</select>
	</div>
	</div>
	<h3 id="title">` + searchMsg + `</h3>
	<div id="list-parent" class="gridview">
	<ul id="list">
	` + list + `
	</ul>
	</div>
	<p id="key" class="hide">` + key + `</p>
  </body>
  <script src="` + jsuri + `"></script>
  <script src="https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js?lang=css&amp;skin=sunburst"></script>

  </html>`;
}
function getErrorWebview(uri, msg) {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel='stylesheet' href='` + uri + `' />
		
		<title>My snippets</title>
	</head>
	<body>
	<div class="menu">
	<div>
		<a href="https://www.thiscodeworks.com/user/dashboard" target="_blank" class="button" title="Go to Dashboard">Go to Dashboard</a>
	</div>
	  <select id="view" class="button" title="Switch view">
		  <option value="grid">Grid view</option>
		  <option value="list">List view</option>
	  </select>
	  </div>
	  <p>Sorry, an error has occured.</p>
	  <p>` + msg + `</p>
	  </br>
	  <p><i>Write to info@thiscodeworks.com for help!</i></p>
	</body>
  
	</html>`;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map