<i18n>
{
  "en":{
    "movie_title": "Movie title",
    "my_title": "My title",
    "play_loop": "Play loop",
    "play_once": "Play once",
    "stop": "Stop",
    "select": "Select",
    "cancel_select": "Cancel select",
    "cut_paste": "Move",
    "remove": "Remove",
    "confirm_remove": "Confirm remove",
    "reindex": "Reindex",
    "download": "Download",
    "show_console": "Show console",
    "hide_console": "Hide console",
    "show_add_clip": "Add clip",
    "hide_add_clip": "Hide add clip"
  },
  "tw":{
    "movie_title": "文件標題",
    "my_title": "我的顯示名稱",
    "play_loop": "重覆播放",
    "play_once": "一次播放",
    "stop": "停止",
    "select": "選取",
    "cancel_select": "取消選取",
    "cut_paste": "移動",
    "remove": "刪除",
    "confirm_remove": "確認刪除",
    "reindex": "重新排序",
    "download": "下載",
    "show_console": "顯示除錯訊息",
    "hide_console": "隱藏除錯訊息",
    "show_add_clip": "新增 clip",
    "hide_add_clip": "隱藏新增介面"
  }
}
</i18n>
<template>
<div class="page comp">
  <nav>
    <nuxt-link class="home" :to="{ path: '/' }"></nuxt-link>
    <div class="nav-body">
      <div class="title">
        <input type="text" v-model="title" :placeholder="$t('movie_title')" class="primary font-weight-bold" />
      </div>
      <div class="my-title">
        <input type="text" v-model="myTitle" :placeholder="$t('my_title')" class="primary" />
      </div>
    </div>
    <div class="langs">
      <nuxt-link class="lang" key="tw" :to="switchLocalePath('tw')">中文</nuxt-link>
      <nuxt-link class="lang" key="en" :to="switchLocalePath('en')">English</nuxt-link>
    </div>
  </nav>
  <div class="control-panel">
    <div class="add-clip" v-if="showAddClip">
      <clip :movieID="movieID" @submit="newClip => remoteAddClips([newClip])"/>
    </div>
    <div class="actions">
      <template v-if="!isPlaying && !isSelecting">
        <button @click="showAddClip = !showAddClip" :class="{ primary: !showAddClip }">{{ showAddClip ? $t('hide_add_clip') : $t('show_add_clip') }}</button>
      </template>
      <template v-if="!isPlaying && !isSelecting && !showAddClip">
        <button @click="playLoop" class="primary">{{ $t('play_loop') }}</button>
        <button @click="playOnce" class="primary">{{ $t('play_once') }}</button>
      </template>
      <template v-if="isPlaying && !isSelecting && !showAddClip">
        <button @click="stop" class="primary">{{ $t('stop') }}</button>
      </template>
      <template v-if="!isPlaying && !showAddClip">
        <button @click="toggleSelection">{{ isSelecting ? $t('cancel_select') : $t('select') }}</button>
        <button @click="uiCutPaste" v-if="selection.length > 0">{{ $t('cut_paste') }}</button>
        <button @click="uiRemove" v-if="selection.length > 0">{{ confirmRemove ? $t('confirm_remove') : $t('remove') }}</button>
        <button @click="uiReindex">{{ $t('reindex') }}</button>
      </template>
      <template v-if="!isPlaying && !showAddClip && !isSelecting">
        <a class="button" :href="timelineJSON" :download="timelineJSONFileName">{{ $t('download') }}</a>
        <button @click="showConsole = !showConsole">{{ showConsole ? $t('hide_console') : $t('show_console') }}</button>
      </template>
      <div class="summary">
        <div>clip 總數 {{ clipCount }}</div>
        <div>播放長度總計 {{ totalDurationString }}</div>
      </div>
    </div>
  </div>
  <div class="timeline" @click="timelineClickHandler">
    <template v-for="(clip, index) of timeline">
      <insert-indicator v-for="profile of onlineCollaborators.filter(profile => profile.insertAt === index)" v-if="profile.id !== myID" :author="profile.title" :color="profile.color" :key="'insert-indicator-' + profile.id" />
      <insert-indicator :author="myTitle" :color="myColor" :self="true" v-if="index === insertAt" :key="'insert-indicator-' + clip.id" />
      <clip @click.native.stop :movieID="movieID" :clipID="clip.id" :isSelecting="isSelecting" :key="clip.id" @select="updateSelection" />
    </template>
    <insert-indicator v-for="profile of onlineCollaborators.filter(profile => profile.insertAt >= timeline.length)" v-if="profile.id !== myID" :author="profile.title" :color="profile.color" :key="'insert-indicator-' + profile.id" />
    <insert-indicator :author="myTitle" :color="myColor" :self="true" v-if="insertAt >= timeline.length" />
  </div>
  <div class="console" v-if="showConsole">
    <pre>insertAt {{ insertAt }}</pre>
    <pre>{{ JSON.stringify(timeline, null, 2) }}</pre>
    <pre>
      <div class="records">
        <div class="record" v-for="(record, index) of history" :key="index">{{ record }}</div>
      </div>
    </pre>
  </div>
