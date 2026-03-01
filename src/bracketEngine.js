const ROUND_NAME_MAP = new Map([
    ["round of 32", 0], ["r32", 0], ["round 1", 0],
    ["round of 16", 1], ["r16", 1], ["round 2", 1],
    ["quarterfinals", 2], ["quarter finals", 2], ["qf", 2], ["round 3", 2],
    ["semifinals", 3], ["semi finals", 3], ["sf", 3], ["round 4", 3],
    ["final", 4], ["finals", 4], ["championship", 4], ["round 5", 4],
])

const PLAYER_COUNT = 32
const ROUND_COUNT = 5
const MATCHES_PER_HALF_ROUND_ONE = 8

function generateSeedOrder(playerCount) {
    let seeds = [1, 2]
    while (seeds.length < playerCount) {
        const nextSize = seeds.length * 2
        const expanded = []
        for (const seed of seeds) {
            expanded.push(seed)
            expanded.push(nextSize + 1 - seed)
        }
        seeds = expanded
    }
    return seeds
}

function normalizeName(name) {
    return name.trim().toLowerCase()
}

function parseRoundIndex(roundText) {
    const normalized = roundText.trim().toLowerCase()
    if (ROUND_NAME_MAP.has(normalized)) {
        return ROUND_NAME_MAP.get(normalized)
    }
    const numMatch = normalized.match(/\d+/)
    if (numMatch) {
        const num = parseInt(numMatch[0], 10)
        if (num >= 1 && num <= ROUND_COUNT) return num - 1
    }
    return null
}

export function buildBracketStructure(playerNames) {
    if (playerNames.length !== PLAYER_COUNT) {
        throw new Error(`Expected ${PLAYER_COUNT} players, got ${playerNames.length}`)
    }

    const seedOrder = generateSeedOrder(PLAYER_COUNT)
    const nameMap = new Map()
    playerNames.forEach((name, index) => {
        nameMap.set(normalizeName(name), { name, seed: index + 1 })
    })

    const rounds = []

    const roundOneMatches = []
    for (let i = 0; i < seedOrder.length; i += 2) {
        const topSeed = seedOrder[i]
        const bottomSeed = seedOrder[i + 1]
        roundOneMatches.push({
            roundIndex: 0,
            matchIndex: i / 2,
            halfSide: i / 2 < MATCHES_PER_HALF_ROUND_ONE ? "east" : "west",
            topSeed,
            bottomSeed,
            topPlayerName: playerNames[topSeed - 1],
            bottomPlayerName: playerNames[bottomSeed - 1],
            result: null,
            winnerName: null,
            feeders: null,
        })
    }
    rounds.push(roundOneMatches)

    for (let round = 1; round < ROUND_COUNT; round++) {
        const previousRound = rounds[round - 1]
        const currentMatches = []

        for (let i = 0; i < previousRound.length; i += 2) {
            const topFeeder = previousRound[i]
            const bottomFeeder = previousRound[i + 1]

            let halfSide
            if (round < ROUND_COUNT - 1) {
                halfSide = topFeeder.halfSide
            } else {
                halfSide = "final"
            }

            currentMatches.push({
                roundIndex: round,
                matchIndex: i / 2,
                halfSide,
                topSeed: null,
                bottomSeed: null,
                topPlayerName: null,
                bottomPlayerName: null,
                result: null,
                winnerName: null,
                feeders: [topFeeder, bottomFeeder],
            })
        }

        rounds.push(currentMatches)
    }

    return { rounds, playerNames, nameMap }
}

function resolveParticipants(match) {
    if (match.roundIndex === 0) {
        return [normalizeName(match.topPlayerName), normalizeName(match.bottomPlayerName)]
    }

    const [topFeeder, bottomFeeder] = match.feeders
    const topName = topFeeder.winnerName ? normalizeName(topFeeder.winnerName) : null
    const bottomName = bottomFeeder.winnerName ? normalizeName(bottomFeeder.winnerName) : null
    return [topName, bottomName]
}

function propagateWinner(match) {
    if (!match.winnerName || !match.feeders) return

    const [topFeeder, bottomFeeder] = match.feeders
    if (topFeeder.winnerName && normalizeName(topFeeder.winnerName) === normalizeName(match.topPlayerName)) {
        return
    }
}

export function applyResultsToBracket(bracket, matchResults) {
    const sortedResults = [...matchResults]
        .filter(r => r["What round was this?"])
        .sort((a, b) => {
            const roundA = parseRoundIndex(a["What round was this?"]) ?? 99
            const roundB = parseRoundIndex(b["What round was this?"]) ?? 99
            if (roundA !== roundB) return roundA - roundB
            return new Date(a["Timestamp"] || 0) - new Date(b["Timestamp"] || 0)
        })

    const appliedSlots = new Set()

    for (const result of sortedResults) {
        const roundIndex = parseRoundIndex(result["What round was this?"])
        if (roundIndex === null) {
            console.warn(`Unrecognized round: "${result["What round was this?"]}"`)
            continue
        }

        const winnerRaw = result["Winner (that's you)"]
        const loserRaw = result["Opponent"]
        if (!winnerRaw || !loserRaw) continue

        const winnerNorm = normalizeName(winnerRaw)
        const loserNorm = normalizeName(loserRaw)

        const roundMatches = bracket.rounds[roundIndex]
        if (!roundMatches) continue

        let matched = false
        for (const match of roundMatches) {
            const slotKey = `${roundIndex}-${match.matchIndex}`
            const [participantA, participantB] = resolveParticipants(match)

            if (participantA === null || participantB === null) continue

            const participantSet = new Set([participantA, participantB])
            if (participantSet.has(winnerNorm) && participantSet.has(loserNorm)) {
                if (appliedSlots.has(slotKey)) {
                    const existingTimestamp = new Date(match.result?.["Timestamp"] || 0)
                    const newTimestamp = new Date(result["Timestamp"] || 0)
                    if (newTimestamp <= existingTimestamp) continue
                }

                match.result = result
                match.winnerName = winnerRaw.trim()

                if (match.roundIndex === 0) {
                    match.topPlayerName = match.topPlayerName
                    match.bottomPlayerName = match.bottomPlayerName
                } else {
                    match.topPlayerName = match.feeders[0].winnerName
                    match.bottomPlayerName = match.feeders[1].winnerName
                }

                appliedSlots.add(slotKey)
                matched = true
                break
            }
        }

        if (!matched) {
            console.warn(
                `Could not match result: ${winnerRaw} beat ${loserRaw} in round "${result["What round was this?"]}"`
            )
        }
    }

    for (let round = 1; round < ROUND_COUNT; round++) {
        for (const match of bracket.rounds[round]) {
            if (match.feeders) {
                if (match.feeders[0].winnerName) {
                    match.topPlayerName = match.feeders[0].winnerName
                }
                if (match.feeders[1].winnerName) {
                    match.bottomPlayerName = match.feeders[1].winnerName
                }
            }
        }
    }

    return bracket
}
