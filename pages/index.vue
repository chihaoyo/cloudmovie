<template>
<div class="page index">
  <h1 class="text-align-center">The cloud movie.</h1>
  <div class="actions text-align-center">
    <nuxt-link :to="{ name: 'comp-id', params: { id: 'abc' } }"><button class="red">建立新的 cloud movie</button></nuxt-link>
  </div>
</div>
</template>

<script>
export default {
}
</script>

<style lang="scss">
@import '~assets/styles.scss';

.page.index {
  padding: 4rem 0;
  background-color: rgba($red, 0.5);
  > h1 {
    font-size: 1.5rem;
    margin: 1rem;
  }
}
</style>
