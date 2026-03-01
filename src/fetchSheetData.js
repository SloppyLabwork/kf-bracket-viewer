export async function fetchSheetData(sheetId, sheetName) {
    const encodedSheet = encodeURIComponent(sheetName)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodedSheet}`

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(
            `Failed to fetch sheet "${sheetName}" (HTTP ${response.status}). ` +
            `Make sure the Google Sheet is published via File > Share > Publish to web.`
        )
    }

    return response.text()
}
