<template>
<div class="page index">
  <h1 class="text-align-center">The cloud movie.</h1>
  <div class="actions text-align-center">
    <button class="red" @click="createMovie">建立新的 cloud movie</button>
  </div>
  <div class="movies">
    <div class="movie" v-for="movie of movies" :key="movie.id">
      <div>{{ movie.id }}</div>
      <div>{{ movie.title ? movie.title : '未命名' }}</div>
      <nuxt-link :to="{ name: 'movies-id', params: { id: movie.id } }">
        <button class="red">編輯</button>
      </nuxt-link>
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
    this.db.collection('movies').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        let changeType = change.type
        let id = change.doc.id
        let data = change.doc.data()
        if(changeType === 'added') {
          this.movies.push(Object.assign({}, data, { id }))
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
        timeline: [],
        history: []
      })
    }
  }
}
</script>

<style lang="scss">
@import '~assets/styles.scss';

.page.index {
  padding: 2rem 0;
  > h1 {
    font-size: 1.5rem;
    margin: 1rem;
  }
  > .movies {
    display: flex;
    flex-wrap: wrap;
    margin: 0.25rem;
    padding: 2rem 0;
    > .movie {
      margin: 0.25rem;
      padding: 1rem;
      background-color: rgba($red, 0.5);
    }
  }
}
</style>
