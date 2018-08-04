<template>
<div class="insert-indicator">
  <div class="author">{{ author ? author : '匿名者' }}</div>
</div>
</template>

<script>
export default {
  props: ['author']
}
</script>

<style lang="scss">
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
    color: rgba(white, 0.95);
    background-color: rgba(blue, 0.65);
    word-break: keep-all;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: -$width / 2;
    width: $width;
    height: $height;
    background-color: rgba(blue, 0.65);
  }
}
</style>
