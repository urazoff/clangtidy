import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  TextDocument,
  workspace,
  Range,
  Position,
  window,
} from "vscode";

/**
* @brief Class for clang-tidy
*/
export default class ClangTidy {
  private collection: DiagnosticCollection = languages.createDiagnosticCollection(
    "clang-tidy"
  );
  
  /**
  * @brief Clear the current collection
  * @param TextDocument: Current document
  */
  public clear(document: TextDocument) {
    if (document.uri.scheme === "file") {
      this.collection.delete(document.uri);
    }
  }

    /**
  * @brief Dispose the current collection
  */
     public dispose() {
        this.collection.dispose();
      }

  /**
  * @brief Run clang-tidy
  * @param TextDocument : Current document
  */
  public async lint(document: TextDocument) {
    this.clear(document);

    if (!["cpp", "c"].includes(document.languageId)) {
        return;
    }

    const executablePath = workspace.getConfiguration("clang-tidy").get("executable") as string;
    const checks = workspace.getConfiguration("clang-tidy").get("checks") as Array<string>;

    let child = require('child_process').execFile(executablePath, [`--checks=${checks.join(",")}`, document.fileName], (error: {
        code: string; }, data: string) => {
        if(error) {
          console.log(data);
            if (error.code === "ENOENT") {
                window.showWarningMessage("clang-tidy executable not found, check path in settings");
        } else if (error.code != "1") {
                window.showWarningMessage("Something went wrong on clang-tidy run");
                console.log(error);
        }

        }
        let diagnostics = this.parse(data, document);
        if (diagnostics.length > 0) {
            this.collection.set(document.uri, diagnostics);
        }
    });
  }

  /**
  * @brief Parse the output of clang-tidy
  * @param string : Raw output of clang-tidy
  * @param TextDocument : Current document
  */
   private parse(output: string, document: TextDocument): Diagnostic[] {

    const diagnostics = [];
    const regExp = /.*:(\d+):\d+:\s+(warning|error|info|hint):(.+)(\[.+\])/g;
    let match = regExp.exec(output);

    while (match !== null) {
        let severity;
        switch (match[2]) {
            case "error":
                severity = DiagnosticSeverity.Error;
                break;
            case "warning":
                severity = DiagnosticSeverity.Warning;
                break;
            case "info":
                severity = DiagnosticSeverity.Information;
                break;
            case "hint":
                severity = DiagnosticSeverity.Hint;
                break;
            default:
                severity = DiagnosticSeverity.Warning;
                break;
        }

      const line = Number.parseInt(match[1]);
      const message = match[3];
      const check = match[4];
      const lineText = document.lineAt(line - 1);
      const lineTextRange = lineText.range;
      const range = new Range(
        new Position(
          lineTextRange.start.line,
          lineText.firstNonWhitespaceCharacterIndex
        ),
        lineTextRange.end
      );

      diagnostics.push(
        new Diagnostic(range, `${message} : ${check}`, severity)
      );
      match = regExp.exec(output);
    }

    return diagnostics;
  }
}