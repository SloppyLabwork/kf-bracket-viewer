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
        deckLink.textContent = "\u2694"
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

export function renderMatchCard(match, bracket) {
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
    } else {
        card.classList.add("pending")

        const topName = match.topPlayerName
        const bottomName = match.bottomPlayerName

        const topSeed = topName ? findSeedForName(bracket, topName) : null
        const bottomSeed = bottomName ? findSeedForName(bracket, bottomName) : null

        card.append(
            buildPendingPlayerRow(topName, topSeed),
            buildPendingPlayerRow(bottomName, bottomSeed),
        )
    }

    return card
}
