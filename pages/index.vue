<template>
<div class="page index">
  <nav>
    <nuxt-link class="home" :to="{ path: '/' }"></nuxt-link>
  </nav>
  <div class="primary">
    <h1 class="text-align-center">The cloud movie.</h1>
    <div class="actions text-align-center">
      <button class="red" @click="createMovie">建立新的 cloud movie</button>
    </div>
  </div>
  <div class="movies">
    <div class="movie" v-for="movie of movies" :key="movie.id">
      <div class="id">{{ movie.id }}</div>
      <div class="title">{{ movie.title ? movie.title : '未命名' }}</div>
      <div class="actions">
        <nuxt-link :to="{ name: 'movies-id', params: { id: movie.id } }">
          <button class="red">編輯</button>
        </nuxt-link>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import knowsFirebase from '~/interfaces/knowsFirebase'
export default {
  mixins: [knowsFirebase],
  data() {
    return {
      movies: []
    }
  },
  mounted() {
    if(!this.db) {
      this.firebaseError()
      return
    }
    this.db.collection('movies').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        let changeType = change.type
        let id = change.doc.id
        let data = Object.assign({}, change.doc.data(), { id })
        if(changeType === 'added') {
          let index = this.movies.findIndex(movie => movie.createdAt <= data.createdAt)
          if(index < 0) {
            this.movies.push(data)
          } else {
            this.movies.splice(index, 0, data)
          }
        } else if(changeType === 'modified') {
          Object.assign(this.movies.find(movie => movie.id === id), data)
        } else if(changeType === 'removed') {
          let index = this.movies.findIndex(movie => movie.id === id)
          if(index > -1) {
            this.movies.splice(index, 1)
          }
        }
      })
    })
  },
  methods: {
    createMovie() {
      if(!this.db) {
        this.firebaseError()
        return
      }
      this.db.collection('movies').add({
        title: null,
        createdAt: (new Date()).getTime()
      })
    }
  }
}
</script>

<style lang="scss">
@import '~assets/styles.scss';

.page.index {
  > .primary {
    padding: 2rem 0;
    > h1 {
      font-size: 1.5rem;
      margin: 1rem;
    }
  }
  > .movies {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    padding: 0.25rem;
    > .movie {
      margin: 0.25rem;
      padding: 1rem;
      max-width: 18rem;
      background-color: rgba($red, 0.5);
      > .id {
        font-size: 0.875rem;
        color: $red;
      }
      > .title {
        margin: 0.25rem 0;
        font-size: 1.25rem;
        font-weight: bold;
      }
    }
  }
}
</style>
