import './styles.css'
import { readBracketConfig, MissingConfigError } from './queryParams.js'
import { fetchSheetData } from './fetchSheetData.js'
import { extractPlayerNames, csvToObjects, parseMetaConfig } from './parseCsv.js'
import {
  buildBracketStructure,
  applyResultsToBracket,
} from './bracketEngine.js'
import { renderBracket } from './renderBracket.js'

const appElement = document.getElementById('bracket-app')
const loadingIndicator = document.getElementById('loading-indicator')
const errorDisplay = document.getElementById('error-display')

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function applyMetaStyles(metaConfig) {
  const eastRgba = hexToRgba(metaConfig.eastColor, 0.08)
  const westRgba = hexToRgba(metaConfig.westColor, 0.08)
  appElement.style.background = `linear-gradient(135deg, ${eastRgba}, ${westRgba})`

  if (metaConfig.tournamentName) {
    document.title = metaConfig.tournamentName
  }
}

function showError(message, showHint = false) {
  loadingIndicator.hidden = true
  errorDisplay.hidden = false
  errorDisplay.textContent = message

  if (showHint) {
    const hint = document.createElement('div')
    hint.className = 'config-hint'
    hint.textContent =
      'Example:\n?sheetId=YOUR_SHEET_ID&playersSheet=Players&resultsSheet=Results'
    errorDisplay.append(hint)
  }
}

async function initialize() {
  let config
  try {
    config = readBracketConfig()
  } catch (err) {
    if (err instanceof MissingConfigError) {
      showError(
        'No bracket data configured.\n\nAdd a sheetId query parameter pointing to a published Google Sheet.',
        true,
      )
      return
    }
    throw err
  }

  const playersCsv = await fetchSheetData(config.sheetId, config.playersSheet)
  const resultsCsv = await fetchSheetData(config.sheetId, config.resultsSheet).catch(
    (err) => {
      console.warn('Could not fetch results sheet, showing empty bracket:', err)
      return ''
    },
  )
  const metaCsv = await fetchSheetData(config.sheetId, config.metaSheet).catch(
    (err) => {
      console.warn('No meta sheet found, using defaults:', err)
      return ''
    },
  )

  const playerNames = extractPlayerNames(playersCsv)
  if (playerNames.length !== 32) {
    throw new Error(
      `Expected 32 players in the "${config.playersSheet}" sheet, found ${playerNames.length}.`,
    )
  }

  const matchResults = csvToObjects(resultsCsv)
  const bracket = buildBracketStructure(playerNames)
  applyResultsToBracket(bracket, matchResults)

  const rawMeta = parseMetaConfig(metaCsv)
  const metaConfig = {
    tournamentName: rawMeta['tournament name'] || '',
    eastBackground: rawMeta['east background'] || '',
    westBackground: rawMeta['west background'] || '',
    eastColor: rawMeta['east color'] || '#00c853',
    westColor: rawMeta['west color'] || '#0077b6',
    maxSeedDisplay: parseInt(rawMeta['max seed display'] || '0', 10) || 0,
  }

  bracket.maxSeedDisplay = metaConfig.maxSeedDisplay

  applyMetaStyles(metaConfig)
  loadingIndicator.hidden = true
  renderBracket(bracket, appElement, metaConfig)
}

initialize().catch((err) => {
  console.error('Bracket initialization failed:', err)
  showError(err.message)
})
