export default {
  data() {
    return {
      currentVersionNumber: null
    }
  },
  mounted() {
    if(!this.db) {
      this.firebaseError()
      return
    }
    this.db.collection('latestVersion').doc('detail').onSnapshot(snapshot => {
      let data = snapshot.data()
      console.log(this.currentVersionNumber, data)
      if(data.hasOwnProperty('versionNumber')) {
        if(!this.currentVersionNumber) {
          this.currentVersionNumber = data.versionNumber
        } else if(this.currentVersionNumber !== data.versionNumber) {
          window.location.reload(true)
        }
      }
    })
  },
  methods: {
    updateLatestVersion(versionNumber) {
      if(!this.db) {
        this.firebaseError()
        return
      }
      this.db.collection('latestVersion').doc('detail').update({ versionNumber })
    }
  }
}
