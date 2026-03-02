import { renderMatchCard } from "./renderMatchCard.js"
import { everyMatchPredicted, copyFinishingOrderToClipboard } from "./predictionMode.js"

const ROUND_LABELS = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"]
const HALF_ROUND_COUNT = 4

function createRoundColumn(roundIndex, matches, bracket, side, onPredictionClick) {
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
        matchWrapper.append(renderMatchCard(match, bracket, onPredictionClick))
        matchesContainer.append(matchWrapper)
    })

    column.append(matchesContainer)
    return column
}

function createHalfBracket(side, bracket, onPredictionClick) {
    const half = document.createElement("div")
    half.className = `bracket-half bracket-${side}`

    for (let roundIndex = 0; roundIndex < HALF_ROUND_COUNT; roundIndex++) {
        const roundMatches = bracket.rounds[roundIndex].filter(m => m.halfSide === side)
        const column = createRoundColumn(roundIndex, roundMatches, bracket, side, onPredictionClick)
        half.append(column)
    }

    return half
}

function createFinalColumn(bracket, onPredictionClick) {
    const column = document.createElement("div")
    column.className = "bracket-final"

    const header = document.createElement("div")
    header.className = "round-header"
    header.textContent = "Championship"
    column.append(header)

    const finalMatch = bracket.rounds[4][0]
    const matchWrapper = document.createElement("div")
    matchWrapper.className = "match-wrapper"
    matchWrapper.append(renderMatchCard(finalMatch, bracket, onPredictionClick))
    column.append(matchWrapper)

    if (finalMatch.winnerName && !onPredictionClick) {
        const champion = document.createElement("div")
        champion.className = "champion-display"
        champion.textContent = `\uD83C\uDFC6 ${finalMatch.winnerName}`
        column.append(champion)
    }

    if (onPredictionClick) {
        const allPredicted = everyMatchPredicted(bracket)
        const copyButton = document.createElement("button")
        copyButton.className = "copy-prediction-button"
        copyButton.textContent = "Copy Predictions"
        copyButton.disabled = !allPredicted
        if (allPredicted) {
            copyButton.addEventListener("click", () => copyFinishingOrderToClipboard(bracket))
        }
        column.append(copyButton)
    }

    return column
}

export function renderBracket(bracket, containerElement, metaConfig = {}, onPredictionClick = null) {
    containerElement.innerHTML = ""

    const bracketContainer = document.createElement("div")
    bracketContainer.className = onPredictionClick ? "bracket prediction-mode" : "bracket"

    if (metaConfig.tournamentName) {
        const title = document.createElement("div")
        title.className = "tournament-title"
        title.textContent = metaConfig.tournamentName
        containerElement.append(title)
    }

    if (metaConfig.links?.length > 0) {
        const linksBar = document.createElement("div")
        linksBar.className = "tournament-links"
        for (const link of metaConfig.links) {
            const anchor = document.createElement("a")
            anchor.href = link.url
            anchor.target = "_blank"
            anchor.rel = "noopener noreferrer"
            anchor.textContent = link.text
            linksBar.append(anchor)
        }
        containerElement.append(linksBar)
    }

    const eastHalf = createHalfBracket("east", bracket, onPredictionClick)
    const finalColumn = createFinalColumn(bracket, onPredictionClick)
    const westHalf = createHalfBracket("west", bracket, onPredictionClick)

    westHalf.classList.add("bracket-west-reversed")

    eastHalf.style.setProperty("--side-color", metaConfig.eastColor || "#00c853")
    westHalf.style.setProperty("--side-color", metaConfig.westColor || "#0077b6")

    if (metaConfig.eastBackground) {
        eastHalf.classList.add("has-bg")
        eastHalf.style.setProperty("--bg-image", `url("${metaConfig.eastBackground}")`)
    }
    if (metaConfig.eastBackgroundCredit) {
        const credit = document.createElement("div")
        credit.className = "bg-credit bg-credit-east"
        credit.textContent = metaConfig.eastBackgroundCredit
        eastHalf.append(credit)
    }

    if (metaConfig.westBackground) {
        westHalf.classList.add("has-bg")
        westHalf.style.setProperty("--bg-image", `url("${metaConfig.westBackground}")`)
    }
    if (metaConfig.westBackgroundCredit) {
        const credit = document.createElement("div")
        credit.className = "bg-credit bg-credit-west"
        credit.textContent = metaConfig.westBackgroundCredit
        westHalf.append(credit)
    }

    bracketContainer.append(eastHalf, finalColumn, westHalf)
    containerElement.append(bracketContainer)
}
