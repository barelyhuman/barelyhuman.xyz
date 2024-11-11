import defaultTheme from 'tailwindcss/defaultTheme'
import { addIconSelectors } from '@iconify/tailwind'

/**@type {import("tailwindcss").Config}*/
export default {
  content: ['./src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        lime: '#b0e600',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      height: {
        'header-height': 'var(--header-height)',
      },
    },
  },
  plugins: [addIconSelectors(['ph'])],
}
