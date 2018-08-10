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
      firebase.initializeApp(firebaseInitConfig)
      this.db = firebase.firestore()

      const settings = {
        timestampsInSnapshots: true
      }
      this.db.settings(settings)
    },
    firebaseError() {
      console.error('Something is wrong with Firebase')
    }
  }
}
