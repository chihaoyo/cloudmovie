<template>
<div class="page comp">
  <nav>
    <div class="title"><text-editor :value.sync="title" placeholder="文件標題" @input="val => title = val" /></div>
    <div class="author"><text-editor :value.sync="author" placeholder="我的顯示名稱" @input="val => author = val" /></div>
  </nav>
  <div class="control-panel">
    <clip mode="new" :type.sync="newClip.type" :url.sync="newClip.url" :name.sync="newClip.name" :start.sync="newClip.start" :duration.sync="newClip.duration" :bpd.sync="newClip.bpd" @submit="addClip" />
    <div class="actions">
      <button @click="generateTestData">Give me some test data.</button>
    </div>
  </div>
  <div class="timeline" @click="timelineClickHandler">
    <template v-for="(clip, index) of timeline">
      <insert-indicator :author="author" v-if="index === insertAt" :key="index" />
      <clip @click.native.stop :id="clip.id" :type.sync="clip.type" :url.sync="clip.url" :name.sync="clip.name" :start.sync="clip.start" :duration.sync="clip.duration" :bpd.sync="clip.bpd" :key="clip.id" @submit="updateClip" />
    </template>
    <insert-indicator :author="author" v-if="insertAt >= timeline.length" />
  </div>
  <div class="history">
    <div class="records">
      <div class="record" v-for="(record, index) of history" :key="index">{{ record }}</div>
    </div>
  </div>
</div>
</template>

<script>
import * as util from '~/lib/util'
import * as ACTIONS from '~/lib/actions'
import TextEditor from '~/components/TextEditor'
import Clip from '~/components/Clip'
import InsertIndicator from '~/components/InsertIndicator'

const clipProperties = {
  type: {
    default: null
  },
  url: {
    default: null
  },
  name: {
    default: null
  },
  start: {
    default: 0
  },
  duration: {
    default: 0
  },
  bpd: {
    default: 0
  }
}
const clipPropertyList = Object.keys(clipProperties)

