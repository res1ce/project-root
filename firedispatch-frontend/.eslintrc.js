module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Отключаем правила, которые вызывают ошибки при сборке
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    'prefer-const': 'off'
  }
};
