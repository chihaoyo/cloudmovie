<template>
<div class="page comp">
  <nav>
    <nuxt-link class="home" :to="{ path: '/' }"></nuxt-link>
    <div class="nav-body">
      <div class="title"><text-editor :value.sync="title" placeholder="文件標題" @input="val => firebaseSetMovie(movieID, { title: val })" class="red font-weight-bold" /></div>
      <div class="my-title"><text-editor :value.sync="myTitle" placeholder="我的顯示名稱" @input="val => localUpdate('myTitle', val)" class="red" /></div>
    </div>
  </nav>
  <div class="control-panel">
    <clip :movieID="movieID" @submit="newClip => createClip(newClip)"/>
    <div class="actions">
      <button @click="play" class="red">播放</button>
      <button @click="stop">停止</button>
      <button @click="generateTestData">來點測試資料吧</button>
    </div>
  </div>
  <div class="timeline" @click="timelineClickHandler">
    <template v-for="(clip, index) of timeline">
      <insert-indicator :author="myTitle" v-if="index === insertAt" :key="'insert-indicator-' + clip.id" />
      <clip @click.native.stop :movieID="movieID" :clipID="clip.id" :key="clip.id" />
    </template>
    <insert-indicator :author="myTitle" v-if="insertAt >= timeline.length" />
  </div>
  <pre>{{ JSON.stringify(timeline, null, 2) }}</pre>
  <pre>
    <div class="records">
      <div class="record" v-for="(record, index) of history" :key="index">{{ record }}</div>
    </div>
  </pre>
</div>
</template>

<script>
import * as util from '~/lib/util'
import * as ACTIONS from '~/lib/actions'
import TextEditor from '~/components/TextEditor'
import Clip from '~/components/Clip'
import InsertIndicator from '~/components/InsertIndicator'
import knowsFirebase from '~/interfaces/knowsFirebase'

export default {
  mixins: [knowsFirebase],
  data() {
    return {
      ref: null,
      title: null,
      timeline: [],
      history: [],
      myID: null,
      myTitle: null,
      global: {
        defaultDuration: 4,
        durationExtension: 0 // add extra time to each clip for slow internet connection
      },
      insertAt: 0,
      isPlaying: false,
      playingAt: -1,
      playbackHandle: null,
      loop: false
    }
  },
  computed: {
    movieID() {
      return this.$route.params.id
    }
  },
  watch: {
    myTitle() {
      if(this.myID) {
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
    this.ref = this.db.collection('movies').doc(this.movieID)
    this.ref.onSnapshot(snapshot => {
      let data = snapshot.data()
      this.title = data.title
    })
    this.ref.collection('timeline').orderBy('index').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        let changeType = change.type
        let id = change.doc.id
        let data = Object.assign({}, change.doc.data(), { id })
        if(changeType === 'added') {
          if(this.timeline.length < 1) {
            this.timeline.push(data)
          } else {
            let index = this.timeline.findIndex(clip => clip.index >= data.index)
            if(index < 0) {
              this.timeline.push(data)
            } else {
              this.timeline.splice(index, 0, data)
            }
          }
        } else if(changeType === 'modified') {
          Object.assign(this.timeline.find(clip => clip.id === id), data)
        } else if(changeType === 'removed') {
          let index = this.timeline.findIndex(clip => clip.id === id)
          if(index > -1) {
            this.timeline.splice(index, 1)
          }
          this.shiftClips(index, -1)
        }
      })
    })
    this.ref.collection('onlineCollaborators').add({
      title: this.myTitle,
      insertAt: this.insertAt
    }).then(docRef => {
      this.myID = docRef.id
    })
    window.addEventListener('beforeunload', event => {
      this.ref.collection('onlineCollaborators').doc(this.myID).delete()
    })
  },
  methods: {
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
        let clipWindow = window.open(clipToPlay.url)
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
    localUpdate(key, val) {
      this.$set(this, key, util.validate(val))
    },
    shiftClips(fromIndex, offset) {
      return this.db.collection('movies').doc(this.movieID).collection('timeline').where('index', '>=', fromIndex).get().then(snapshot => {
        let batch = this.db.batch()
        snapshot.forEach(doc => {
          batch.update(doc.ref, { index: doc.data().index + offset })
        })
        return batch.commit()
      })
    },
    createClip(newClip) {
      let index = this.insertAt
      // shift all clips after insersion point
      this.shiftClips(index, 1).then(() => {
        newClip.index = index
        this.db.collection('movies').doc(this.movieID).collection('timeline').add(newClip)
      })
    },
    generateTestData() {
      if(!this.db) {
        this.firebaseError()
        return
      }
      [
        'https://ask.watchout.tw/games/2018-taipei',
        'https://vuejs.org/v2/guide/list.html',
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort',
        'https://www.flickr.com/photos/comickerblue/'
      ].forEach((url, index) => {
        setTimeout(() => {
          let newClip = {}
          newClip.url = url
          newClip.duration = this.global.defaultDuration
          this.createClip(newClip)
        }, index * 1000)
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
    > .actions {
      margin: 1rem;
      > button:not(:last-child) {
        margin-right: 0.5rem;
      }
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
  > pre {
    background-color: rgba(black, 0.15);
    padding: 1rem;
    font-size: 0.75rem;
  }
}
</style>
