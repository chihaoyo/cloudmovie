<template>
  <div>
    <nuxt/>
  </div>
</template>

<style lang="scss">
html, body, input, select {
  font-family: "SF Pro Text", sans-serif;
  font-size: 16px;
  word-spacing: normal;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: border-box;
  margin: 0;
}
button {
  appearance: none;
  font-size: 1rem;
  padding: 0.5rem;
  border: none;
  background-color: rgba(blue, 0.65);
  color: rgba(white, 0.95);
  font-weight: bold;
  box-shadow: 0 2px 8px 0 rgba(black, 0.25);
  cursor: pointer;

  &:focus {
    outline: none;
  }
}
.flex-grow {
  flex-grow: 1;
}
</style>
