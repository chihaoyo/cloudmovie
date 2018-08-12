export const props = {
  index: {
    default: null,
    type: 'int'
  },
  type: {
    default: 'webpage',
    type: 'text'
  },
  url: {
    default: null,
    type: 'text'
  },
  name: {
    default: null,
    type: 'text'
  },
  start: {
    default: null,
    type: 'int'
  },
  duration: {
    default: null,
    type: 'int'
  },
  bpd: {
    default: null,
    type: 'int'
  }
}
export const propList = Object.keys(props)
