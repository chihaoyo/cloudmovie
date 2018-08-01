<template>
<div class="clip">
  <div class="props" v-if="isEditing">
    <div class="prop">
      <label>類型</label>
      <text-editor :value.sync="type" @input="update('type', $event)" placeholder="類型" />
    </div>
    <div class="prop">
      <label>網址</label>
      <text-editor :value.sync="url" @input="update('url', $event)" placeholder="網址" />
    </div>
    <div class="prop">
      <label>播放長度</label>
      <text-editor :value.sync="duration" @input="update('duration', $event)" placeholder="秒數" class="number" />
      <span class="computed">{{ durationTimeString }}</span>
    </div>
    <div class="prop">
      <label>開始於</label>
      <text-editor :value.sync="start" @input="update('start', $event)" placeholder="秒數" class="number" />
      <span class="computed">{{ startTimeString }}</span>
    </div>
    <div class="prop">
      <label>結束於</label>
      <text-editor v-model="end" placeholder="秒數" class="number" />
      <span class="computed">{{ endTimeString }}</span>
    </div>
    <div class="prop">
      <label>背景播放</label>
      <text-editor :value.sync="bpd" @input="update('bpd', $event)" placeholder="秒數" class="number" />
      <span class="computed">{{ bpdTimeString }}</span>
    </div>
  </div>
  <div class="summary" v-else>
    <div class="url">{{ url }}</div>
    <div class="playback">{{ durationTimeString }} from {{ startTimeString }}</div>
  </div>
  <div class="actions">
    <button @click="submit">{{ isEditing ? (mode === 'new' ? '新增' : '完成') : '編輯' }}</button>
  </div>
</div>
</template>

<script>
import * as util from '~/lib/util'
import TextEditor from '~/components/TextEditor'

export default {
  props: ['mode', 'type', 'url', 'duration', 'start', 'bpd'],
  data() {
    return {
      isEditing: this.mode === 'new',
      end: null
    }
  },
  created() {
    this.calculateEnd()
  },
  watch: {
    start() {
      if(this.duration > 0) {
        this.calculateEnd()
      } else {
        this.calculateDuration()
      }
    },
    end() {
      if(this.duration > 0) {
        this.calculateStart()
      } else {
        this.calculateDuration()
      }
    },
    duration() {
      this.calculateEnd()
    }
  },
  computed: {
    startTimeString() {
      return util.timeString(this.start)
    },
    endTimeString() {
      return util.timeString(this.end)
    },
    durationTimeString() {
      return util.timeString(this.duration)
    },
    bpdTimeString() {
      return util.timeString(this.bpd)
    }
  },
  methods: {
    calculateDuration() {
      let start = parseInt(this.start)
      let end = parseInt(this.end)
      if(!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        this.$emit('update:duration', end - start)
      }
    },
    calculateStart() {
      let end = parseInt(this.end)
      let duration = parseInt(this.duration)
      if(!Number.isNaN(end) && !Number.isNaN(duration)) {
        let newStart = end - duration
        let newDuration = duration
        if(end < duration) {
          newStart = 0
          newDuration = end
        }
        this.$emit('update:start', newStart)
        this.$emit('update:duration', newDuration)
      }
    },
    calculateEnd() {
      let start = parseInt(this.start)
      let duration = parseInt(this.duration)
      if(!Number.isNaN(start) && !Number.isNaN(duration)) {
        this.end = start + duration
      }
    },
    update(key, value) {
      this.$emit('update:' + key, value)
    },
    submit() {
      this.$emit('submit')
      if(this.mode !== 'new') {
        this.isEditing = !this.isEditing
      }
    }
  },
  components: {
    TextEditor
  }
}
</script>

<style lang="scss">
.clip {
  position: relative;
  padding: 1rem;
  background-color: rgba(blue, 0.15);
  > .props {
    > .prop {
      display: flex;
      align-items: center;
      line-height: 1;
      margin: 0.25rem 0;
      > label {
        margin-right: 0.5rem;
        $font-size: 0.875rem;
        width: 4 * $font-size;
        font-size: $font-size;
        white-space: nowrap;
        color: rgba(black, 0.5);
      }
      > .computed {
        flex-shrink: 0;
        margin-left: 0.25rem;
      }
    }
  }
  > .summary {
    > .url {
      line-height: 1.25;
      word-break: break-all;
    }
    > .playback {
      margin: 0.5rem 0;
      font-size: 0.875rem;
      color: rgba(black, 0.65);
    }
  }
  > .actions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
