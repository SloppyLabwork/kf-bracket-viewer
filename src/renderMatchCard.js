function createElementWithClass(tag, className) {
    const el = document.createElement(tag)
    el.className = className
    return el
}

function isValidUrl(text) {
    return text && text.startsWith("http")
}

function buildPlayerRow(name, seed, isWinner, deckUrl, chainBid, deckSwapped) {
    const row = createElementWithClass("div", `match-player ${isWinner ? "match-winner" : "match-loser"}`)

    const seedBadge = createElementWithClass("span", "player-seed")
    seedBadge.textContent = seed ?? ""

    const nameSpan = createElementWithClass("span", "player-name")
    nameSpan.textContent = name

    row.append(seedBadge, nameSpan)

    if (isValidUrl(deckUrl)) {
        const deckLink = document.createElement("a")
        deckLink.className = "deck-link"
        deckLink.href = deckUrl
        deckLink.target = "_blank"
        deckLink.rel = "noopener noreferrer"
        deckLink.textContent = "\u2728"
        deckLink.title = `${name}'s deck`
        row.append(deckLink)
    }

    if (chainBid > 0 || deckSwapped) {
        const bidBadge = createElementWithClass("span", "chain-badge")
        let text = ""
        if (chainBid > 0) text += `${chainBid}\uD83D\uDD17`
        if (deckSwapped) text += ` \uD83D\uDD04\uFE0F`
        bidBadge.textContent = text.trim()
        row.append(bidBadge)
    }

    return row
}

function buildPendingPlayerRow(name, seed) {
    const row = createElementWithClass("div", "match-player")

    const seedBadge = createElementWithClass("span", "player-seed")
    seedBadge.textContent = seed ?? ""

    const nameSpan = createElementWithClass("span", "player-name")
    nameSpan.textContent = name || "TBD"

    if (!name) {
        nameSpan.classList.add("tbd")
    }

    row.append(seedBadge, nameSpan)
    return row
}

function findSeedForName(bracket, name) {
    if (!name || !bracket) return null
    const norm = name.trim().toLowerCase()
    const index = bracket.playerNames.findIndex(p => p.trim().toLowerCase() === norm)
    if (index < 0) return null
    const seed = index + 1
    if (bracket.maxSeedDisplay > 0 && seed > bracket.maxSeedDisplay) return null
    return seed
}

function buildPredictablePlayerRow(name, seed, isPredictedWinner, onPredictionClick, match) {
    const isWinner = isPredictedWinner === true
    const isLoser = isPredictedWinner === false

    let className = "match-player"
    if (isWinner) className += " predicted-winner"
    else if (isLoser) className += " predicted-loser"

    const row = createElementWithClass("div", className)

    const seedBadge = createElementWithClass("span", "player-seed")
    seedBadge.textContent = seed ?? ""

    const nameSpan = createElementWithClass("span", "player-name")
    nameSpan.textContent = name || "TBD"

    if (!name) {
        nameSpan.classList.add("tbd")
    }

    row.append(seedBadge, nameSpan)

    if (name && onPredictionClick) {
        row.classList.add("predictable")
        row.addEventListener("click", () => onPredictionClick(match, name))
    }

    return row
}

export function renderMatchCard(match, bracket, onPredictionClick) {
    const card = createElementWithClass("div", "match-card")

    if (match.result) {
        card.classList.add("has-result")

        const result = match.result
        const winnerName = match.winnerName
        const winnerNorm = winnerName.trim().toLowerCase()

        const topNorm = match.topPlayerName?.trim().toLowerCase()
        const topIsWinner = topNorm === winnerNorm

        const chainBid = parseInt(result["What was the chain bid?"] || "0", 10)
        const playedOwnDeck = result["Did you play your own deck in the match?"] || ""
        const deckSwapped = playedOwnDeck.toLowerCase().includes("no")
        const bidOnDeck = result["Which deck was bid on?"] || ""
        const bidOnMyDeck = bidOnDeck.toLowerCase().includes("my deck")
        const bidOnOpponent = bidOnDeck.toLowerCase().includes("opponent")
        const chainsOnWinner = (bidOnMyDeck && !deckSwapped) || (bidOnOpponent && deckSwapped)

        const winnerDeck = result["Winner's Deck"] || ""
        const loserDeck = result["Opponent's Deck"] || ""

        const topSeed = findSeedForName(bracket, match.topPlayerName)
        const bottomSeed = findSeedForName(bracket, match.bottomPlayerName)

        const topDeck = topIsWinner ? winnerDeck : loserDeck
        const bottomDeck = topIsWinner ? loserDeck : winnerDeck

        const topHasChains = topIsWinner ? chainsOnWinner : !chainsOnWinner
        const topChains = topHasChains ? chainBid : 0
        const bottomChains = topHasChains ? 0 : chainBid

        const topRow = buildPlayerRow(match.topPlayerName, topSeed, topIsWinner, topDeck, topChains, topIsWinner && deckSwapped)
        const bottomRow = buildPlayerRow(match.bottomPlayerName, bottomSeed, !topIsWinner, bottomDeck, bottomChains, !topIsWinner && deckSwapped)

        card.append(topRow, bottomRow)
    } else if (match.isPrediction) {
        card.classList.add("has-prediction")

        const topName = match.topPlayerName
        const bottomName = match.bottomPlayerName
        const winnerName = match.winnerName

        const topSeed = topName ? findSeedForName(bracket, topName) : null
        const bottomSeed = bottomName ? findSeedForName(bracket, bottomName) : null

        const topIsWinner = topName === winnerName
        card.append(
            buildPredictablePlayerRow(topName, topSeed, topIsWinner, onPredictionClick, match),
            buildPredictablePlayerRow(bottomName, bottomSeed, !topIsWinner, onPredictionClick, match),
        )
    } else {
        card.classList.add("pending")

        const topName = match.topPlayerName
        const bottomName = match.bottomPlayerName

        const topSeed = topName ? findSeedForName(bracket, topName) : null
        const bottomSeed = bottomName ? findSeedForName(bracket, bottomName) : null

        if (onPredictionClick) {
            card.append(
                buildPredictablePlayerRow(topName, topSeed, null, onPredictionClick, match),
                buildPredictablePlayerRow(bottomName, bottomSeed, null, onPredictionClick, match),
            )
        } else {
            card.append(
                buildPendingPlayerRow(topName, topSeed),
                buildPendingPlayerRow(bottomName, bottomSeed),
            )
        }
    }

    return card
}
