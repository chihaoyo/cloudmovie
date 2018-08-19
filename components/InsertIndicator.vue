<template>
<div class="insert-indicator">
  <div class="author" :style="backgroundColor">{{ author ? author : '匿名者' }}</div>
  <div class="bar" :style="backgroundColor"></div>
</div>
</template>

<script>
export default {
  props: ['author', 'color'],
  computed: {
    backgroundColor() {
      return { backgroundColor: this.color }
    }
  }
}
</script>

<style lang="scss">
@import '~assets/variables.scss';

.insert-indicator {
  $width: 0.25rem;
  $height: 3rem;

  position: relative;
  height: $height;
  width: 0;
  overflow: visible;

  > .author {
    position: absolute;
    top: -1.25rem;
    left: -$width / 2;
    padding: 0.25rem;
    font-size: 0.75rem;
    line-height: 1;
    color: rgba(black, 0.95);
    background-color: rgba(blue, 0.65);
    word-break: keep-all;
  }
  > .bar {
    position: absolute;
    top: 0;
    left: -$width / 2;
    width: $width;
    height: $height;
    background-color: rgba(blue, 0.65);
  }
}
</style>
