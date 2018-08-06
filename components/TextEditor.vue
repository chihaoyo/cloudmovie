<template>
<div class="text-editor">
  <input type="text" :value="value" ref="inputElement" :placeholder="placeholder" :disabled="disabled" @input="atInput" @focus="isFocused = true" @blur="isFocused = false" />
</div>
</template>

<script>
export default {
  props: ['value', 'placeholder', 'disabled'],
  data() {
    return {
      isFocused: false
    }
  },
  methods: {
    atInput(e) {
      this.$emit('input', e.target.value)
    }
  }
}
</script>

<style lang="scss">
@import '~assets/common.scss';

.text-editor {
  > input {
    appearance: none;
    padding: 0.375rem 0.5rem;
    border: none;
    background: rgba(blue, 0.10);
    font-size: 1rem;
    line-height: 1.25;
    width: 100%;
    max-width: none;
    min-width: none;

    &:focus {
      background: rgba(white, 0.5);
      outline: none;
    }
  }
  &.red {
    > input {
      background: rgba($red, 0.25);
    }
  }
  &.number {
    max-width: 4rem;
  }
}
</style>
