import { renderMatchCard } from "./renderMatchCard.js"

const ROUND_LABELS = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"]
const HALF_ROUND_COUNT = 4

function createRoundColumn(roundIndex, matches, bracket, side) {
    const column = document.createElement("div")
    column.className = `bracket-round round-${roundIndex} side-${side}`

    const header = document.createElement("div")
    header.className = "round-header"
    header.textContent = ROUND_LABELS[roundIndex] || `Round ${roundIndex + 1}`
    column.append(header)

    const matchesContainer = document.createElement("div")
    matchesContainer.className = "round-matches"

    matches.forEach((match, index) => {
        const matchWrapper = document.createElement("div")
        matchWrapper.className = "match-wrapper"
        matchWrapper.append(renderMatchCard(match, bracket))
        matchesContainer.append(matchWrapper)
    })

    column.append(matchesContainer)
    return column
}

function createHalfBracket(side, bracket) {
    const half = document.createElement("div")
    half.className = `bracket-half bracket-${side}`

    for (let roundIndex = 0; roundIndex < HALF_ROUND_COUNT; roundIndex++) {
        const roundMatches = bracket.rounds[roundIndex].filter(m => m.halfSide === side)
        const column = createRoundColumn(roundIndex, roundMatches, bracket, side)
        half.append(column)
    }

    return half
}

function createFinalColumn(bracket) {
    const column = document.createElement("div")
    column.className = "bracket-final"

    const header = document.createElement("div")
    header.className = "round-header"
    header.textContent = "Championship"
    column.append(header)

    const finalMatch = bracket.rounds[4][0]
    const matchWrapper = document.createElement("div")
    matchWrapper.className = "match-wrapper"
    matchWrapper.append(renderMatchCard(finalMatch, bracket))
    column.append(matchWrapper)

    if (finalMatch.winnerName) {
        const champion = document.createElement("div")
        champion.className = "champion-display"
        champion.textContent = `\uD83C\uDFC6 ${finalMatch.winnerName}`
        column.append(champion)
    }

    return column
}

export function renderBracket(bracket, containerElement, metaConfig = {}) {
    containerElement.innerHTML = ""

    const bracketContainer = document.createElement("div")
    bracketContainer.className = "bracket"

    if (metaConfig.tournamentName) {
        const title = document.createElement("div")
        title.className = "tournament-title"
        title.textContent = metaConfig.tournamentName
        containerElement.append(title)
    }

    const eastHalf = createHalfBracket("east", bracket)
    const finalColumn = createFinalColumn(bracket)
    const westHalf = createHalfBracket("west", bracket)

    westHalf.classList.add("bracket-west-reversed")

    eastHalf.style.setProperty("--side-color", metaConfig.eastColor || "#00c853")
    westHalf.style.setProperty("--side-color", metaConfig.westColor || "#0077b6")

    if (metaConfig.eastBackground) {
        eastHalf.classList.add("has-bg")
        eastHalf.style.setProperty("--bg-image", `url("${metaConfig.eastBackground}")`)
    }
    if (metaConfig.westBackground) {
        westHalf.classList.add("has-bg")
        westHalf.style.setProperty("--bg-image", `url("${metaConfig.westBackground}")`)
    }

    bracketContainer.append(eastHalf, finalColumn, westHalf)
    containerElement.append(bracketContainer)
}
