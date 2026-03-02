import { propagateFeederWinners, ROUND_COUNT } from "./bracketEngine.js"

export function detectPredictionMode(bracket) {
    for (const round of bracket.rounds) {
        for (const match of round) {
            if (match.result) return false
        }
    }
    return true
}

export function applyPrediction(bracket, match, selectedPlayerName) {
    if (match.winnerName && match.winnerName !== selectedPlayerName) {
        clearDownstreamPredictions(bracket, match)
    }

    match.winnerName = selectedPlayerName
    match.isPrediction = true

    propagateFeederWinners(bracket)

    return everyMatchPredicted(bracket)
}

export function everyMatchPredicted(bracket) {
    for (const round of bracket.rounds) {
        for (const match of round) {
            if (!match.winnerName) return false
        }
    }
    return true
}

function clearDownstreamPredictions(bracket, changedMatch) {
    let currentRoundIndex = changedMatch.roundIndex
    let affectedMatches = [changedMatch]

    changedMatch.winnerName = null
    changedMatch.isPrediction = false

    while (currentRoundIndex < ROUND_COUNT - 1) {
        const nextRound = bracket.rounds[currentRoundIndex + 1]
        const nextAffected = []

        for (const nextMatch of nextRound) {
            if (!nextMatch.feeders) continue

            for (const affected of affectedMatches) {
                if (nextMatch.feeders[0] === affected || nextMatch.feeders[1] === affected) {
                    if (nextMatch.feeders[0] === affected) {
                        nextMatch.topPlayerName = null
                    }
                    if (nextMatch.feeders[1] === affected) {
                        nextMatch.bottomPlayerName = null
                    }
                    nextMatch.winnerName = null
                    nextMatch.isPrediction = false
                    nextAffected.push(nextMatch)
                    break
                }
            }
        }

        affectedMatches = nextAffected
        currentRoundIndex++

        if (affectedMatches.length === 0) break
    }
}

export function copyFinishingOrderToClipboard(bracket) {
    const finalMatch = bracket.rounds[ROUND_COUNT - 1][0]
    if (!finalMatch.winnerName) return

    const lines = []
    let rank = 1

    lines.push(`${rank}. ${finalMatch.winnerName}`)
    rank++

    const finalsLoser = finalMatch.topPlayerName === finalMatch.winnerName
        ? finalMatch.bottomPlayerName
        : finalMatch.topPlayerName
    lines.push(`${rank}. ${finalsLoser}`)
    rank++

    for (let roundIndex = ROUND_COUNT - 2; roundIndex >= 0; roundIndex--) {
        const losers = []

        for (const match of bracket.rounds[roundIndex]) {
            if (!match.winnerName) continue
            const loser = match.topPlayerName === match.winnerName
                ? match.bottomPlayerName
                : match.topPlayerName
            if (loser) losers.push(loser)
        }

        losers.sort((a, b) => a.localeCompare(b))

        for (const loser of losers) {
            lines.push(`${rank}. ${loser}`)
            rank++
        }
    }

    const text = lines.join("\n")

    try {
        navigator.clipboard.writeText(text)
    } catch {
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.append(textarea)
        textarea.select()
        document.execCommand("copy")
        textarea.remove()
    }

    showClipboardToast()
}

function showClipboardToast() {
    const existing = document.querySelector(".clipboard-toast")
    if (existing) existing.remove()

    const toast = document.createElement("div")
    toast.className = "clipboard-toast"
    toast.textContent = "Finishing order copied to clipboard!"
    document.body.append(toast)

    setTimeout(() => toast.remove(), 3000)
}
