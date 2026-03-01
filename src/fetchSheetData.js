export async function fetchSheetData(sheetId, sheetName, { rawRows = false } = {}) {
    const encodedSheet = encodeURIComponent(sheetName)
    const headersParam = rawRows ? "&headers=0" : ""
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${headersParam}&sheet=${encodedSheet}`

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(
            `Failed to fetch sheet "${sheetName}" (HTTP ${response.status}). ` +
            `Make sure the Google Sheet is published via File > Share > Publish to web.`
        )
    }

    return response.text()
}
