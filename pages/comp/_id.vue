<template>
<div class="page comp">
  <div>
    <button @click="insert(0)">0</button>
    <button @click="update(0, 'aa', 'bb')">1</button>
    <button @click="insert(0)">2</button>
    <button @click="update(0, 'bb', 'cc')">3</button>
    <button @click="remove(1)">4</button>
  </div>
  <div class="timeline">
    <div class="object" v-for="object of timeline" :key="object.id">
      <div>
        {{ object.id }}
      </div>
      <div>
        {{ object }}
      </div>
    </div>
  </div>
  <div class="history">
    <div class="record" v-for="(record, index) of history" :key="index">
      {{ record }}
    </div>
  </div>
</div>
</template>

<script>
import * as util from '~/lib/util'
import * as ACTIONS from '~/lib/actions'

export default {
  data() {
    return {
      title: null,
      timeline: [],
      history: []
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
  }
}
</script>

<style lang="scss">
.page.comp {
  > .timeline {
    > .object{
      padding: 1rem;
      margin: 1rem;
      background-color: rgba(black, 0.15);
    }
  }
  > .history {
    background-color: rgba(black, 0.15);
    font-size: 0.75rem;
  }
}
</style>
