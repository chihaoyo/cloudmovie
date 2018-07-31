<template>
<div class="text-editor">
  <input type="text" :value="value" ref="inputElement" :placeholder="placeholder" :disabled="disabled" @input="$emit('input', $event.target.value)" @focus="isFocused = true" @blur="isFocused = false" />
</div>
</template>

<script>
export default {
  props: ['value', 'placeholder', 'disabled'],
  data() {
    return {
      isFocused: false
    }
  }
}
</script>

<style lang="scss">
.text-editor {
  margin: 0.25rem 0;
  > input {
    appearance: none;
    padding: 0.25rem;
    border: none;
    border-bottom: 1px solid grey;
    background: none;
    font-size: 1rem;

    &:focus {
      background: rgba(white, 0.25);
      outline: none;
    }
  }
}
</style>
