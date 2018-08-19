<template>
<div class="clip" :id="clipID">
  <div class="props" v-if="isEditing">
    <div class="prop">
      <label>類型</label>
      <div class="select">
        <select :value.sync="type" @input="e => update('type', e.target.value)">
          <option v-for="clipType of clipTypes" :key="clipType.value" :value="clipType.value">{{ clipType.label }}</option>
        </select>
      </div>
    </div>
    <div class="prop">
      <label>網址</label>
      <text-editor :value.sync="url" @input="val => update('url', val)" placeholder="網址" class="flex-grow" />
    </div>
    <div class="prop">
      <label>名稱</label>
      <text-editor :value.sync="name" @input="val => update('name', val)" placeholder="名稱" class="flex-grow" />
    </div>
    <div class="prop">
      <label>播放長度</label>
      <text-editor :value.sync="duration" @input="val => update('duration', val)" placeholder="秒數" class="number" />
      <span class="computed">{{ durationTimeString }}</span>
    </div>
    <div class="prop">
      <label>開始於</label>
      <text-editor :value.sync="start" @input="val => update('start', val)" placeholder="秒數" class="number" />
      <span class="computed">{{ startTimeString }}</span>
    </div>
    <div class="prop">
      <label>結束於</label>
      <text-editor v-model="end" placeholder="秒數" class="number" />
      <span class="computed">{{ endTimeString }}</span>
    </div>
    <div class="prop">
      <label>背景播放</label>
      <text-editor :value.sync="bpd" @input="val => update('bpd', val)" placeholder="秒數" class="number" />
      <span class="computed">{{ bpdTimeString }}</span>
    </div>
  </div>
  <div class="preview" v-else>
    <div class="thumbnail" v-if="thumbnailStyles" :style="thumbnailStyles"></div>
    <div class="summary">
      <div class="name" :class="name ? ['font-weight-bold'] : ['font-size-small', 'break-all']"><a :href="url" target="_blank">{{ name ? name : url }}</a></div>
      <div class="playback"><span v-if="start > 0">從 {{ startTimeString }} 開始</span><span>播放長度 {{ durationTimeString }}</span></div>
    </div>
  </div>
  <div class="actions">
    <button @click="submit">{{ isEditing ? (ref ? '完成' : '新增') : '編輯' }}</button>
  </div>
  <div class="delete" v-if="ref" @click="doDelete">{{ confirmDelete ? '確認刪除': '刪除' }}</div>
</div>
</template>

<script>
import * as regularExpressions from '~/lib/regularExpressions'
import * as util from '~/lib/util'
import * as CLIP from '~/lib/clip'
import { TYPES as clipTypes } from '~/lib/types'
import TextEditor from '~/components/TextEditor'
import knowsFirebase from '~/interfaces/knowsFirebase'

const springboard = 'https://chihaoyo.net/scripts/'
const videoURLSubstrings = [ 'youtube', 'vimeo' ]

