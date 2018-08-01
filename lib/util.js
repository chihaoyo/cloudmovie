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
  let minutes = Math.floor((seconds % 3600) / 60)
  let hours = Math.floor(seconds / 3600)
  seconds = seconds % 60
  return hours > 0 ? `${hours}:${leading0(minutes)}:${leading0(seconds)}` : (minutes > 0 ? `${minutes}:${leading0(seconds)}` : `${seconds}`)
}