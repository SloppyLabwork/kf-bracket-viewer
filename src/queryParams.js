export function readBracketConfig() {
    const params = new URLSearchParams(window.location.search)

    const sheetId = params.get("sheetId")
    if (!sheetId) {
        throw new MissingConfigError()
    }

    return {
        sheetId,
        playersSheet: params.get("playersSheet") || "Players",
        resultsSheet: params.get("resultsSheet") || "Results",
        metaSheet: params.get("metaSheet") || "Meta",
    }
}

export class MissingConfigError extends Error {
    constructor() {
        super("Missing required query parameter: sheetId")
        this.name = "MissingConfigError"
    }
}
