import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

const tolint = `
    float Num1 = 0;
    float &RefOne = Num1;

    void test()
    {
        RefOne = 3;
    }

    void valid()
    {
        int A;
        int &RefA = A;

        A = 3;
    }`;

export function sleep(ms: number): Promise < void > {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

suite("Extension Test Suite", () => {
    test("clang-tidy test", async () => {
        const tidy = < vscode.Extension < any >> (
            vscode.extensions.getExtension("dilshod.clangtidy")
        );

        const testpath = __dirname + "/test.cpp";
        require("fs").writeFile(testpath, tolint, (err: any) => {
            if (err) throw err;
        });

        const document = await vscode.workspace.openTextDocument(testpath);
        const editor = await vscode.window.showTextDocument(document);

        vscode.commands.executeCommand("clangtidy.checkCode");
        await sleep(5000);

        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);

        assert.strictEqual(tidy.isActive, true, "Extension should be activated");

        const msg = " reference type variable 'RefOne' is assigned after initialization  : [misc-ref-init-assign]";
        let count = 0;

        diagnostics.forEach( (element) => {
            if (!element.message.localeCompare(msg)) count++;
        });

        assert.strictEqual(count, 1);
    });
});
