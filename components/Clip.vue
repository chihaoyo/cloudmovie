<template>
<div class="clip">
  <div>
    <span>類型</span>
    <text-editor v-if="isEditing" :value.sync="type" @input="update('type', $event)" placeholder="類型" />
    <span v-else>{{ type }}</span>
  </div>
  <div>
    <span>網址</span>
    <text-editor v-if="isEditing" :value.sync="url" @input="update('url', $event)" placeholder="網址" />
    <span v-else>{{ url }}</span>
  </div>
  <div>
    <span>開始時間</span>
    <text-editor v-if="isEditing" :value.sync="start" @input="update('start', $event)" placeholder="開始時間" />
    <span v-else>{{ start }}</span>
    <span>=> {{ startTimeString }}</span>
  </div>
  <div>
    <span>長度</span>
    <text-editor v-if="isEditing" :value.sync="duration" @input="update('duration', $event)" placeholder="長度" />
    <span v-else>{{ duration }}</span>
    <span>=> {{ durationTimeString }}</span>
  </div>
  <div>
    <span>結束時間</span>
    <text-editor v-if="isEditing" v-model="end" placeholder="結束時間" />
    <span v-else>{{ end }}</span>
    <span>=> {{ endTimeString }}</span>
  </div>
  <div>
    <span>背景播放長度</span>
    <text-editor v-if="isEditing" :value.sync="bpd" @input="update('bpd', $event)" placeholder="背景播放長度" />
    <span v-else>{{ bpd }}</span>
  </div>
  <button @click="submit">{{ isEditing ? (mode === 'new' ? '新增' : '完成') : '編輯' }}</button>
</div>
</template>

<script>
import * as util from '~/lib/util'
import TextEditor from '~/components/TextEditor'

export default {
  props: ['mode', 'type', 'url', 'start', 'duration', 'bpd'],
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
      this.calculateDuration()
    },
    end() {
      this.calculateDuration()
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
    }
  },
  methods: {
    calculateDuration() {
      let start = parseInt(this.start)
      let end = parseInt(this.end)
      console.log('cal dur', this.start, this.end)
      if(!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        console.log(end - start)
        this.$emit('update:duration', end - start)
      }
    },
    calculateEnd() {
      let start = parseInt(this.start)
      let duration = parseInt(this.duration)
      console.log('cal end', start, duration)
      if(!Number.isNaN(start) && !Number.isNaN(duration)) {
        this.end = start + duration
      }
    },
    update(key, value) {
      console.log('update:' + key, value)
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
  padding: 1rem;
  background-color: #ccc;
}
</style>
