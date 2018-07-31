<template>
<div class="page comp">
  <nav>
    <div class="title">{{ title }}</div>
  </nav>
  <div class="control-panel">
    <clip init-state="editing" :type.sync="newClip.type" :url.sync="newClip.url" :start.sync="newClip.start" :duration.sync="newClip.duration" :bpd.sync="newClip.bpd" />
  </div>
  <div class="timeline">
    <div class="clips">
      <clip :type.sync="newClip.type" :url.sync="newClip.url" :start.sync="newClip.start" :duration.sync="newClip.duration" :bpd.sync="newClip.bpd" v-for="clip of timeline" :key="clip.id" />
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
  mounted() {
  },
  methods: {
    insert(index, log = true) {
      let id = util.id()
      this.timeline.splice(index, 0, { id })
      if(log) {
        this.history.push({
          action: ACTIONS.INSERT,
          index,
          id,
          time: util.time()
        })
      }
    },
    remove(index, log = true) {
      let before = JSON.stringify(this.timeline[index])
      this.timeline.splice(index, 1)
      if(log) {
        this.history.push({
          action: ACTIONS.REMOVE,
          index,
          before,
          time: util.time()
        })
      }
    },
    update(index, field, val, log = true) {
      let item = this.timeline[index]
      if(item) {
        let before = item[field]
        if(val === undefined) {
          delete item[field]
        } else {
          this.$set(item, field, val)
        }
        if(log) {
          this.history.push({
            action: ACTIONS.UPDATE,
            index,
            field,
            before,
            after: val,
            time: util.time()
          })
        }
      }
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
            delete item[record.field]
          } else {
            item[record.field] = record.after
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
            delete item[record.field]
          } else {
            item[record.field] = record.before
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
