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
    "play_start": "Starts from {timeString}",
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
<div class="clip" :id="clipID" :class="{ 'is-editing': isEditing }">
  <div class="props" v-if="isEditing">
    <div class="prop">
      <input type="text" v-model="url" @input="update('url')" :placeholder="$t('movie_url')" class="flex-grow" />
    </div>
    <div class="prop">
      <input type="text" v-model="name" @input="update('name')" :placeholder="$t('movie_name')" class="flex-grow" />
    </div>
    <div class="prop">
      <label>{{ $t('movie_type') }}</label>
      <div class="select">
        <select :value.sync="type" @input="e => update('type', e.target.value)">
          <option v-for="clipType of clipTypes" :key="clipType" :value="clipType">{{ $t('clip_type_' + clipType) }}</option>
        </select>
      </div>
    </div>
    <div class="prop">
      <label>{{ $t('movie_duration') }}</label>
      <input type="text" v-model="duration" @input="update('duration')" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ durationTimeString }}</span>
    </div>
    <div class="prop" v-if="type === 'video'">
      <label>{{ $t('movie_start') }}</label>
      <input type="text" v-model="start" @input="val => update('start', val)" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ startTimeString }}</span>
    </div>
    <div class="prop" v-if="type === 'video'">
      <label>{{ $t('movie_end') }}</label>
      <input type="text" v-model="end" @input="update('end')" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ endTimeString }}</span>
    </div>
    <div class="prop" v-if="type === 'video'">
      <label>{{ $t('movie_background') }}</label>
      <input type="text" v-model="bpd" @input="update('bpd')" :placeholder="$t('movie_second')" class="number" />
      <span class="computed">{{ bpdTimeString }}</span>
    </div>
  </div>
  <div class="preview" v-else>
    <div class="thumbnail" v-if="thumbnailStyles" :style="thumbnailStyles"></div>
    <div class="summary">
      <a class="name" :href="url" target="_blank" :class="name ? ['font-weight-bold'] : ['font-size-small', 'break-all']">{{ name ? name : url }}</a>
      <div class="playback">
        <div v-if="start > 0">{{ $t('play_start', {timeString: startTimeString}) }}</div>
        <div>{{ $t('play_duration', {timeString: durationTimeString}) }}</div>
      </div>
    </div>
  </div>
  <div class="actions" v-if="!isSelecting">
    <button @click="submit" :class="{ primary: !ref }">{{ isEditing ? (ref ? $t('button_finish') : $t('button_add')) : $t('button_edit') }}</button>
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
      if(this.type === 'video' && util.isYouTube(this.url)) {
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
      if(!val) {
        val = this[key]
      }
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
          this.url = this.name = this.duration = this.start = this.end = this.bpd = null
        }
      } else {
        this.isEditing = !this.isEditing
      }
    }
  }
}
</script>

<style lang="scss">
@import '~assets/variables.scss';

.clip {
  position: relative;
  margin: 0.5rem;
  width: 85%;
  @include above-break-point {
    width: 12rem;
    &.is-editing {
      width: 18rem;
    }
  }
  background-color: rgba($secondary-text-color, 0.15);
  cursor: default;

  > .props {
    padding: 0.75rem;
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
        color: $tertiary-text-color;
      }
      > .computed {
        flex-shrink: 0;
        margin-left: 0.25rem;
        font-size: 0.75rem;
        color: $tertiary-text-color;
      }
    }
  }
  > .preview {
    display: flex;
    align-items: flex-start;
    > .thumbnail {
      flex-shrink: 0;
      width: 6rem;
      background-size: 186%;
      background-repeat: repeat;
      background-position: center center;
      &:after {
        content: '';
        display: block;
        width: 100%;
        padding-bottom: 100%;
      }
    }
    @include above-break-point {
      display: block;
      > .thumbnail {
        width: 100%;
        background-size: 104%;
        &:after {
          padding-bottom: 56.25%;
        }
      }
    }
    > .summary {
      padding: 0.75rem;
      > .name {
        display: block;
        line-height: 1.25;
      }
      > .playback {
        margin: 0.5rem 0;
        font-size: 0.75rem;
        color: $tertiary-text-color;
      }
    }
  }
  > .actions {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
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
    padding: 0.375rem 0.5rem;
    color: $secondary-text-color;
    font-size: 0.75rem;
    font-weight: bold;
    background: white;
  }
}
</style>