export default {
  data() {
    return {
      title: null,
      author: null,
      timeline: [],
      history: [],
      newClip: {
        type: null,
        url: null,
        name: null,
        start: 0,
        duration: 0,
        bpd: 0
      },
      global: {
        defaultDuration: 5,
        playbackExtension: 0 // add extra time to each clip for slow internet connection
      },
      insertAt: 0
    }
  },
  methods: {
    generateTestData() {
      [
        'https://ask.watchout.tw/games/2018-taipei',
        'http://api.search.g0v.io/',
        'https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName',
        'https://www.youtube.com/watch?v=5_5zZnuB71w'
      ].forEach(url => {
        this.newClip.url = url
        this.newClip.duration = 4
        this.addClip()
      })
    },
    timelineClickHandler(e) {
      let mouseX = e.offsetX
      let mouseY = e.offsetY

      let clipPositions = []
      let rows = []
      let clips = document.getElementsByClassName('timeline')[0].getElementsByClassName('clip')
      for(let i = 0; i < clips.length; i++) {
        let clip = clips[i]
        let left = clip.offsetLeft
        let top = clip.offsetTop
        if(!rows.includes(top)) {
          rows.push(top)
        }
        clipPositions.push({ index: i, left, top })
      }
      let targetRowIndex = null
      for(let i = 0; i < rows.length; i++) {
        let lower = rows[i]
        let upper = i + 1 < rows.length ? rows[i + 1] : document.documentElement.offsetHeight
        if(mouseY >= lower && mouseY < upper) {
          targetRowIndex = i
          break
        }
      }
      let targetClipPositions = clipPositions.filter(pos => pos.top === rows[targetRowIndex])
      let targetIndex = null
      for(let i = 0; i < targetClipPositions.length; i++) {
        if(mouseX < targetClipPositions[i].left) {
          targetIndex = targetClipPositions[i].index
          break
        }
      }
      if(targetIndex === null) {
        // next row first clip
        targetIndex = targetClipPositions[targetClipPositions.length - 1].index + 1
      }
      this.insertAt = targetIndex
    },
    addClip() {
      if(this.newClip.url && this.newClip.duration > 0) {
        // TODO: combine unit operations to add new clip
        let clipID = this.unitOpInsert(this.insertAt)
        clipPropertyList.forEach(prop => {
          if(this.newClip[prop] !== '' && this.newClip[prop] !== null && this.newClip[prop] !== undefined) {
            this.unitOpUpdate(clipID, prop, this.newClip[prop])
          }
          this.newClip[prop] = clipProperties[prop].default
        })
      }
    },
    updateClip() {
      // TODO: combine unit operations to update clip
    },
    unitOpInsert(index, log = true) {
      let id = util.id()
      this.timeline.splice(index, 0, { id })
      if(log) {
        this.history.push({
          action: ACTIONS.INSERT,
          id,
          index,
          time: util.time()
        })
      }
      return id
    },
    unitOpRemove(id, log = true) {
      let index = this.timeline.findIndex(clip => clip.id === id)
      if(index > -1) {
        let before = JSON.stringify(this.timeline[index])
        this.timeline.splice(index, 1)
        if(log) {
          this.history.push({
            action: ACTIONS.REMOVE,
            id,
            index,
            before,
            time: util.time()
          })
        }
        return true
      }
      return false
    },
    unitOpUpdate(id, prop, val, log = true) {
      let index = this.timeline.findIndex(clip => clip.id === id)
      if(index > -1) {
        let item = this.timeline[index]
        if(item) {
          let before = item[prop]
          if(val === undefined) {
            delete item[prop]
          } else {
            this.$set(item, prop, val)
          }
          if(log) {
            this.history.push({
              action: ACTIONS.UPDATE,
              id,
              index,
              prop,
              before,
              after: val,
              time: util.time()
            })
          }
        }
        return true
      }
      return false
    },
    forward(recordCount) {
      console.log('FORWARD', recordCount)
      for(let i = 0; i < recordCount; i++) {
        let record = this.history[i]
        // console.log('RECORD', JSON.stringify(record))

        if(record.action === ACTIONS.INSERT) {
          this.timeline.splice(record.index, 0, {})
        } else if(record.action === ACTIONS.REMOVE) {
          this.timeline.splice(record.index, 1)
        } else if(record.action === ACTIONS.UPDATE) {
          let item = this.timeline[record.index]
          if(record.after === undefined) {
            delete item[record.prop]
          } else {
            item[record.prop] = record.after
          }
        }
        console.log('TIMELINE', JSON.stringify(this.timeline))
      }
    },
    backward(recordCount) {
      console.log('BACKWARD', recordCount)
      for(let i = this.history.length - 1; i > this.history.length - 1 - recordCount; i--) {
        let record = this.history[i]
        // console.log('RECORD', JSON.stringify(record))

        if(record.action === ACTIONS.INSERT) {
          this.timeline.splice(record.index, 1)
        } else if(record.action === ACTIONS.REMOVE) {
          this.timeline.splice(record.index, 0, JSON.parse(record.before))
        } else if(record.action === ACTIONS.UPDATE) {
          let item = this.timeline[record.index]
          if(record.before === undefined) {
            delete item[record.prop]
          } else {
            item[record.prop] = record.before
          }
        }
        console.log('TIMELINE', JSON.stringify(this.timeline))
      }
    }
  },
  components: {
    TextEditor,
    Clip,
    InsertIndicator
  }
}
</script>

<style lang="scss">
html, body, input {
  font-family: "SF Pro Text", sans-serif;
}
.page.comp {
  > nav {
    display: flex;
    padding: 0.5rem;
    background-color: rgba(blue, 0.15);
    > .title {
      flex-grow: 1;
      margin: 0.5rem;
    }
    > .author {
      margin: 0.5rem;
    }
  }
  > .control-panel {
    > .actions {
      margin: 1rem;
    }
  }
  > .timeline {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    padding: 2rem 0.5rem;
    cursor: pointer;
    > .clip {
      margin: 0.5rem;
      width: 18rem;
    }
  }
  > .history {
    background-color: rgba(black, 0.15);
    padding: 1rem;
    > .records {
      font-size: 0.75rem;
    }
  }
}
button {
  appearance: none;
  font-size: 1rem;
  padding: 0.5rem;
  border: none;
  background-color: rgba(blue, 0.65);
  color: rgba(white, 0.95);
  font-weight: bold;
  box-shadow: 0 2px 8px 0 rgba(black, 0.25);
  cursor: pointer;

  &:focus {
    outline: none;
  }
}
</style>
