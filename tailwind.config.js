/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'game-green': '#0e5e2f',
                'game-dark': '#0a4020',
            }
        },
    },
    plugins: [],
}
