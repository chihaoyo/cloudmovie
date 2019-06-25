<template>
<div class="insert-indicator" :class="{ self: self }">
  <div class="author" :style="backgroundColor">{{ author ? author : (self ? '我' : '匿名者') }}</div>
  <div class="bar" :style="backgroundColor"></div>
</div>
</template>

<script>
export default {
  props: ['author', 'color', 'self'],
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
  $offset: 1rem;

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
    color: rgba($primary-text-color, 0.95);
    background-color: rgba($primary-text-color, 0.65);
    word-break: keep-all;
  }
  > .bar {
    position: absolute;
    top: 0;
    left: -$width / 2;
    width: $width;
    height: $height;
    background-color: rgba($primary-text-color, 0.65);
  }

  &.self {
    > .author {
      top: -2.25rem;
      font-weight: bold;
    }
    > .bar {
      top: -$offset;
      height: $height + $offset;
    }
  }
}
</style>
