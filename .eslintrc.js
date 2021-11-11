module.exports = {
  extends: ["plugin:vue/vue3-essential", "airbnb-base"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["vue"],
  rules: {
  },
  overrides: [
    {
      files: ["*.vue"],
      rules: {
      },
    },
  ],
};
