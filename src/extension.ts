import * as vscode from 'vscode';
import ClangTidy from "./clangTidy";

export function activate(context: vscode.ExtensionContext) {
    const tidy = new ClangTidy();
    context.subscriptions.push(tidy);

	let disposable = vscode.commands.registerCommand('clangtidy.checkCode', () => {
		if (vscode.window.activeTextEditor!.document !== undefined) {
        tidy.lint(vscode.window.activeTextEditor!.document);
		}
	});

	context.subscriptions.push(disposable);

	let lint = (document: vscode.TextDocument) => {
        tidy.lint(document);
    };

	context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(lint)
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(lint)
    );
}

export function deactivate() {}
