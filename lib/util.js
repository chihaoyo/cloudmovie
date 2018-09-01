import * as regularExpressions from '~/lib/regularExpressions'

const uuid = require('uuid/v4')

export function id() {
  return uuid()
}
export function leading0(val) {
  return val >= 0 && val < 10 ? '0' + val : val
}
export function time() {
  let time = new Date()
  return `${time.getFullYear()}-${leading0(time.getMonth() + 1)}-${leading0(time.getDate())}T${leading0(time.getHours())}:${leading0(time.getMinutes())}:${leading0(time.getSeconds())}:${time.getMilliseconds()}`
}
export function timeString(seconds) {
  seconds = parseInt(seconds)
  if(Number.isNaN(seconds)) {
    seconds = 0
  }
  let minutes = Math.floor((seconds % 3600) / 60)
  let hours = Math.floor(seconds / 3600)
  seconds = seconds % 60
  return hours > 0 ? `${hours}:${leading0(minutes)}:${leading0(seconds)}` : `${minutes}:${leading0(seconds)}`
}
export function validate(val) {
  return val !== null && val !== undefined && (typeof val === 'string' ? val.trim() : true) ? (typeof val === 'string' ? val.trim() : val) : null
}

export function isYouTube(url) {
  return url ? url.match(regularExpressions.youtube) : false
}
export function getYouTubeID(url) {
  let id = null
  if(url) {
    let match = url.match(regularExpressions.youtube)
    if(match) {
      id = match[1]
    }
  }
  return id
}
export function getYouTubeThumbnailURL(url) {
  return 'https://i.ytimg.com/vi/' + getYouTubeID(url) + '/hqdefault.jpg'
}
