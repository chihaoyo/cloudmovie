const firebase = require('firebase')
require('firebase/firestore') // Required for side-effects
import firebaseInitConfig from '~/config/firebase'

export default {
  async asyncData() {
    return {
      db: null
    }
  },
  beforeMount() {
    this.firebaseInit()
  },
  methods: {
    firebaseInit() {
      if(firebase.apps.length < 1) {
        firebase.initializeApp(firebaseInitConfig)
      }
      this.db = firebase.firestore()

      const settings = {
        timestampsInSnapshots: true
      }
      this.db.settings(settings)
    },
    firebaseError() {
      console.error('Something is wrong with Firebase')
    },
    firebaseSetMovie(movieID, valueObj) {
      this.db.collection('movies').doc(movieID).set(valueObj, { merge: true })
    }
  }
}
