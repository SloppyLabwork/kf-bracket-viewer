export function parseCsvRows(csvText) {
    if (!csvText || !csvText.trim()) return []

    const rows = [[]]
    let current = ""
    let inQuotes = false

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i]
        const next = csvText[i + 1]

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"'
                i++
            } else if (char === '"') {
                inQuotes = false
            } else {
                current += char
            }
        } else if (char === '"') {
            inQuotes = true
        } else if (char === ",") {
            rows[rows.length - 1].push(current.trim())
            current = ""
        } else if (char === "\n" || (char === "\r" && next === "\n")) {
            rows[rows.length - 1].push(current.trim())
            current = ""
            if (char === "\r") i++
            rows.push([])
        } else {
            current += char
        }
    }

    if (current.length > 0 || (rows.length > 0 && rows[rows.length - 1]?.length > 0)) {
        if (rows.length === 0) rows.push([])
        rows[rows.length - 1].push(current.trim())
    }

    return rows.filter(row => row.some(cell => cell.length > 0))
}

export function csvToObjects(csvText) {
    const rows = parseCsvRows(csvText)
    if (rows.length === 0) return []

    const headers = rows[0]
    return rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
            obj[header] = row[index] || ""
        })
        return obj
    })
}

export function parseMetaConfig(csvText) {
    const rows = parseCsvRows(csvText)
    if (rows.length === 0) return {}

    const startIndex = rows[0][0]?.toLowerCase() === "key" ? 1 : 0
    const config = {}
    for (const row of rows.slice(startIndex)) {
        if (row[0] && row[1] !== undefined) {
            config[row[0].trim().toLowerCase()] = row[1].trim()
        }
    }
    return config
}

export function extractPlayerNames(csvText) {
    const rows = parseCsvRows(csvText)
    if (rows.length === 0) return []

    const startIndex = rows[0][0]?.toLowerCase() === "players" ||
                       rows[0][0]?.toLowerCase() === "player" ||
                       rows[0][0]?.toLowerCase() === "name"
        ? 1
        : 0

    return rows.slice(startIndex).map(row => row[0]).filter(Boolean)
}
