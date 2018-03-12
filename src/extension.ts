'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as Path from 'path';
import * as UniqueFileName from 'uniquefilename';

let created_files = [];


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const resolvePath = (filepath: string): string =>
    {
        if (filepath[0] === '~')
        {
            const hoveVar = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
            return Path.join(process.env[hoveVar], filepath.slice(1));
        }
        else
        {
            return Path.resolve(filepath);
        }
    };

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('createtmpfile.create', () => {
        // The code you place here will be executed every time your command is executed
        const inputOptions = {
            prompt: 'Set the new temporary file name'
        };

        const tempdir = resolvePath(
            vscode.workspace
                .getConfiguration('createtmpfile')
                .get('tmpDir') || os.tmpdir());

        const onError = (e: NodeJS.ErrnoException) =>
            vscode.window.showErrorMessage(e.message);

        vscode.window.showInputBox(inputOptions)
            .then(input => `${tempdir}${Path.sep}${input}`)
            .then(filepath => UniqueFileName.get(filepath, {}))
            .then(filepath =>
        {
            fs.writeFile(filepath, '', onError);
            created_files.push(filepath);

            vscode.workspace
                .openTextDocument(filepath)
                .then(vscode.window.showTextDocument);
        });
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    const deleteOnExit = vscode.workspace
        .getConfiguration('createtmpfile')
        .get("deleteOnExit", false);

    if (deleteOnExit)
    {
        for (const f of created_files)
        {
            fs.unlink(f, console.error);
        }
    }
}