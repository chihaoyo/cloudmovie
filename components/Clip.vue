<i18n>
{
  "en":{
    "movie_type": "Type",
    "movie_url": "URL",
    "movie_name": "Name",
    "movie_duration": "Duration",
    "movie_second": "Sec.",
    "movie_start": "Start at",
    "movie_end": "End at",
    "movie_background": "Bgp.",
    "play_start": "Playback starts from {timeString}",
    "play_duration": "Duration {timeString}",
    "button_finish": "Finish",
    "button_add": "Add",
    "button_edit": "Edit",
    "clip_type_webpage": "Webpage",
    "clip_type_video": "Video"
  },
  "tw":{
    "movie_type": "類型",
    "movie_url": "網址",
    "movie_name": "名稱",
    "movie_duration": "播放長度",
    "movie_second": "秒數",
    "movie_start": "開始於",
    "movie_end": "結束於",
    "movie_background": "背景播放",
    "play_start": "從 {timeString} 開始",
    "play_duration": "播放長度 {timeString}",
    "button_finish": "完成",
    "button_add": "新增",
    "button_edit": "編輯",
    "clip_type_webpage": "網頁",
    "clip_type_video": "影片"
  }
}
</i18n>
<template>
<div class="clip" :id="clipID">
  <div class="props" v-if="isEditing">
    <div class="prop">
      <label>{{ $t('movie_type') }}</label>
      <div class="select">
        <select :value.sync="type" @input="e => update('type', e.target.value)">
          <option v-for="clipType of clipTypes" :key="clipType" :value="clipType">{{ $t('clip_type_' + clipType) }}</option>
        </select>
      </div>
    </div>
    <div class="prop">
      <label>{{ $t('movie_url') }}</label>
      <text-editor :value.sync="url" @input="val => update('url', val)" :placeholder="$t('movie_url')" class="flex-grow" />
    </div>
    <div class="prop">
      <label>{{ $t('movie_name') }}</label>
      <text-editor :value.sync="name" @input="val => update('name', val)" :placeholder="$t('movie_name')" class="flex-grow" />
    </div>
    <div class="prop">
      <label>{{ $t('movie_duration') }}</label>
      <text-editor :value.sync="duration" @input="val => update('duration', val)" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ durationTimeString }}</span>
    </div>
    <div class="prop">
      <label>{{ $t('movie_start') }}</label>
      <text-editor :value.sync="start" @input="val => update('start', val)" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ startTimeString }}</span>
    </div>
    <div class="prop">
      <label>{{ $t('movie_end') }}</label>
      <text-editor v-model="end" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ endTimeString }}</span>
    </div>
    <div class="prop">
      <label>{{ $t('movie_background') }}</label>
      <text-editor :value.sync="bpd" @input="val => update('bpd', val)" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ bpdTimeString }}</span>
    </div>
  </div>
  <div class="preview" v-else>
    <div class="thumbnail" v-if="thumbnailStyles" :style="thumbnailStyles"></div>
    <div class="summary">
      <div class="name" :class="name ? ['font-weight-bold'] : ['font-size-small', 'break-all']"><a :href="url" target="_blank">{{ name ? name : url }}</a></div>
      <div class="playback"><span v-if="start > 0">{{ $t('play_start', {timeString: startTimeString}) }}</span><span>{{ $t('play_duration', {timeString: durationTimeString}) }}</span></div>
    </div>
  </div>
  <div class="actions" v-if="!isSelecting">
    <button @click="submit">{{ isEditing ? (ref ? $t('button_finish') : $t('button_add')) : $t('button_edit') }}</button>
  </div>
  <input type="checkbox" v-else class="toggle-select" v-model="isSelected" @change="$emit('select', clipID)" />
  <div class="index" v-if="isSelecting">{{ index }}</div>
</div>
</template>

<script>
import * as regularExpressions from '~/lib/regularExpressions'
import * as util from '~/lib/util'
import * as CLIP from '~/lib/clip'
import * as clipTypes from '~/lib/types'
import TextEditor from '~/components/TextEditor'
import knowsFirebase from '~/interfaces/knowsFirebase'

const springboard = 'http://50.18.115.212/scripts/'
const videoURLSubstrings = [ 'youtube', 'vimeo' ]

export default {
  mixins: [knowsFirebase],
  props: ['movieID', 'clipID', 'isSelecting'],
  data() {
    let dataObj = {}
    CLIP.propList.forEach(prop => dataObj[prop] = CLIP.props[prop].default)

    return Object.assign(dataObj, {
      ref: null,
      clipTypes,
      isEditing: !(this.movieID && this.clipID),
      isSelected: false,
      end: null
    })
  },
  computed: {
    youtubeID() {
      return util.getYouTubeID(this.url)
    },
    thumbnailStyles() {
      let styles = null
      if(util.isYouTube(this.url)) {
        styles = { backgroundImage: 'url(' + util.getYouTubeThumbnailURL(this.url) + ')' }
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
      if(data) {
        CLIP.propList.forEach(prop => this.$set(this, prop, data[prop]))
      }
    })
  },
  watch: {
    isSelecting() {
      if(!this.isSelecting) {
        this.isSelected = false
      } else {
        this.isEditing = false
      }
    },
    url() {
      if(this.url !== '' && this.url !== null && this.url !== undefined && this.name === null) {
        if(videoURLSubstrings.some(substr => this.url.includes(substr))) {
          this.update('type', 'video')
        }
        if(fetch) {
          if(util.isYouTube(this.url)) {
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
          this.url = this.name = this.duration = null
        }
      } else {
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
      background-size: cover;
      background-position: center center;
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
  > .toggle-select {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
  }
  > .index {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.5rem 0.75rem;
    color: $secondary-color;
    font-size: 0.875rem;
    font-weight: bold;
  }
}
</style>