</div>
</template>

<script>
import colors from '~/lib/colors'
import * as util from '~/lib/util'
import * as ACTIONS from '~/lib/actions'
import Clip from '~/components/Clip'
import InsertIndicator from '~/components/InsertIndicator'
import knowsFirebase from '~/interfaces/knowsFirebase'
import knowsVersioning from '~/interfaces/knowsVersioning'

export default {
  mixins: [knowsFirebase, knowsVersioning],
  data() {
    return {
      ref: null,
      title: null,
      timeline: [],
      onlineCollaborators: [],
      history: [],
      myID: null,
      myColor: colors[Math.floor(Math.random() * colors.length)],
      myTitle: null,
      global: {
        defaultDuration: 4,
        durationExtension: 0 // add extra time to each clip for slow internet connection
      },
      clipMoveBuffer: {},
      batch: null,
      insertAt: 0,
      isSelecting: false,
      selection: [],
      confirmRemove: false,
      isPlaying: false,
      playingAt: -1,
      playbackHandle: null,
      loop: false,
      showConsole: false,
      showAddClip: false
    }
  },
  computed: {
    movieID() {
      return this.$route.params.id
    },
    timelineJSON() {
      let movie = {
        title: this.title,
        timeline: this.timeline
      }
      return 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(movie))
    },
    timelineJSONFileName() {
      return 'cloudmovie-' + this.movieID + '-' + new Date().getTime() + '.json'
    },
    clipCount() {
      return Array.isArray(this.timeline) ? this.timeline.length : 0
    },
    totalDuration() {
      let seconds = 0
      if(Array.isArray(this.timeline)) {
        this.timeline.forEach(item => {
          seconds = seconds + item.duration
        })
      }
      return seconds
    },
    totalDurationString() {
      return util.timeString(this.totalDuration)
    }
  },
  watch: {
    title() {
      if(this.title) {
        this.firebaseSetMovie(this.movieID, { title: this.title })
      }
    },
    myTitle() {
      if(this.myID) {
        this.localUpdate('myTitle', this.myTitle)
        this.ref.collection('onlineCollaborators').doc(this.myID).update({ title: this.myTitle })
      }
    },
    insertAt() {
      if(this.myID) {
        this.ref.collection('onlineCollaborators').doc(this.myID).update({ insertAt: this.insertAt })
      }
    }
  },
  mounted() {
    if(!this.db) {
      this.firebaseError()
      return
    }
    if(!this.movieID) {
      return
    }
    this.ref = this.getMovieRef()
    this.ref.onSnapshot(snapshot => {
      let data = snapshot.data()
      this.title = data.title
    })
    this.ref.collection('timeline').orderBy('index').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        let changeType = change.type
        let id = change.doc.id
        let data = change.doc.data()
        if(changeType === 'added') {
          this.localAddClip(id, data)
        } else if(changeType === 'modified') {
          this.localUpdateClip(id, data)
        } else if(changeType === 'removed') {
          this.localRemoveClip(id)
        }
      })
    })
    this.ref.collection('onlineCollaborators').orderBy('insertAt').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        let changeType = change.type
        let id = change.doc.id
        let data = change.doc.data()
        if(changeType === 'added') {
          this.localAddCollaborator(id, data)
        } else if(changeType === 'modified') {
          this.localUpdateCollaborator(id, data)
        } else if(changeType === 'removed') {
          this.localRemoveCollaborator(id)
        }
      })
    })
    this.ref.collection('onlineCollaborators').add({
      title: this.myTitle,
      color: this.myColor,
      insertAt: this.insertAt
    }).then(docRef => {
      this.myID = docRef.id
    })
    window.addEventListener('beforeunload', this.goOffline)
    window.addEventListener('unload', this.goOffline)
  },
  beforeDestroy() {
    this.goOffline()
  },
  methods: {
    localUpdate(key, val) {
      this.$set(this, key, util.validate(val))
    },
    getMovieRef() {
      return this.db.collection('movies').doc(this.movieID)
    },
    getClipRef(clipID) {
      return this.getMovieRef().collection('timeline').doc(clipID)
    },
    localAddCollaborator(id, data) {
      let newCollaborator = Object.assign(data, { id })
      this.onlineCollaborators.push(newCollaborator)
    },
    localUpdateCollaborator(id, data) {
      Object.assign(this.onlineCollaborators.find(profile => profile.id === id), data)
    },
    localRemoveCollaborator(id) {
      let index = this.onlineCollaborators.findIndex(profile => profile.id === id)
      if(index > -1) {
        this.onlineCollaborators.splice(index, 1)
      }
    },
    localAddClip(id, data) {
      let newClip = Object.assign(data, { id })
      if(this.timeline.length < 1) {
        this.timeline.push(newClip)
      } else {
        let index = this.timeline.findIndex(clip => clip.index >= data.index)
        if(index < 0) {
          this.timeline.push(newClip)
        } else {
          this.timeline.splice(index, 0, newClip)
        }
      }
    },
    localInsertClip(id, data, index) {
      let newClip = Object.assign(data, { id })
      this.timeline.splice(index, 0, newClip)
    },
    localUpdateClip(id, data) {
      let clip = this.timeline.find(clip => clip.id === id)
      if(clip) {
        Object.assign(clip, data)
        this.timeline.sort((a, b) => a.index - b.index)
      }
    },
    localRemoveClip(id) {
      let removedClip = null
      let index = this.timeline.findIndex(clip => clip.id === id)
      if(index > -1) {
        removedClip = this.timeline.splice(index, 1).pop()
        if(index < this.insertAt) {
          this.insertAt = this.insertAt - 1
        }
      }
      return removedClip
    },
    toggleSelection() {
      this.isSelecting = !this.isSelecting
      this.selection = []
    },
    updateSelection(clipID) {
      let index = this.selection.indexOf(clipID)
      if(index < 0) {
        this.selection.push(clipID)
      } else {
        this.selection.splice(index, 1)
      }
    },
    sortSelection() {
      this.selection.sort((a, b) => this.timeline.find(clip => clip.id === a).index - this.timeline.find(clip => clip.id === b).index)
    },
    sortSelectionInReverse() {
      this.selection.sort((a, b) => this.timeline.find(clip => clip.id === b).index - this.timeline.find(clip => clip.id === a).index)
    },
    uiCutPaste() {
      if(this.selection.length < 1) {
        return
      }
      this.batch = this.db.batch()

      let cutClips = []
      this.sortSelection()
      this.selection.forEach(clipID => {
        cutClips.push(this.localRemoveClip(clipID))
      })
      cutClips.forEach(clip => {
        this.localInsertClip(clip.id, clip, this.insertAt)
        this.insertAt = this.insertAt + 1
      })
      this.bufferReindex()
      this.remoteMoveClips().then(() => {
        this.batch = null
      })
    },
    uiRemove() {
      if(this.confirmRemove) {
        this.remoteRemoveClips().then(() => {
          this.selection = []
          this.batch = null
        })
      }
      this.confirmRemove = !this.confirmRemove
      if(this.confirmRemove) {
        setTimeout(() => { this.confirmRemove = false }, 4000)
      }
    },
    uiReindex() {
      this.bufferReindex()
      this.remoteMoveClips()
    },
    bufferReindex() {
      this.timeline.forEach((clip, count) => {
        this.bufferMoveClipTo(clip.id, count)
      })
    },
    bufferMoveClipTo(clipID, to) {
      if(!this.clipMoveBuffer[clipID]) {
        this.clipMoveBuffer[clipID] = {}
      }
      let clip = this.timeline.find(clip => clip.id === clipID)
      if(clip && clip.index !== to) {
        this.clipMoveBuffer[clipID].to = to
      }
    },
    bufferMoveClipBy(clipID, by) {
      if(!this.clipMoveBuffer[clipID]) {
        this.clipMoveBuffer[clipID] = { by: 0 }
      }
      this.clipMoveBuffer[clipID].by = this.clipMoveBuffer[clipID].by + by
    },
    bufferMoveRangeOfClipsBy(fromIndex, by) {
      this.timeline.filter(clip => clip.index >= fromIndex).forEach(clip => {
        this.bufferMoveClipBy(clip.id, by)
      })
    },
    registerClipMoveBufferToBatch(skipClipIDs = []) {
      if(!this.batch) {
        this.batch = this.db.batch()
      }
      for(let clipID in this.clipMoveBuffer) {
        let clip = this.timeline.find(clip => clip.id === clipID)
        if(clip && !skipClipIDs.includes(clipID)) {
          let clipBuffer = this.clipMoveBuffer[clipID]
          if(clipBuffer) {
            let ref = this.getClipRef(clipID)
            if(ref) {
              if(clipBuffer.hasOwnProperty('to')) {
                this.batch.update(ref, { index: clipBuffer.to })
              } else if(clipBuffer.hasOwnProperty('by')) {
                this.batch.update(ref, { index: clip.index + clipBuffer.by })
              }
            }
          }
        }
      }
      this.clipMoveBuffer = {}
    },
    remoteAddClips(clips) {
      this.batch = this.db.batch()
      let index = this.insertAt
      // shift all clips after insersion point
      this.bufferMoveRangeOfClipsBy(index, clips.length)
      this.remoteMoveClips().then(() => {
        this.batch = null
        clips.forEach(clip => {
          clip.index = index
          this.getMovieRef().collection('timeline').add(clip)
          index = index + 1
        })
      })
    },
    remoteRemoveClips() {
      this.batch = this.db.batch()
      this.sortSelection()

      let pendingRemoval = []
      for(let clipID of this.selection) {
        let index = this.timeline.find(clip => clip.id === clipID).index
        this.batch.delete(this.getClipRef(clipID))
        this.bufferMoveRangeOfClipsBy(index + 1, -1)
        pendingRemoval.push(clipID)
      }
      this.registerClipMoveBufferToBatch(pendingRemoval)
      return this.batch.commit()
    },
    remoteMoveClips() {
      // DO NOT reset batch here
      this.registerClipMoveBufferToBatch()
      return this.batch.commit()
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
        let width = clip.offsetWidth
        if(!rows.includes(top)) {
          rows.push(top)
        }
        clipPositions.push({ index: i, left, top, width })
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
        if(mouseX < targetClipPositions[i].left + targetClipPositions[i].width / 2) {
          targetIndex = targetClipPositions[i].index
          break
        }
      }
      if(targetIndex === null) {
        // next row first clip OR just 0
        targetIndex = targetClipPositions.length > 0 ? targetClipPositions[targetClipPositions.length - 1].index + 1 : 0
      }
      this.insertAt = targetIndex
    },
    playOnce() {
      this.loop = false;
      this.play();
    },
    playLoop() {
      this.loop = true;
      this.play();
    },
    play() {
      this.isPlaying = true

      // advance playingAt counter
      let playingNext = this.playingAt + 1
      if(this.loop) {
        playingNext = (playingNext + this.timeline.length) % this.timeline.length
      } else if(playingNext >= this.timeline.length) {
        playingNext = -1
      }
      if(playingNext > -1) {
        this.playingAt = playingNext
        // open current clip
        let clipToPlay = this.timeline[this.playingAt]
        let clipDuration = (clipToPlay.duration + this.global.durationExtension) * 1000
        let clipTotalDuration = (clipToPlay.duration + (clipToPlay.bpd ? clipToPlay.bpd : 0) + this.global.durationExtension) * 1000
        let clipURL = clipToPlay.url
        if(clipToPlay.type === 'video' && util.isYouTube(clipURL)) {
          clipURL = 'https://youtube.com/embed/' + util.getYouTubeID(clipURL) + '?showinfo=0&modestbranding=1&controls=0&autoplay=1&start=' + (clipToPlay.start > 0 ? clipToPlay.start : '0')
        }
        let clipWindow = window.open(clipURL)
        // schedule to close current clip
        setTimeout(() => {
          try {
            clipWindow.close()
          } catch(error) {
            console.error('Cannot close window', clipWindow)
          }
        }, clipTotalDuration)

        // schedule to open next clip
        this.playbackHandle = setTimeout(this.play, clipDuration)
      } else {
        this.stop()
      }
    },
    stop() {
      this.isPlaying = false
      this.playingAt = -1
      if(this.playbackHandle) {
        clearTimeout(this.playbackHandle)
      }
    },
    goOffline(event) {
      let message = 'Leaving?'
      if(this.ref) {
        let doc = this.ref.collection('onlineCollaborators').doc(this.myID)
        if(doc) {
          doc.delete()
        }
      }
      if(event) {
        event.returnValue = message
      }
      return message
    }
  },
  components: {
    Clip,
    InsertIndicator
  }
}
</script>

<style lang="scss">
@import '~assets/styles.scss';

.page.comp {
  > nav {
    > .nav-body {
      flex-grow: 1;
      display: flex;
      padding: 0.75rem 0.25rem;
      > .title {
        flex-grow: 1;
        margin: 0.25rem;
      }
      > .my-title {
        margin: 0.25rem;
      }
    }
  }
  > .control-panel {
    padding: 0.5rem;
    background: white;
    position: sticky;
    top: 0;
    z-index: 1;
    > .add-clip {
      padding: 0.5rem;
    }
    > .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      &:not(:last-child) {
        margin-bottom: 0.5rem;
      }
      > button, > .button {
        margin: 0.25rem;
      }
      > .summary {
        margin: 0 0.5rem;
        font-size: 0.875rem;
        color: $secondary-text-color;
      }
    }
  }
  > .timeline {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    padding: 2.5rem 0.5rem 2rem;
    cursor: pointer;
    overflow: hidden;
  }
  > .console {
      pre {
      background-color: rgba(black, 0.15);
      padding: 1rem;
      font-size: 0.625rem;
    }
  }
}
</style>
