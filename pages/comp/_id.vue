<template>
<div class="page comp">
  <nav>
    <div class="title">{{ title }}</div>
  </nav>
  <div class="control-panel">
    <clip mode="new" :type.sync="newClip.type" :url.sync="newClip.url" :start.sync="newClip.start" :duration.sync="newClip.duration" :bpd.sync="newClip.bpd" @submit="addClip" />
  </div>
  <div class="timeline">
    <div class="clips">
      <clip :type.sync="clip.type" :url.sync="clip.url" :start.sync="clip.start" :duration.sync="clip.duration" :bpd.sync="clip.bpd" v-for="clip of timeline" :key="clip.id" @submit="updateClip" />
    </div>
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
import Clip from '~/components/Clip'

const clipProperties = [ 'type', 'url', 'start', 'duration', 'bpd' ]

export default {
  data() {
    return {
      title: null,
      timeline: [],
      history: [],
      newClip: {
        type: null,
        url: null,
        start: null,
        duration: null,
        bpd: null
      },
      globalAdjustment: 0 // add extra time to each clip for slow internet connection
    }
  },
  methods: {
    addClip() {
      if(this.newClip.url) {
        // TODO: combine unit operations to add new clip
        let clipID = this.unitOpInsert(0)
        clipProperties.forEach(prop => {
          if(this.newClip[prop]) {
            this.unitOpUpdate(clipID, prop, this.newClip[prop])
          }
          this.newClip[prop] = null
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
    Clip
  }
}
</script>

<style lang="scss">
.page.comp {
  > .timeline {
    > .objects {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0.5rem;
      > .object {
        padding: 1rem;
        margin: 0.5rem;
        max-width: 18rem;
        background-color: rgba(black, 0.15);
      }
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
  box-shadow: 0 2px 8px 0 rgba(black, 0.25);
  cursor: pointer;

  &:focus {
    outline: none;
  }
}
</style>
