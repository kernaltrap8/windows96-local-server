/**
 * Editor (C) Windows 96 2021.
 * 
 * Find Monaco editor here: https://github.com/microsoft/monaco-editor
 */

async function app(w96, u96, app, oninitcomplete) {
    // Prepare file system
    if(!await w96.FS.exists("c:/user/appdata/Monaco"))
        await w96.FS.mkdir("c:/user/appdata/Monaco");

    if(!await w96.FS.exists("c:/user/appdata/Monaco/config.json")) {
        await w96.FS.writestr("c:/user/appdata/Monaco/config.json", JSON.stringify({
            theme: 'vs-dark',
            enableMinimap: false
        }, null, 4));
    }

    const configStr = await w96.FS.readstr("c:/user/appdata/Monaco/config.json");
    const config = JSON.parse(configStr);

    require.config({ paths: { 'vs': '/system/libraries/extern/monaco/vs' }});
    require(['vs/editor/editor.main'], function() {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES6,
            allowNonTsExtensions: true
        });

        window.reloadLibs = ()=>{
            for(l in app.libs) {
                try {
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(l.content, l.name);
                    //monaco.editor.createModel(l.content, 'typescript', monaco.Uri.parse(l.name));
                } catch (e) {
                    console.error(e);
                }
            }
        }

        reloadLibs();

        window.editor = monaco.editor.create(document.getElementById('container'), Object.assign({}, config, {
            value: "",
            language: 'javascript',
            theme: config.theme,
            automaticLayout: true,
            minimap: {
                enabled: config.enableMinimap
            }
        }));

        oninitcomplete(editor);

        editor.onDidChangeModelContent((e)=>{
            app.setDocumentModified(true);
        });

        setupKeybinds(app);
    });
}

/*
Editor bindings for app code.
*/

let editorModels = {
    js: { ext: ".js", model: null },
    json: { ext: ".json", model: null },
    plain: { ext: ".txt", model: null },
    html: { ext: ".html", model: null },
    css: { ext: ".css", model: null },
    wat: { ext: ".wat", model: null }
}

/**
 * Switches the language.
 * @param {String} lang The language to use.
 */
function switchLang(lang) {
    if(editorModels[lang] == null)
        lang = "plain";

    if(lang == "js")
        reloadLibs();
    
    if(editorModels[lang].model == null)
        editorModels[lang].model = monaco.editor.createModel('', undefined, monaco.Uri.file("file" + editorModels[lang].ext));

    const oldContents = editor.getValue();
    editor.setModel(editorModels[lang].model);
    editor.setValue(oldContents);
}

/**
 * Assumes the language to use from path.
 * @param {String} path The path to consider.
 */
function assumeLangFromExt(path) {
    const modelKeys = Object.keys(editorModels);

    for(let key of modelKeys) {
        const ext = editorModels[key].ext;

        if(path.toLowerCase().endsWith(ext))
            return switchLang(key);
    }

    switchLang("plain");
}

/**
 * Setup Monaco keybinds.
 */
function setupKeybinds(app) {
    document.body.addEventListener('keydown', (e)=>{
        if(e.ctrlKey && e.key == "s") {
            e.preventDefault();
            app.saveDocumentDialog();
        } else if(e.ctrlKey && e.key == "o") {
            e.preventDefault();
            app.openDocumentDialog();
        } else if(e.ctrlKey && e.key == "n") {
            e.preventDefault();
            app.newDocumentUI();
        }
    });
}