export default {
  mixins: [knowsFirebase],
  props: ['movieID', 'clipID'],
  data() {
    let dataObj = {}
    CLIP.propList.forEach(prop => dataObj[prop] = CLIP.props[prop].default)

    return Object.assign(dataObj, {
      ref: null,
      clipTypes,
      isEditing: !(this.movieID && this.clipID),
      confirmDelete: false,
      end: null
    })
  },
  computed: {
    youtubeID() {
      let id = null
      if(this.url) {
        let match = this.url.match(regularExpressions.youtube)
        if(match) {
          id = match[1]
        }
      }
      return id
    },
    thumbnailStyles() {
      let styles = null
      if(this.youtubeID) {
        styles = { backgroundImage: `url(http://img.youtube.com/vi/${this.youtubeID}/maxresdefault.jpg)` }
      }
      return styles
    },
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
  mounted() {
    if(!this.db) {
      this.firebaseError()
      return
    }
    if(!(this.movieID && this.clipID)) {
      return
    }
    this.ref = this.db.collection('movies').doc(this.movieID).collection('timeline').doc(this.clipID)
    this.ref.onSnapshot(snapshot => {
      let data = snapshot.data()
      CLIP.propList.forEach(prop => this.$set(this, prop, data[prop]))
    })
  },
  watch: {
    url() {
      if(this.url !== '' && this.url !== null && this.url !== undefined && this.name === null) {
        if(videoURLSubstrings.some(substr => this.url.includes(substr))) {
          this.update('type', 'video')
        }
        if(fetch) {
          if(regularExpressions.youtube.test(this.url)) {
            fetch(`${springboard}get-youtube-meta.php?id=${this.youtubeID}`).then(response => {
              return response.json()
            }).then(json => {
              this.update('name', json.title)
            })
          } else {
            fetch(`${springboard}get.php?url=${this.url}`).then(response => {
              return response.text()
            }).catch(error => {
              error = null
            }).then(text => {
              let matches = text.match(/<title.*>(.+)<\/title>/)
              if(Array.isArray(matches)) {
                this.update('name', matches[1])
              }
            })
          }
        }
      }
    },
    duration() {
      this.calculateEnd()
    },
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
    }
  },
  methods: {
    calculateDuration() {
      let start = parseInt(this.start)
      let end = parseInt(this.end)
      if(!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        this.update('duration', end - start)
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
        this.update('start', newStart)
        this.update('duration', newDuration)
      }
    },
    calculateEnd() {
      let start = parseInt(this.start)
      let duration = parseInt(this.duration)
      if(!Number.isNaN(start) && !Number.isNaN(duration)) {
        this.end = start + duration
      }
    },
    update(key, val) {
      if(CLIP.props[key].type === 'int') {
        val = parseInt(val)
      }
      if(['', null, undefined, NaN].includes(val)) {
        val = null
      }
      if(this.clipID) {
        if(!this.ref) {
          this.firebaseError()
        } else {
          this.ref.set({ [key]: val }, { merge: true })
        }
      } else {
        this[key] = val
      }
    },
    submit() {
      if(!this.ref) {
        if(this.movieID && this.url && this.duration) {
          let newClip = {}
          CLIP.propList.forEach(prop => newClip[prop] = this[prop])
          this.$emit('submit', newClip)
        }
      } else {
        this.isEditing = !this.isEditing
      }
    },
    doDelete() {
      if(this.confirmDelete) {
        this.ref.delete()
      }
      this.confirmDelete = !this.confirmDelete
      if(this.confirmDelete) {
        setTimeout(() => { this.confirmDelete = false }, 4000)
      }
    }
  },
  components: {
    TextEditor
  }
}
</script>

<style lang="scss">
@import '~assets/variables.scss';

.clip {
  position: relative;
  background-color: rgba($secondary-color, 0.15);
  cursor: default;

  > .props {
    padding: 1rem;
    > .prop {
      display: flex;
      align-items: center;
      line-height: 1;
      margin: 0.25rem 0;
      > label {
        margin-right: 0.5rem;
        $font-size: 0.875rem;
        width: 4 * $font-size;
        flex-shrink: 0;
        font-size: $font-size;
        white-space: nowrap;
        color: rgba($secondary-color, 0.5);
      }
      > .computed {
        flex-shrink: 0;
        margin-left: 0.25rem;
        font-size: 0.875rem;
        color: rgba($secondary-color, 0.5);
      }
    }
  }
  > .preview {
    > .thumbnail {
      background-size: contain;
      &:after {
        content: '';
        display: block;
        width: 100%;
        padding-bottom: 56.25%;
      }
    }
    > .summary {
      padding: 1rem;
      > .name {
        line-height: 1.25;
      }
      > .playback {
        margin: 0.5rem 0;
        font-size: 0.875rem;
        color: rgba($secondary-color, 0.5);
      }
    }
  }
  > .actions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
  }
  > .delete {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
  }
}
</style>
